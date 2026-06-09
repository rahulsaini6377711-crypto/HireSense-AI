import React from 'react';
import { motion } from 'framer-motion';
import { FiHome } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-4"
        >
          404
        </motion.div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Page Not Found
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
          The page you're looking for doesn't exist. It might have been moved or deleted.
        </p>
        <Link to="/">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition"
          >
            <FiHome />
            <span>Go Home</span>
          </motion.button>
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFound;
