import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiBriefcase, FiMapPin, FiAward, FiTrash2, FiDownload, FiSearch, FiSliders, FiLoader } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import { getUserJobMatches } from '../services/resumeStorage';
import { exportJobMatchesToCSV } from '../utils/csvExporter';
import { db } from '../services/firebase';
import { doc } from 'firebase/firestore';
import { safeDeleteDoc } from '../utils/firestoreHelper';
import toast from 'react-hot-toast';
import { useSEO } from '../hooks/useSEO';

const SavedJobMatches = () => {
  useSEO('Saved Jobs', 'Review and filter developer openings that match your parsed resume skills.');
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [minScore, setMinScore] = useState(0);

  useEffect(() => {
    if (user?.uid) {
      fetchMatches();
    }
  }, [user]);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const data = await getUserJobMatches(user.uid);
      setMatches(data);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load job matches');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this job match recommendation?')) return;
    try {
      await safeDeleteDoc(doc(db, 'job_matches', id));
      toast.success('Job match deleted');
      setMatches(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      toast.error('Failed to delete job match');
    }
  };

  const handleExportCSV = async () => {
    try {
      await exportJobMatchesToCSV(user.uid);
      toast.success('CSV downloaded successfully');
    } catch (err) {
      toast.error('Failed to export CSV');
    }
  };

  const getScoreColor = (score) => {
    if (score >= 85) return 'text-emerald-500 border-emerald-250 bg-emerald-50 dark:bg-emerald-950/20';
    if (score >= 65) return 'text-blue-500 border-blue-250 bg-blue-50 dark:bg-blue-950/20';
    return 'text-rose-500 border-rose-250 bg-rose-50 dark:bg-rose-950/20';
  };

  const filteredMatches = matches.filter(m => {
    const matchesSearch = 
      (m.jobTitle || '').toLowerCase().includes(search.toLowerCase()) || 
      (m.company || '').toLowerCase().includes(search.toLowerCase());
    const matchesScore = (m.matchScore || 0) >= minScore;
    return matchesSearch && matchesScore;
  });

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Saved Job Matches</h1>
          <p className="text-gray-655 dark:text-gray-400">View lists of matching tech positions based on your core parsed skills.</p>
        </div>
        {matches.length > 0 && (
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gray-100 hover:bg-gray-250 dark:bg-gray-800 dark:hover:bg-gray-750 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <FiDownload /> Export matches CSV
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-850 p-5 rounded-2xl border border-gray-200 dark:border-gray-750 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3.5 top-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by job title or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-700 dark:bg-gray-900/50 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm"
          />
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs font-bold text-gray-600 dark:text-gray-400 flex items-center gap-1"><FiSliders /> Min Score:</span>
          <select
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900/55 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-xs font-bold"
          >
            <option value={0}>All Scores</option>
            <option value={85}>85% + (Excellent matches)</option>
            <option value={65}>65% + (Good matches)</option>
            <option value={50}>50% + (Fair matches)</option>
          </select>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <FiLoader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-850 border border-gray-200 dark:border-gray-750 rounded-2xl">
          <p className="text-gray-600 dark:text-gray-400 text-lg font-bold">No saved matches found</p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">Check the Job Matcher page to run automated matches first!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMatches.map((match) => {
            const date = match.createdAt?.toDate ? match.createdAt.toDate().toLocaleDateString() : new Date(match.createdAt || 0).toLocaleDateString();
            return (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-850 border border-gray-200 dark:border-gray-700/80 rounded-2xl p-5 hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-6"
              >
                <div className="space-y-3 flex-1">
                  <div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white leading-tight">{match.jobTitle}</h3>
                    <p className="text-sm font-semibold text-blue-650 dark:text-blue-400 mt-0.5">{match.company}</p>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs font-bold text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1"><FiMapPin />{match.location || 'Remote'}</span>
                    <span>📅 Saved: {date}</span>
                  </div>

                  {/* Skills badges */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] uppercase font-bold text-gray-450 tracking-wider">Matched Skills tags:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {(match.matchedSkills || []).map(tag => (
                        <span key={tag} className="px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border border-emerald-100/30 dark:border-emerald-900/30 rounded text-[10px] font-bold">
                          ✓ {tag}
                        </span>
                      ))}
                      {(match.missingSkills || []).map(tag => (
                        <span key={tag} className="px-2.5 py-0.5 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-350 border border-rose-100/30 dark:border-rose-900/30 rounded text-[10px] font-bold">
                          ✗ {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                  <div className={`p-4 border rounded-xl text-center w-24 h-20 flex flex-col justify-center shadow-sm shrink-0 ${getScoreColor(match.matchScore)}`}>
                    <span className="text-2xl font-black leading-none">{match.matchScore}%</span>
                    <span className="text-[8px] uppercase tracking-wider font-bold mt-1">Match Score</span>
                  </div>
                  <button
                    onClick={() => handleDelete(match.id)}
                    className="p-3 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-900/30 transition shadow-inner"
                    title="Delete saved match"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SavedJobMatches;
