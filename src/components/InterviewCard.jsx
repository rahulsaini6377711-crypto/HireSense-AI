import React from 'react';
import { motion } from 'framer-motion';
import { FiArrowRight } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const InterviewCard = ({ title, description, difficulty, questions, path }) => {
  const difficultyColor = {
    easy: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
    medium: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
    hard: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {description}
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-2 ${
            difficultyColor[difficulty] || difficultyColor.medium
          }`}
        >
          {difficulty}
        </span>
      </div>

      <div className="mb-4 flex items-center text-sm text-gray-500 dark:text-gray-400">
        <span>{questions} Questions</span>
      </div>

      <Link to={path}>
        <motion.button
          whileHover={{ x: 5 }}
          whileTap={{ scale: 0.95 }}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          <span>Start Practice</span>
          <FiArrowRight size={18} />
        </motion.button>
      </Link>
    </motion.div>
  );
};

export default InterviewCard;
