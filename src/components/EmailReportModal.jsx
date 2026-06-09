import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiMail, FiLoader, FiCheckCircle } from 'react-icons/fi';
import { logActivity } from '../services/activityLogService';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import toast from 'react-hot-toast';

const EmailReportModal = ({ isOpen, onClose, reportName, reportType, reportData }) => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [recipient, setRecipient] = useState(user?.email || '');
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!recipient.trim()) {
      toast.error('Recipient email is required');
      return;
    }

    try {
      setSending(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (user?.uid) {
        await logActivity({
          userId: user.uid,
          userEmail: user.email,
          action: 'report_emailed',
          details: {
            reportType,
            recipient,
            reportName,
          }
        });
      }

      toast.success(`Report successfully emailed to ${recipient}!`);
      addNotification(
        'Email Dispatched',
        `The PDF report for "${reportName}" was sent to ${recipient}.`,
        'success'
      );
      
      // Reset & Close
      setNote('');
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Failed to send email report');
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl w-full max-w-md p-6 shadow-2xl z-10"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"
            >
              <FiX size={18} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-2xl">
                <FiMail size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white">Email PDF Report</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Send reports directly from your dashboard.</p>
              </div>
            </div>

            <form onSubmit={handleSend} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Recipient Email</label>
                <input
                  type="email"
                  required
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 dark:bg-gray-900/50 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Personal Note (Optional)</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Hey, here is my latest HireSense AI report for review!"
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 dark:bg-gray-900/50 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm resize-none"
                />
              </div>

              {/* Attachment summary */}
              <div className="p-3 bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-gray-200 dark:border-gray-750 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1.5 font-medium">📎 {reportName}</span>
                <span className="font-bold text-[9px] bg-red-100 text-red-700 dark:bg-red-950/20 dark:text-red-300 border border-red-200 dark:border-red-900/20 px-2 py-0.5 rounded uppercase">PDF</span>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-white font-bold rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-750 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="flex-grow py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/10"
                >
                  {sending ? (
                    <>
                      <FiLoader className="animate-spin w-4 h-4" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <span>Send Email</span>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default EmailReportModal;
