import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiUsers, FiCpu, FiCopy, FiCheck, FiInfo, FiExternalLink } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import { getUserResumes } from '../services/resumeStorage';
import { optimizeLinkedInProfileWithGemini } from '../services/geminiService';
import { useSEO } from '../hooks/useSEO';

const LinkedInOptimizer = () => {
  useSEO('AI LinkedIn Optimizer', 'Optimize your LinkedIn profile structure using resume analysis and Gemini keywords.');
  const { user } = useAuth();

  // State
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [optimizations, setOptimizations] = useState(null);
  const [optimizing, setOptimizing] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      loadResumes();
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

  const handleOptimize = async () => {
    if (!selectedResumeId) {
      toast.error('Please upload or select a resume first.');
      return;
    }

    const selectedResume = resumes.find(r => r.id === selectedResumeId);
    if (!selectedResume || !selectedResume.resumeText) {
      toast.error('Resume text content is missing.');
      return;
    }

    try {
      setOptimizing(true);
      toast.loading('Analyzing resume and generating LinkedIn recommendations...', { id: 'optimizing-linkedin' });
      const recommendations = await optimizeLinkedInProfileWithGemini(selectedResume.resumeText);
      setOptimizations(recommendations);
      toast.success('LinkedIn optimization content ready!', { id: 'optimizing-linkedin' });
    } catch (e) {
      console.error(e);
      toast.error('Optimization failed. Please try again.', { id: 'optimizing-linkedin' });
    } finally {
      setOptimizing(false);
    }
  };

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied optimized ${fieldName} to clipboard!`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">AI LinkedIn Optimizer</h1>
          <p className="text-gray-600 dark:text-gray-400">Optimize key profile sections to rank higher in recruiter search queries.</p>
        </div>
        <a
          href="https://www.linkedin.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-4 py-2 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-xl font-bold text-xs transition"
        >
          Go to LinkedIn <FiExternalLink />
        </a>
      </div>

      {/* Profile Selector */}
      <div className="bg-white/80 dark:bg-gray-800/60 border border-gray-250 dark:border-gray-700/50 rounded-3xl p-6 flex flex-col md:flex-row items-end gap-6 shadow-xl max-w-3xl">
        <div className="flex-1 w-full">
          <label className="block text-[10px] uppercase font-bold text-gray-500 mb-2">Select Target Profile Resume</label>
          {resumes.length === 0 ? (
            <div className="text-xs text-rose-500 font-semibold bg-rose-50 dark:bg-rose-950/15 p-2 rounded-xl">
              No resumes uploaded yet.
            </div>
          ) : (
            <select
              value={selectedResumeId}
              onChange={(e) => setSelectedResumeId(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-350 dark:border-gray-700 dark:bg-gray-900/60 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-xs font-semibold"
            >
              {resumes.map(r => (
                <option key={r.id} value={r.id}>{r.fileName || r.originalFileName}</option>
              ))}
            </select>
          )}
        </div>
        <button
          onClick={handleOptimize}
          disabled={optimizing || resumes.length === 0}
          className="w-full md:w-auto shrink-0 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 text-white font-bold rounded-xl transition shadow shadow-blue-500/10 text-xs"
        >
          {optimizing ? 'Optimizing Profile...' : <><FiCpu /> Generate Recommendations</>}
        </button>
      </div>

      {/* Main recommendation sections */}
      {optimizations ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card 1: Headline */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-850 border border-gray-200 dark:border-gray-700 p-6 rounded-3xl shadow-xl flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-900 dark:text-white text-sm">Optimized Headline</h3>
                <span className="text-[9px] font-bold text-gray-450 uppercase">Recruiter Targeting</span>
              </div>
              <p className="text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 p-4 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl italic leading-relaxed">
                "{optimizations.headline}"
              </p>
            </div>
            <button
              onClick={() => handleCopy(optimizations.headline, 'Headline')}
              className="mt-6 flex items-center justify-center gap-1.5 w-full py-2 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 border border-blue-100 dark:border-blue-900/30 rounded-xl font-bold text-xs transition"
            >
              <FiCopy /> Copy Headline
            </button>
          </motion.div>

          {/* Card 2: About / Summary */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-850 border border-gray-200 dark:border-gray-700 p-6 rounded-3xl shadow-xl flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-900 dark:text-white text-sm">About Summary Section</h3>
                <span className="text-[9px] font-bold text-gray-455 uppercase">Narrative Hook</span>
              </div>
              <p className="text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 p-4 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl leading-relaxed whitespace-pre-wrap">
                {optimizations.about}
              </p>
            </div>
            <button
              onClick={() => handleCopy(optimizations.about, 'Summary')}
              className="mt-6 flex items-center justify-center gap-1.5 w-full py-2 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 border border-blue-100 dark:border-blue-900/30 rounded-xl font-bold text-xs transition"
            >
              <FiCopy /> Copy Summary
            </button>
          </motion.div>

          {/* Card 3: Experience Bullets */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-850 border border-gray-200 dark:border-gray-700 p-6 rounded-3xl shadow-xl flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-900 dark:text-white text-sm">Work Experience Bullets</h3>
                <span className="text-[9px] font-bold text-gray-450 uppercase">Metric Driven</span>
              </div>
              <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
                {optimizations.experience?.map((bullet, i) => (
                  <div key={i} className="flex gap-2 text-xs text-gray-700 dark:text-gray-300">
                    <span className="text-blue-500 shrink-0">•</span>
                    <p>{bullet}</p>
                  </div>
                )) || <p className="text-xs text-gray-400">None generated.</p>}
              </div>
            </div>
            <button
              onClick={() => handleCopy(optimizations.experience?.join('\n'), 'Experience Bullets')}
              className="mt-6 flex items-center justify-center gap-1.5 w-full py-2 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 border border-blue-100 dark:border-blue-900/30 rounded-xl font-bold text-xs transition"
            >
              <FiCopy /> Copy All Bullets
            </button>
          </motion.div>

          {/* Card 4: Top Keywords & Skills */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-850 border border-gray-200 dark:border-gray-700 p-6 rounded-3xl shadow-xl flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-900 dark:text-white text-sm">Top Search Keywords</h3>
                <span className="text-[9px] font-bold text-gray-450 uppercase">recruiter search SEO</span>
              </div>
              <div className="flex flex-wrap gap-2 bg-gray-50 dark:bg-gray-900/50 p-4 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
                {optimizations.skills?.map(skill => (
                  <span key={skill} className="px-3 py-1 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700 text-xs font-semibold rounded-lg shadow-sm">
                    {skill}
                  </span>
                )) || <p className="text-xs text-gray-400">None generated.</p>}
              </div>
            </div>
            <button
              onClick={() => handleCopy(optimizations.skills?.join(', '), 'Keywords')}
              className="mt-6 flex items-center justify-center gap-1.5 w-full py-2 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 border border-blue-100 dark:border-blue-900/30 rounded-xl font-bold text-xs transition"
            >
              <FiCopy /> Copy Keyword Tags
            </button>
          </motion.div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 bg-white/40 dark:bg-gray-800/10 border border-gray-200 dark:border-gray-850 rounded-3xl p-8 max-w-3xl">
          <FiUsers className="text-gray-300 dark:text-gray-700 w-16 h-16 animate-pulse" />
          <h4 className="font-bold text-gray-700 dark:text-gray-400">No Profile Analysis Done</h4>
          <p className="text-xs text-gray-500 max-w-md mt-1.5">
            Select an uploaded resume and press "Generate Recommendations" to trigger Gemini AI profile keyword and headline matching.
          </p>
        </div>
      )}
    </div>
  );
};

export default LinkedInOptimizer;
