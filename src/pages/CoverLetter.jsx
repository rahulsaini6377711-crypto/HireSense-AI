import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiFileText, FiBriefcase, FiCpu, FiCopy, FiDownload, FiTrash2, FiSave } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import { db } from '../services/firebase';
import { collection, addDoc, getDocs, query, where, orderBy, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { getUserResumes } from '../services/resumeStorage';
import { generateCoverLetterWithGemini } from '../services/geminiService';
import { useSEO } from '../hooks/useSEO';
import jsPDF from 'jspdf';

const CoverLetter = () => {
  useSEO('AI Cover Letter Generator', 'Generate custom, job-specific cover letters using your resume and target role detail.');
  const { user } = useAuth();

  // State fields
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [targetCompany, setTargetCompany] = useState('');
  const [targetJob, setTargetJob] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [generating, setGenerating] = useState(false);

  // Logs history state
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      loadResumes();
      loadHistory();
    }
  }, [user]);

  const loadResumes = async () => {
    try {
      const list = await getUserResumes(user.uid);
      setResumes(list);
      if (list.length > 0) {
        setSelectedResumeId(list[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const q = query(
        collection(db, 'cover_letters'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const logs = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      setHistory(logs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedResumeId) {
      toast.error('Please upload/select a resume first.');
      return;
    }
    if (!targetCompany.trim() || !targetJob.trim()) {
      toast.error('Please enter the Target Company and Target Job Title.');
      return;
    }

    const selectedResume = resumes.find(r => r.id === selectedResumeId);
    if (!selectedResume || !selectedResume.resumeText) {
      toast.error('Resume text content is missing.');
      return;
    }

    try {
      setGenerating(true);
      toast.loading('Gemini is writing cover letter...', { id: 'generating-letter' });
      const text = await generateCoverLetterWithGemini(selectedResume.resumeText, targetCompany, targetJob);
      setCoverLetter(text);
      
      // Auto save to firestore
      await addDoc(collection(db, 'cover_letters'), {
        userId: user.uid,
        company: targetCompany,
        jobTitle: targetJob,
        letterText: text,
        createdAt: serverTimestamp()
      });

      toast.success('Cover letter generated and saved!', { id: 'generating-letter' });
      loadHistory();
    } catch (e) {
      console.error(e);
      toast.error('Cover letter generation failed.', { id: 'generating-letter' });
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!coverLetter) return;
    navigator.clipboard.writeText(coverLetter);
    toast.success('Copied cover letter to clipboard!');
  };

  const handleDownloadPDF = () => {
    if (!coverLetter) return;
    const doc = new jsPDF('p', 'pt', 'a4');
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(11);
    const leftMargin = 50;
    let yPos = 50;

    const splitText = doc.splitTextToSize(coverLetter, 490);
    splitText.forEach(line => {
      if (yPos > 780) {
        doc.addPage();
        yPos = 50;
      }
      doc.text(line, leftMargin, yPos);
      yPos += 16;
    });

    const fileTitle = `${targetCompany.replace(/\s+/g, '_')}_Cover_Letter.pdf`;
    doc.save(fileTitle);
    toast.success('Downloaded cover letter PDF!');
  };

  const handleDeleteHistory = async (id) => {
    try {
      await deleteDoc(doc(db, 'cover_letters', id));
      toast.success('Deleted cover letter from history.');
      loadHistory();
    } catch (e) {
      console.error(e);
      toast.error('Deletion failed.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">AI Cover Letter Generator</h1>
        <p className="text-gray-600 dark:text-gray-400">Generate targeted cover letters tailored to your profile and job description.</p>
      </div>

      {/* Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white/80 dark:bg-gray-800/60 border border-gray-250 dark:border-gray-700/50 rounded-3xl p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
              <FiBriefcase className="text-blue-500" /> Job Details
            </h3>

            {resumes.length === 0 ? (
              <div className="text-xs text-rose-500 font-semibold bg-rose-50 dark:bg-rose-950/20 p-3 rounded-xl border border-rose-100 dark:border-rose-900/30">
                You must parse at least one resume first.
              </div>
            ) : (
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1.5">Select Profile Source</label>
                <select
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900/60 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-xs font-semibold"
                >
                  {resumes.map(r => (
                    <option key={r.id} value={r.id}>{r.fileName || r.originalFileName}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1.5">Target Company</label>
              <input
                type="text"
                placeholder="Google, TechCorp, StartUp"
                value={targetCompany}
                onChange={(e) => setTargetCompany(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900/60 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1.5">Target Job Title</label>
              <input
                type="text"
                placeholder="Frontend Developer, Senior Analyst"
                value={targetJob}
                onChange={(e) => setTargetJob(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900/60 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-xs font-semibold"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating || resumes.length === 0}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 text-white font-bold rounded-xl transition shadow shadow-blue-500/10 text-xs"
            >
              {generating ? 'Generating Letter...' : <><FiCpu /> Generate Cover Letter</>}
            </button>
          </div>

          {/* History log list */}
          <div className="bg-white/80 dark:bg-gray-800/60 border border-gray-250 dark:border-gray-700/50 rounded-3xl p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-gray-900 dark:text-white">Cover Letters History</h3>
            {loadingHistory ? (
              <div className="text-xs text-gray-400">Loading history...</div>
            ) : history.length === 0 ? (
              <div className="text-xs text-gray-400 italic">No saved cover letters found.</div>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {history.map(item => (
                  <div
                    key={item.id}
                    className="p-3 bg-gray-50 dark:bg-gray-900/40 border border-gray-150 dark:border-gray-750/70 rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div
                      className="cursor-pointer flex-1"
                      onClick={() => {
                        setCoverLetter(item.letterText);
                        setTargetCompany(item.company);
                        setTargetJob(item.jobTitle);
                      }}
                    >
                      <p className="font-bold text-gray-950 dark:text-white">{item.jobTitle}</p>
                      <p className="text-[10px] text-blue-600 mt-0.5">{item.company}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteHistory(item.id)}
                      className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 p-1.5 rounded"
                    >
                      <FiTrash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Output letter panel */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white dark:bg-gray-850 border border-gray-200 dark:border-gray-700 shadow-2xl p-8 rounded-3xl min-h-[500px] flex flex-col justify-between">
            {coverLetter ? (
              <div className="space-y-6 flex-1 flex flex-col justify-between">
                <div className="text-xs leading-relaxed text-gray-750 dark:text-gray-300 font-semibold font-mono whitespace-pre-wrap">
                  {coverLetter}
                </div>
                <div className="flex gap-2 justify-end border-t border-gray-100 dark:border-gray-800 pt-4">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-xs transition"
                  >
                    <FiCopy /> Copy Text
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition"
                  >
                    <FiDownload /> Download PDF
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center space-y-3">
                <FiFileText className="text-gray-300 dark:text-gray-600 w-16 h-16 animate-pulse" />
                <h4 className="font-bold text-gray-700 dark:text-gray-400">No Cover Letter Generated</h4>
                <p className="text-xs text-gray-500 max-w-sm mt-1.5">
                  Select a resume and enter target job parameters to generate a custom cover letter with Gemini AI.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoverLetter;
