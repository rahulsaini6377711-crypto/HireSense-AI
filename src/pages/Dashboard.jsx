import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FiTrendingUp, FiFileText, FiBriefcase, FiTarget, FiCpu, FiAward } from 'react-icons/fi';
import ScoreCard from '../components/ScoreCard';
import AtsScoreCard from '../components/AtsScoreCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';
import { getLatestAnalysisResult, getUserInterviewSessions } from '../services/resumeStorage';
import { useSEO } from '../hooks/useSEO';

const Dashboard = () => {
  useSEO('Dashboard', 'Get a summary of your resume parsing metrics and interview schedules.');
  const navigate = useNavigate();
  const { user } = useAuth();
  const [latestAnalysis, setLatestAnalysis] = useState(null);
  const [interviewSessions, setInterviewSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [analysis, sessions] = await Promise.all([
        getLatestAnalysisResult(user.uid),
        getUserInterviewSessions(user.uid).catch(() => [])
      ]);
      if (analysis) {
        setLatestAnalysis(analysis);
      }
      setInterviewSessions(sessions || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const sessionScores = interviewSessions.map(s => s.averageScore || s.avgScore || 0);
  const avgSessionScore = sessionScores.length > 0
    ? Math.round(sessionScores.reduce((sum, score) => sum + score, 0) / sessionScores.length)
    : 0;
  const bestSessionScore = sessionScores.length > 0 ? Math.max(...sessionScores) : 0;
  const totalQuestionsAttempted = interviewSessions.reduce((sum, s) => sum + (s.answers?.length || 0), 0);

  const stats = [
    { 
      title: 'Resume Score', 
      score: latestAnalysis ? latestAnalysis.atsScore : 0, 
      description: latestAnalysis ? 'Your ATS compatibility score' : 'Upload resume to calculate' 
    },
    { 
      title: 'Profile Strength', 
      score: latestAnalysis ? 85 : 10, 
      description: 'Account completeness' 
    },
    { 
      title: 'Interview Ready', 
      score: interviewSessions.length > 0 ? avgSessionScore : (latestAnalysis ? 65 : 0), 
      description: interviewSessions.length > 0 ? 'Average mock interview grade' : 'Complete a mock session' 
    },
    { 
      title: 'Job Match', 
      score: latestAnalysis ? Math.round(latestAnalysis.atsScore * 1.05 > 100 ? 100 : latestAnalysis.atsScore * 1.05) : 0, 
      description: 'Average job match rating' 
    },
  ];

  const recentActivity = [
    { 
      type: interviewSessions.length > 0 ? 'Mock Interview Attempted' : (latestAnalysis ? 'Resume Analyzed & Saved' : 'Profile Created'), 
      date: interviewSessions.length > 0 
        ? `Scored ${interviewSessions[0].averageScore || interviewSessions[0].avgScore || 0}% on ${interviewSessions[0].level} prep` 
        : (latestAnalysis ? 'Recent analysis report saved' : 'Welcome to HireSense AI'), 
      status: 'success' 
    },
  ];

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome back! Here's your career progress at a glance.
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, staggerChildren: 0.1 }}
        className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {stats.map((stat, index) => (
          <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <ScoreCard {...stat} />
          </motion.div>
        ))}
      </motion.div>

      {/* ATS Analysis Summary */}
      {latestAnalysis ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Latest ATS Resume Analysis
            </h2>
            <button 
              onClick={() => navigate('/resume-analysis')}
              className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Analyze New Resume
            </button>
          </div>
          <div className="bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/50 rounded-3xl p-6 shadow-md backdrop-blur-xl">
            <AtsScoreCard analysis={latestAnalysis} />
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center border border-gray-200 dark:border-gray-700 shadow-md"
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            No Resume Analyzed Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto text-sm">
            Upload your resume now to run an ATS check, evaluate core skills, and receive actionable profile improvement suggestions.
          </p>
          <button
            onClick={() => navigate('/resume-analysis')}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium text-sm shadow-md"
          >
            Get Started
          </button>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="grid md:grid-cols-2 gap-6"
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-md border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <FiFileText className="text-blue-600 dark:text-blue-300" size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Analyze Resume</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Get AI insights</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/resume-analysis')}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Upload Resume
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-md border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <FiBriefcase className="text-purple-600 dark:text-purple-300" size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Interview Prep</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Practice questions</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/interview-prep')}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
          >
            Start Practice
          </button>
        </div>
      </motion.div>

      {/* Interview Readiness Widget */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.45 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-md border border-gray-200 dark:border-gray-750/70 space-y-6"
      >
        <div className="flex items-center justify-between border-b border-gray-150 dark:border-gray-750 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-purple-100 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 rounded-xl">
              <FiAward size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">AI Interview Readiness</h2>
              <p className="text-xs text-gray-600 dark:text-gray-400">Based on your mock practice sessions</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/interview-prep')}
            className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-bold text-xs shadow-md"
          >
            Start Practice
          </button>
        </div>

        {interviewSessions.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-500 dark:text-gray-400 text-sm italic">
              No mock interview sessions attempted yet. Start practicing to see your readiness scores!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 dark:bg-gray-900/40 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 text-center">
              <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest block">Average Score</span>
              <p className="text-3xl font-black text-purple-600 dark:text-purple-450 mt-1">{avgSessionScore}%</p>
              <span className="text-[10px] text-gray-600 dark:text-gray-450 block mt-1">
                {avgSessionScore >= 80 ? 'Interview Ready 🚀' : avgSessionScore >= 60 ? 'Strong Potential 💪' : 'More Practice Needed 📚'}
              </span>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/40 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 text-center">
              <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest block">Best Score</span>
              <p className="text-3xl font-black text-emerald-600 mt-1">{bestSessionScore}%</p>
              <span className="text-[10px] text-gray-600 dark:text-gray-450 block mt-1">Peak performance</span>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/40 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 text-center">
              <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest block">Questions Graded</span>
              <p className="text-3xl font-black text-blue-600 mt-1">{totalQuestionsAttempted}</p>
              <span className="text-[10px] text-gray-600 dark:text-gray-450 block mt-1">Across all categories</span>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/40 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 text-center">
              <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest block">Sessions Completed</span>
              <p className="text-3xl font-black text-amber-600 mt-1">{interviewSessions.length}</p>
              <span className="text-[10px] text-gray-600 dark:text-gray-455 block mt-1">Completed runs</span>
            </div>

            <div className="col-span-2 lg:col-span-4 space-y-3 pt-4 border-t border-gray-100 dark:border-gray-750">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">Recent Session Logs</h3>
              <div className="grid gap-2.5 max-h-[200px] overflow-y-auto pr-1">
                {interviewSessions.slice(0, 3).map((session, i) => {
                  const date = session.createdAt?.toDate 
                    ? session.createdAt.toDate().toLocaleDateString() 
                    : new Date(session.createdAt || 0).toLocaleDateString();
                  
                  return (
                    <div 
                      key={session.id || i}
                      className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-gray-900/20 border border-gray-150 dark:border-gray-800 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <span className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg">
                          <FiCpu size={14} />
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-800 dark:text-gray-200 capitalize">
                              {session.level} Level
                            </span>
                            {session.company && session.company !== 'None' && (
                              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950/20 dark:text-blue-400 uppercase">
                                {session.company}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-500 mt-0.5">📅 Completed on {date}</p>
                        </div>
                      </div>
                      <span className={`text-xs font-black px-2.5 py-1 rounded-lg border ${
                        (session.averageScore || session.avgScore) >= 80 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30' :
                        (session.averageScore || session.avgScore) >= 60 ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-900/30' :
                        'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-455 border-rose-200 dark:border-rose-900/30'
                      }`}>
                        Score: {session.averageScore || session.avgScore || 0}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-md border border-gray-200 dark:border-gray-700"
      >
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          Recent Activity
        </h2>
        <div className="space-y-4">
          {recentActivity.map((activity, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {activity.type}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{activity.date}</p>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full" />
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
