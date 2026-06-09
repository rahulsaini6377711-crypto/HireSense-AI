import React from 'react';
import { motion } from 'framer-motion';

const LoadingSpinner = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-12 h-12 border-4 border-gray-200 dark:border-gray-700 border-t-blue-500 rounded-full"
      />
    </div>
  );
};

export default LoadingSpinner;
