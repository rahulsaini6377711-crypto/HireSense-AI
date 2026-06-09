import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiRefreshCw, FiActivity } from 'react-icons/fi';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import { getActivityLogs } from '../../services/activityLogService';

const ACTION_LABELS = {
  user_registered: 'User Registered',
  resume_uploaded: 'Resume Uploaded',
  analysis_saved: 'Analysis Saved',
  interview_completed: 'Interview Completed',
  job_match_calculated: 'Job Match Calculated',
  user_deleted: 'User Deleted',
};

const ACTION_COLORS = {
  user_registered: 'text-blue-400 bg-blue-500/10',
  resume_uploaded: 'text-purple-400 bg-purple-500/10',
  analysis_saved: 'text-emerald-400 bg-emerald-500/10',
  interview_completed: 'text-cyan-400 bg-cyan-500/10',
  job_match_calculated: 'text-amber-400 bg-amber-500/10',
  user_deleted: 'text-red-400 bg-red-500/10',
};

const formatDateTime = (value) => {
  if (!value) return 'N/A';
  const date = value.toDate ? value.toDate() : new Date(value);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const AdminActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await getActivityLogs(150);
      setLogs(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Activity Logs</h1>
          <p className="text-gray-400">Audit trail of platform events and admin actions.</p>
        </div>
        <button
          onClick={loadLogs}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 text-gray-200 rounded-lg hover:bg-gray-700 transition border border-gray-700 self-start"
        >
          <FiRefreshCw size={16} />
          Refresh
        </button>
      </motion.div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FiActivity className="mx-auto mb-3 text-gray-600" size={32} />
            <p>No activity logs yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {logs.map((log) => {
              const colorClass = ACTION_COLORS[log.action] || 'text-gray-400 bg-gray-800';
              return (
                <div
                  key={log.id}
                  className="px-6 py-4 hover:bg-gray-800/30 transition flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6"
                >
                  <span className={`inline-flex self-start px-2.5 py-1 rounded-full text-xs font-semibold ${colorClass}`}>
                    {ACTION_LABELS[log.action] || log.action}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-200 text-sm truncate">
                      {log.userEmail || log.userId || 'System'}
                    </p>
                    {log.details && Object.keys(log.details).length > 0 && (
                      <p className="text-gray-500 text-xs mt-0.5 truncate">
                        {JSON.stringify(log.details)}
                      </p>
                    )}
                  </div>
                  <span className="text-gray-500 text-sm shrink-0">
                    {formatDateTime(log.createdAt)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminActivityLogs;
