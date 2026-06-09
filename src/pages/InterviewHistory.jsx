import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBriefcase, FiAward, FiTrash2, FiDownload, FiMail, FiLoader, FiArrowLeft, FiCheck, FiAlertCircle, FiChevronRight } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import { getUserInterviewSessions } from '../services/resumeStorage';
import { generateInterviewSessionPDF } from '../utils/pdfGenerator';
import EmailReportModal from '../components/EmailReportModal';
import { db } from '../services/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { useSEO } from '../hooks/useSEO';

const InterviewHistory = () => {
  useSEO('Interview Logs', 'Assess and review your technical practice mock responses and AI assessment reports.');
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      fetchSessions();
    }
  }, [user]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const data = await getUserInterviewSessions(user.uid);
      setSessions(data);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load interview logs');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this completed interview session log?')) return;
    try {
      await deleteDoc(doc(db, 'interview_sessions', id));
      toast.success('Interview session log removed');
      setSessions(prev => prev.filter(s => s.id !== id));
      if (selectedSession?.id === id) {
        setSelectedSession(null);
      }
    } catch (err) {
      toast.error('Failed to delete session log');
    }
  };

  const getScoreColor = (score) => {
    if (score >= 85) return 'text-emerald-500';
    if (score >= 65) return 'text-blue-500';
    return 'text-rose-500';
  };

  return (
    <div className="space-y-8 max-w-4xl pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Interview Logs & Practice History</h1>
        <p className="text-gray-655 dark:text-gray-400">Review past assessment sessions, scores, and AI improvement recommendations.</p>
      </div>

      <AnimatePresence mode="wait">
        {!selectedSession ? (
          /* List View */
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <FiLoader className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-850 border border-gray-200 dark:border-gray-750 rounded-2xl">
                <p className="text-gray-600 dark:text-gray-400 text-lg font-bold">No interview sessions found</p>
                <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">Practice dynamic roles in the Interview Prep dashboard to generate results!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sessions.map((sess) => {
                  const date = sess.createdAt?.toDate ? sess.createdAt.toDate().toLocaleDateString() : new Date(sess.createdAt || 0).toLocaleDateString();
                  return (
                    <motion.div
                      key={sess.id}
                      whileHover={{ y: -2 }}
                      onClick={() => setSelectedSession(sess)}
                      className="bg-white dark:bg-gray-850 border border-gray-200 dark:border-gray-700/80 rounded-2xl p-5 hover:shadow-lg transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 dark:text-white truncate capitalize">
                          {(sess.role || 'General').replace('-', ' ')} Assessment
                        </h3>
                        <div className="flex flex-wrap gap-3 mt-2 text-xs font-semibold text-gray-500 dark:text-gray-450">
                          <span>📅 Date: {date}</span>
                          <span>📝 Questions: {sess.answeredCount || 0}</span>
                          <span>🏆 Grade: {sess.grade || 'C'} ({sess.performance || 'Fair'})</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                        <div className="flex flex-col items-center">
                          <span className={`text-2xl font-black ${getScoreColor(sess.avgScore)}`}>
                            {sess.avgScore}%
                          </span>
                          <span className="text-[9px] uppercase tracking-wider text-gray-450 font-bold">Avg Score</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              generateInterviewSessionPDF(sess, `${sess.role}_interview_log.pdf`);
                            }}
                            className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 rounded-lg text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 transition"
                            title="Download PDF report"
                          >
                            <FiDownload size={14} />
                          </button>
                          <button
                            onClick={(e) => handleDelete(e, sess.id)}
                            className="p-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-900/30 transition"
                            title="Delete record"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        ) : (
          /* Detailed Question Breakdown View */
          <motion.div
            key="details"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Header detail */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-750 pb-4">
              <button
                onClick={() => setSelectedSession(null)}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
              >
                <FiArrowLeft /> Back to Logs list
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => generateInterviewSessionPDF(selectedSession, `${selectedSession.role}_assessment_report.pdf`)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow transition"
                >
                  <FiDownload /> Download PDF
                </button>
                <button
                  onClick={() => setIsEmailModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow transition"
                >
                  <FiMail /> Email PDF
                </button>
                <button
                  onClick={(e) => handleDelete(e, selectedSession.id)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow transition"
                >
                  <FiTrash2 /> Delete Log
                </button>
              </div>
            </div>

            {/* Assessment stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-850 p-6 rounded-2xl border border-gray-200 dark:border-gray-750 shadow-sm text-center">
                <span className="text-[10px] font-bold text-gray-450 uppercase tracking-widest">Average Score</span>
                <p className={`text-4xl font-black mt-1.5 ${getScoreColor(selectedSession.avgScore)}`}>{selectedSession.avgScore}%</p>
              </div>
              <div className="bg-white dark:bg-gray-850 p-6 rounded-2xl border border-gray-200 dark:border-gray-750 shadow-sm text-center">
                <span className="text-[10px] font-bold text-gray-450 uppercase tracking-widest">Grade Rating</span>
                <p className="text-4xl font-black text-purple-600 dark:text-purple-400 mt-1.5">{selectedSession.grade}</p>
              </div>
              <div className="bg-white dark:bg-gray-850 p-6 rounded-2xl border border-gray-200 dark:border-gray-750 shadow-sm text-center">
                <span className="text-[10px] font-bold text-gray-450 uppercase tracking-widest">Assessment Rating</span>
                <p className="text-lg font-black text-gray-800 dark:text-white mt-4">{selectedSession.performance}</p>
              </div>
            </div>

            {/* Question Log */}
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">Detailed Answer Evaluations</h3>
              <div className="space-y-4">
                {(selectedSession.answers || []).map((log) => (
                  <div
                    key={log.questionNum}
                    className="border border-gray-200 dark:border-gray-750 rounded-2xl p-5 bg-white dark:bg-gray-850/60 shadow-sm space-y-4"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white leading-relaxed">
                        {log.questionNum}. {log.question}
                      </h4>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black shrink-0 ${
                        log.score >= 80 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-350' : 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-350'
                      }`}>
                        {log.score}/100
                      </span>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div className="bg-gray-50 dark:bg-gray-900/40 p-3.5 rounded-xl border border-gray-200/50 dark:border-gray-800/40 text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                        <strong className="text-[10px] uppercase text-gray-400 block tracking-wider mb-1">Your Response</strong>
                        {log.userAnswer}
                      </div>

                      <div className="bg-emerald-50/20 dark:bg-emerald-950/5 p-3.5 rounded-xl border border-emerald-100/30 dark:border-emerald-900/10 text-emerald-800 dark:text-emerald-300 leading-relaxed italic">
                        <strong className="text-[10px] uppercase text-emerald-500/80 block tracking-wider mb-1 not-italic font-bold">AI Feedback Rating</strong>
                        {log.feedback}
                      </div>

                      {log.optimal && (
                        <div className="bg-gray-50/40 dark:bg-gray-900/20 p-3.5 rounded-xl border border-gray-200/30 dark:border-gray-800/20 text-gray-600 dark:text-gray-400 leading-relaxed">
                          <strong className="text-[10px] uppercase text-gray-400 block tracking-wider mb-1 font-bold">Model Answer / Key Terms</strong>
                          {log.optimal}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Email Report Modal */}
      {selectedSession && (
        <EmailReportModal
          isOpen={isEmailModalOpen}
          onClose={() => setIsEmailModalOpen(false)}
          reportName={`${selectedSession.role}_assessment_report`}
          reportType="interview_session"
          reportData={selectedSession}
        />
      )}
    </div>
  );
};

export default InterviewHistory;
