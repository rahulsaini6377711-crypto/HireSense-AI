import React from 'react';
import { motion } from 'framer-motion';

const ACCENT_STYLES = {
  blue: { icon: 'text-blue-400', bg: 'bg-blue-500/10' },
  purple: { icon: 'text-purple-400', bg: 'bg-purple-500/10' },
  emerald: { icon: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  amber: { icon: 'text-amber-400', bg: 'bg-amber-500/10' },
  rose: { icon: 'text-rose-400', bg: 'bg-rose-500/10' },
  cyan: { icon: 'text-cyan-400', bg: 'bg-cyan-500/10' },
};

const AdminStatCard = ({ title, value, description, icon: Icon, accent = 'blue' }) => {
  const styles = ACCENT_STYLES[accent] || ACCENT_STYLES.blue;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="bg-gray-900 rounded-xl p-6 border border-gray-800 shadow-lg"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">{title}</h3>
        {Icon && (
          <div className={`p-2.5 rounded-lg ${styles.bg}`}>
            <Icon className={styles.icon} size={20} />
          </div>
        )}
      </div>
      <div className="text-3xl font-bold text-white mb-1">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      {description && <p className="text-sm text-gray-500">{description}</p>}
    </motion.div>
  );
};

export default AdminStatCard;
