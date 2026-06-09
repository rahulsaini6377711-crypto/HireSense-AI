import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiFileText, FiMic, FiBriefcase, FiTrendingUp } from 'react-icons/fi';

const formatDate = (value) => {
  if (!value) return 'N/A';
  const date = value.toDate ? value.toDate() : new Date(value);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const AdminUserReportsModal = ({ report, onClose }) => {
  if (!report) return null;

  const { profile, stats, latestAnalysis, recentSessions, recentJobMatches } = report;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl"
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <div>
              <h2 className="text-xl font-bold text-white">User Report</h2>
              <p className="text-gray-400 text-sm mt-1">{profile.email}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition"
            >
              <FiX size={20} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <FiFileText className="text-blue-400 mb-2" />
                <p className="text-2xl font-bold text-white">{stats.resumeCount}</p>
                <p className="text-xs text-gray-500">Resumes</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <FiTrendingUp className="text-emerald-400 mb-2" />
                <p className="text-2xl font-bold text-white">{stats.avgAts}%</p>
                <p className="text-xs text-gray-500">Avg ATS</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <FiMic className="text-purple-400 mb-2" />
                <p className="text-2xl font-bold text-white">{stats.sessionCount}</p>
                <p className="text-xs text-gray-500">Interviews</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <FiBriefcase className="text-amber-400 mb-2" />
                <p className="text-2xl font-bold text-white">{stats.avgJobMatch}%</p>
                <p className="text-xs text-gray-500">Avg Match</p>
              </div>
            </div>

            {latestAnalysis && (
              <div className="bg-gray-800/30 rounded-xl p-5 border border-gray-700">
                <h3 className="font-semibold text-white mb-3">Latest ATS Analysis</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Score:</span>{' '}
                    <span className="text-white font-medium">{latestAnalysis.atsScore}%</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Rating:</span>{' '}
                    <span className="text-white font-medium">{latestAnalysis.overallRating}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Date:</span>{' '}
                    <span className="text-white font-medium">{formatDate(latestAnalysis.createdAt)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Skills detected:</span>{' '}
                    <span className="text-white font-medium">
                      {(latestAnalysis.skills || []).length}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {recentSessions.length > 0 && (
              <div>
                <h3 className="font-semibold text-white mb-3">Recent Interview Sessions</h3>
                <div className="space-y-2">
                  {recentSessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex justify-between items-center bg-gray-800/30 rounded-lg px-4 py-3 border border-gray-700 text-sm"
                    >
                      <span className="text-gray-300 capitalize">{session.role?.replace('-', ' ')}</span>
                      <span className="text-emerald-400 font-medium">{session.avgScore}%</span>
                      <span className="text-gray-500">{formatDate(session.createdAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {recentJobMatches.length > 0 && (
              <div>
                <h3 className="font-semibold text-white mb-3">Recent Job Matches</h3>
                <div className="space-y-2">
                  {recentJobMatches.map((match) => (
                    <div
                      key={match.id}
                      className="flex justify-between items-center bg-gray-800/30 rounded-lg px-4 py-3 border border-gray-700 text-sm"
                    >
                      <div>
                        <p className="text-gray-200">{match.jobTitle}</p>
                        <p className="text-gray-500 text-xs">{match.company}</p>
                      </div>
                      <span className="text-amber-400 font-medium">{match.matchScore}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AdminUserReportsModal;
