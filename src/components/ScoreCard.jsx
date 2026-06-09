import React from 'react';
import { motion } from 'framer-motion';
import { FiTrendingUp } from 'react-icons/fi';
import { calculateScoreColor, calculateScoreBgColor } from '../utils/helpers';

const ScoreCard = ({ title, score, description, icon: Icon = FiTrendingUp }) => {
  const scoreColor = calculateScoreColor(score);
  const scoreBgColor = calculateScoreBgColor(score);

  return (
    <motion.div
      whileHover={{ y: -5, boxShadow: '0 20px 25px rgba(0, 0, 0, 0.1)' }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
          <Icon className="text-blue-600 dark:text-blue-300" size={24} />
        </div>
      </div>

      <div className={`text-4xl font-bold ${scoreColor} mb-2`}>{score}%</div>

      {description && (
        <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
      )}

      {/* Score bar */}
      <div className="mt-4 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={`h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600`}
        />
      </div>
    </motion.div>
  );
};

export default ScoreCard;
