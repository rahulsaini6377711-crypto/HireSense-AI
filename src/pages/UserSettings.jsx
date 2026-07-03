import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSun, FiMoon, FiMonitor, FiBell, FiMail, FiDownload, FiTrash2, FiCreditCard, FiAward, FiAlertOctagon } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useNotifications } from '../hooks/useNotifications';
import { updateUserProfile } from '../services/userService';
import { exportJobMatchesToCSV, exportInterviewSessionsToCSV } from '../utils/csvExporter';
import { db } from '../services/firebase';
import { collection, query, where, writeBatch } from 'firebase/firestore';
import { safeGetDocs } from '../utils/firestoreHelper';
import toast from 'react-hot-toast';
import { useSEO } from '../hooks/useSEO';

const UserSettings = () => {
  useSEO('Settings', 'Manage your theme settings, mock subscriptions, notifications, and export histories.');
  const { user, userProfile, refreshUserProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const { addNotification } = useNotifications();
  
  const [loading, setLoading] = useState(false);
  const [toggles, setToggles] = useState({
    inAppAlerts: true,
    emailReports: true,
  });

  const [tier, setTier] = useState('free');

  useEffect(() => {
    if (userProfile) {
      setToggles({
        inAppAlerts: userProfile.inAppAlerts !== false,
        emailReports: userProfile.emailReports !== false,
      });
      setTier(userProfile.tier || 'free');
    }
  }, [userProfile]);

  const handleToggle = async (key) => {
    const updatedVal = !toggles[key];
    setToggles(prev => ({ ...prev, [key]: updatedVal }));
    
    if (user?.uid) {
      try {
        await updateUserProfile(user.uid, {
          [key]: updatedVal,
        });
        await refreshUserProfile();
        toast.success('Settings updated');
      } catch (error) {
        console.error('Failed to save toggle settings:', error);
        toast.error('Failed to save settings');
      }
    }
  };

  const handleUpgrade = async (newTier) => {
    if (newTier === tier) return;
    try {
      setLoading(true);
      await updateUserProfile(user.uid, {
        tier: newTier,
      });
      await refreshUserProfile();
      toast.success(`Upgraded to ${newTier.toUpperCase()} successfully!`);
      addNotification('Subscription Active', `Welcome to HireSense AI ${newTier.toUpperCase()} tier!`, 'success');
    } catch (e) {
      toast.error('Failed to upgrade subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async (type) => {
    if (!user?.uid) return;
    try {
      if (type === 'jobs') {
        await exportJobMatchesToCSV(user.uid);
      } else if (type === 'interviews') {
        await exportInterviewSessionsToCSV(user.uid);
      }
      toast.success('CSV downloaded successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to export data');
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('WARNING: This will permanently delete your entire Resume Analysis, Job Matches, and Interview Practice history. This action CANNOT be undone. Proceed?')) {
      return;
    }

    try {
      setLoading(true);
      const batch = writeBatch(db);
      
      const collectionsToClear = ['resume_analysis', 'interview_sessions', 'job_matches', 'notifications'];
      
      for (const colName of collectionsToClear) {
        const q = query(collection(db, colName), where('userId', '==', user.uid));
        const snapshot = await safeGetDocs(q);
        snapshot.forEach(docSnap => {
          batch.delete(docSnap.ref);
        });
      }
      
      await batch.commit();
      toast.success('All histories cleared successfully!');
      addNotification('Account Cleaned', 'All resume and practice histories have been purged.', 'info');
      
      // Force reload or redirect to dashboard
      window.location.href = '/dashboard';
    } catch (error) {
      console.error(error);
      toast.error('Failed to clear histories');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
          User Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your SaaS configurations and data logs.</p>
      </div>

      {/* Theme Choice */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-md space-y-4"
      >
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FiSun className="text-yellow-500" /> System Theme Preferences
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Choose how HireSense AI looks on your device.</p>
        <div className="grid grid-cols-3 gap-4">
          {[
            { value: 'light', label: 'Light', icon: FiSun },
            { value: 'dark', label: 'Dark', icon: FiMoon },
            { value: 'system', label: 'System Default', icon: FiMonitor },
          ].map((opt) => {
            const Icon = opt.icon;
            const isSelected = theme === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border font-bold transition-all ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 border-blue-500'
                    : 'bg-white dark:bg-gray-900 text-gray-750 dark:text-gray-450 border-gray-250 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'
                }`}
              >
                <Icon size={20} />
                <span className="text-sm">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Toggles & Alerts */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-md space-y-4"
      >
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FiBell className="text-purple-500" /> Notifications & Alerts
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Customize how we contact you with reports and calculations.</p>
        <div className="space-y-4 border-t border-gray-150 dark:border-gray-700/60 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-100 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 rounded-xl">
                <FiBell />
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">In-App Notification Alerts</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Toggle alerts, badge counters, and success logs.</p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('inAppAlerts')}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-all ${
                toggles.inAppAlerts ? 'bg-blue-600 justify-end' : 'bg-gray-300 dark:bg-gray-700 justify-start'
              }`}
            >
              <motion.div layout className="bg-white w-4 h-4 rounded-full shadow-md" />
            </button>
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-750/30 pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-xl">
                <FiMail />
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">Email Report Updates</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Receive analysis reports and interview answers in your inbox.</p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('emailReports')}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-all ${
                toggles.emailReports ? 'bg-blue-600 justify-end' : 'bg-gray-300 dark:bg-gray-700 justify-start'
              }`}
            >
              <motion.div layout className="bg-white w-4 h-4 rounded-full shadow-md" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Subscription Pricing SaaS Tiers */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-md space-y-4"
      >
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FiCreditCard className="text-emerald-500" /> SaaS Billing & Upgrade Subscription
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Unlock more resume parses, advanced full-length mock interviews, and PDF downloads.</p>
        <div className="grid md:grid-cols-3 gap-6 border-t border-gray-150 dark:border-gray-700/60 pt-6">
          {/* Free Tier */}
          <div className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 transition ${
            tier === 'free' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-200 dark:border-gray-700'
          }`}>
            <div>
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Free tier</span>
              <h3 className="text-xl font-black text-gray-900 dark:text-white mt-1">Basic Plan</h3>
              <p className="text-2xl font-black text-gray-900 dark:text-white mt-2">$0<span className="text-xs font-normal text-gray-400">/mo</span></p>
              <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-2 mt-4">
                <li>✓ 2 Resumes storage</li>
                <li>✓ Basic ATS Scores</li>
                <li>✓ 5 practice questions</li>
              </ul>
            </div>
            <button
              onClick={() => handleUpgrade('free')}
              disabled={tier === 'free' || loading}
              className={`w-full py-2 rounded-xl text-xs font-bold transition ${
                tier === 'free'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 cursor-default'
                  : 'bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-750 text-gray-900 dark:text-white'
              }`}
            >
              {tier === 'free' ? 'Active Plan' : 'Downgrade'}
            </button>
          </div>

          {/* Pro Tier */}
          <div className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 relative overflow-hidden transition ${
            tier === 'pro' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-200 dark:border-gray-700'
          }`}>
            <span className="absolute top-2 right-2 px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900 text-[9px] font-black rounded-lg uppercase tracking-wider">POPULAR</span>
            <div>
              <span className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Pro tier</span>
              <h3 className="text-xl font-black text-gray-900 dark:text-white mt-1">Professional</h3>
              <p className="text-2xl font-black text-gray-900 dark:text-white mt-2">$19<span className="text-xs font-normal text-gray-400">/mo</span></p>
              <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-2 mt-4">
                <li>✓ Unlimited Resumes</li>
                <li>✓ Full Recommendation reports</li>
                <li>✓ Infinite custom questions</li>
                <li>✓ PDF & CSV exports enabled</li>
              </ul>
            </div>
            <button
              onClick={() => handleUpgrade('pro')}
              disabled={loading}
              className={`w-full py-2 rounded-xl text-xs font-bold transition ${
                tier === 'pro'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 cursor-default'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
              }`}
            >
              {tier === 'pro' ? 'Active Plan' : 'Upgrade to Pro'}
            </button>
          </div>

          {/* Premium Tier */}
          <div className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 transition ${
            tier === 'premium' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-200 dark:border-gray-700'
          }`}>
            <div>
              <span className="text-xs font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest">Premium tier</span>
              <h3 className="text-xl font-black text-gray-900 dark:text-white mt-1">Enterprise Plus</h3>
              <p className="text-2xl font-black text-gray-900 dark:text-white mt-2">$49<span className="text-xs font-normal text-gray-400">/mo</span></p>
              <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-2 mt-4">
                <li>✓ Everything in Pro</li>
                <li>✓ API parser endpoints</li>
                <li>✓ Premium team sharing</li>
                <li>✓ Dedicated recruiter support</li>
              </ul>
            </div>
            <button
              onClick={() => handleUpgrade('premium')}
              disabled={loading}
              className={`w-full py-2 rounded-xl text-xs font-bold transition ${
                tier === 'premium'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 cursor-default'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-750 shadow-md'
              }`}
            >
              {tier === 'premium' ? 'Active Plan' : 'Go Premium'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Exporters & Clear Database */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-md space-y-6"
      >
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FiDownload className="text-blue-500" /> Backup Data & CSV Exports
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Export your stored metrics locally in a CSV file or purge database listings.</p>
        
        <div className="grid md:grid-cols-2 gap-4">
          <button
            onClick={() => handleExportData('jobs')}
            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-750 font-bold transition-all text-sm text-gray-800 dark:text-gray-200"
          >
            <span className="flex items-center gap-2"><FiDownload className="text-blue-500" /> Export Job Matches CSV</span>
            <span>⬇️</span>
          </button>
          
          <button
            onClick={() => handleExportData('interviews')}
            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-750 font-bold transition-all text-sm text-gray-800 dark:text-gray-200"
          >
            <span className="flex items-center gap-2"><FiDownload className="text-purple-500" /> Export Interview Session logs</span>
            <span>⬇️</span>
          </button>
        </div>

        {/* Danger zone */}
        <div className="border-t border-red-200 dark:border-red-900/30 pt-6 space-y-3">
          <h3 className="text-red-500 font-black flex items-center gap-2 text-sm">
            <FiAlertOctagon /> SYSTEM DANGER ZONE
          </h3>
          <p className="text-xs text-red-500/80">Deleting logs is final. Your files in cloud storage and tables will be wiped.</p>
          <button
            onClick={handleClearHistory}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow transition-colors"
          >
            <FiTrash2 /> Reset Accounts & Erase Data History
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default UserSettings;
