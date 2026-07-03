import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiCode, FiCpu, FiPlay, FiAward, FiCheck, FiLoader, FiTerminal } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import { db } from '../services/firebase';
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { gradeCodingChallengeWithGemini } from '../services/geminiService';
import { useSEO } from '../hooks/useSEO';

const CodingInterview = () => {
  useSEO('AI Coding Practice', 'Hone your coding skills with dynamic AI-evaluated challenges and complexity analysis.');
  const { user } = useAuth();

  // Coding challenges
  const challenges = [
    {
      id: 'twosum',
      title: 'Two Sum Problem',
      description: 'Given an array of integers "nums" and an integer "target", return indices of the two numbers such that they add up to "target". You may assume that each input would have exactly one solution.',
      starterTemplates: {
        javascript: 'function twoSum(nums, target) {\n  // Write your code here\n  \n}',
        python: 'def two_sum(nums, target):\n    # Write your code here\n    pass',
        cpp: 'class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write code here\n        \n    }\n};'
      }
    },
    {
      id: 'validparens',
      title: 'Valid Parentheses',
      description: 'Given a string "s" containing just the characters "(", ")", "{", "}", "[" and "]", determine if the input string is valid. Open brackets must be closed by the same type of brackets in correct order.',
      starterTemplates: {
        javascript: 'function isValid(s) {\n  // Write your code here\n  \n}',
        python: 'def is_valid(s):\n    # Write your code here\n    pass',
        cpp: 'class Solution {\npublic:\n    bool isValid(string s) {\n        // Write code here\n        \n    }\n};'
      }
    }
  ];

  // Coding states
  const [selectedChallengeIdx, setSelectedChallengeIdx] = useState(0);
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState(challenges[0].starterTemplates.javascript);
  const [grading, setGrading] = useState(false);
  const [evaluation, setEvaluation] = useState(null);

  // History state
  const [sessionLogs, setSessionLogs] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const activeChallenge = challenges[selectedChallengeIdx];

  // Update starter template on change
  useEffect(() => {
    setCode(activeChallenge.starterTemplates[language] || '');
    setEvaluation(null);
  }, [selectedChallengeIdx, language]);

  useEffect(() => {
    if (user?.uid) {
      loadHistory();
    }
  }, [user]);

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const q = query(
        collection(db, 'coding_sessions'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSessionLogs(logs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleRunEvaluation = async () => {
    if (!code.trim()) {
      toast.error('Please input your code first.');
      return;
    }

    try {
      setGrading(true);
      toast.loading('Analyzing complexity and correct logic structure...', { id: 'grading' });
      
      const res = await gradeCodingChallengeWithGemini(
        activeChallenge.title,
        language,
        code
      );

      setEvaluation(res);
      toast.success('Evaluation report ready!', { id: 'grading' });

      // Save to database
      await addDoc(collection(db, 'coding_sessions'), {
        userId: user.uid,
        challengeTitle: activeChallenge.title,
        language,
        score: res.score,
        complexity: res.complexity,
        createdAt: serverTimestamp()
      });

      loadHistory();
    } catch (e) {
      console.error(e);
      toast.error('AI code analysis failed.', { id: 'grading' });
    } finally {
      setGrading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">AI Coding Drills</h1>
        <p className="text-gray-600 dark:text-gray-400">Practice algorithms with live automated code compilers and complexity analyses.</p>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Challenge and Code input */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white/80 dark:bg-gray-850 border border-gray-250 dark:border-gray-700/50 rounded-3xl p-6 shadow-xl space-y-4">
            {/* Options bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              {/* Challenge Selector */}
              <div>
                <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1">Challenge</label>
                <select
                  value={selectedChallengeIdx}
                  onChange={(e) => setSelectedChallengeIdx(Number(e.target.value))}
                  className="px-3 py-1.5 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-xl text-xs font-semibold"
                >
                  {challenges.map((c, i) => (
                    <option key={c.id} value={i}>{c.title}</option>
                  ))}
                </select>
              </div>

              {/* Language Selector */}
              <div>
                <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-xl text-xs font-semibold"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="cpp">C++</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="bg-gray-50 dark:bg-gray-900/60 p-4 border border-gray-200 dark:border-gray-800 rounded-2xl">
              <span className="text-[10px] font-black text-blue-600 dark:text-blue-450 uppercase">Problem Description</span>
              <p className="text-xs text-gray-700 dark:text-gray-300 mt-1.5 leading-relaxed">{activeChallenge.description}</p>
            </div>

            {/* Editor Area */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-gray-400 flex items-center gap-1">
                <FiTerminal /> Editor
              </label>
              <div className="border border-gray-250 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
                <textarea
                  rows={14}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full p-4 font-mono text-xs leading-relaxed dark:bg-gray-900 bg-gray-950 text-emerald-400 outline-none resize-y"
                  spellCheck="false"
                />
              </div>
            </div>

            <button
              onClick={handleRunEvaluation}
              disabled={grading || !code.trim()}
              className="w-full flex items-center justify-center gap-1.5 py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl text-xs shadow-md transition disabled:opacity-50"
            >
              {grading ? <FiLoader className="animate-spin" /> : <><FiPlay /> Evaluate Solution</>}
            </button>
          </div>

          {/* AI Feedback Output Report */}
          <AnimatePresence>
            {evaluation && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="bg-white dark:bg-gray-850 border border-gray-200 dark:border-gray-750 p-6 rounded-3xl shadow-xl space-y-5"
              >
                <div className="flex justify-between items-center border-b border-gray-150 dark:border-gray-800 pb-3">
                  <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5 text-sm">
                    <FiAward className="text-blue-500" /> Evaluation Report
                  </h3>
                  <span className="text-2xl font-black text-blue-600">{evaluation.score}/100</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="font-bold text-gray-500 uppercase text-[9px]">Complexity Analysis</span>
                    <p className="text-gray-900 dark:text-white font-mono mt-1">{evaluation.complexity}</p>
                  </div>
                  <div>
                    <span className="font-bold text-gray-500 uppercase text-[9px]">Strengths</span>
                    <ul className="list-disc pl-4 text-gray-700 dark:text-gray-300 mt-1 space-y-0.5">
                      {evaluation.strengths?.map((s, i) => <li key={i}>{s}</li>) || <li>Logical structure</li>}
                    </ul>
                  </div>
                  <div className="md:col-span-2">
                    <span className="font-bold text-rose-500 uppercase text-[9px]">Identified Gaps / Weaknesses</span>
                    <ul className="list-disc pl-4 text-gray-700 dark:text-gray-300 mt-1 space-y-0.5">
                      {evaluation.weaknesses?.map((w, i) => <li key={i}>{w}</li>) || <li>Corner check coverage</li>}
                    </ul>
                  </div>
                  <div className="md:col-span-2 border-t border-gray-100 dark:border-gray-800 pt-3">
                    <span className="font-bold text-blue-600 uppercase text-[9px]">Refining Suggestions</span>
                    <p className="text-gray-700 dark:text-gray-300 mt-1">{evaluation.suggestions}</p>
                  </div>
                </div>

                {evaluation.optimalCode && (
                  <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
                    <span className="font-bold text-emerald-500 uppercase text-[9px] block mb-2">Optimal AI Implementation</span>
                    <pre className="p-4 bg-gray-50 dark:bg-gray-900/60 rounded-xl overflow-x-auto text-[10px] font-mono text-gray-700 dark:text-emerald-300 leading-relaxed max-h-56">
                      {evaluation.optimalCode}
                    </pre>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Side: History logs */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white/80 dark:bg-gray-800/60 border border-gray-250 dark:border-gray-700/50 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">Coding Drills Logs</h3>
            {loadingHistory ? (
              <div className="text-xs text-gray-400">Loading history...</div>
            ) : sessionLogs.length === 0 ? (
              <div className="text-xs text-gray-450 italic">No practice drill history logged.</div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {sessionLogs.map(log => (
                  <div key={log.id} className="p-3 bg-gray-50 dark:bg-gray-900/40 border border-gray-150 dark:border-gray-850 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">{log.challengeTitle}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5 capitalize">{log.language} • {log.complexity}</p>
                    </div>
                    <span className="font-bold text-blue-600">{log.score}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodingInterview;
