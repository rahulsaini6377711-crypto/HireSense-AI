import React, { useState } from 'react';
import { motion } from 'framer-motion';
import InterviewCard from '../components/InterviewCard';
import { FiSearch } from 'react-icons/fi';

const InterviewPrep = () => {
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');

  const interviews = [
    {
      id: 1,
      title: 'Frontend Developer',
      description: 'Ace your frontend developer interview with React and JavaScript questions',
      difficulty: 'medium',
      questions: 25,
      path: '/interview-prep/frontend',
    },
    {
      id: 2,
      title: 'Full Stack Developer',
      description: 'Comprehensive questions for full stack positions',
      difficulty: 'hard',
      questions: 35,
      path: '/interview-prep/full-stack',
    },
    {
      id: 3,
      title: 'Data Scientist',
      description: 'Prepare for data science and machine learning interviews',
      difficulty: 'hard',
      questions: 30,
      path: '/interview-prep/data-scientist',
    },
    {
      id: 4,
      title: 'Product Manager',
      description: 'Common PM interview questions and case studies',
      difficulty: 'medium',
      questions: 20,
      path: '/interview-prep/product-manager',
    },
    {
      id: 5,
      title: 'Backend Developer',
      description: 'System design and backend engineering questions',
      difficulty: 'hard',
      questions: 28,
      path: '/interview-prep/backend',
    },
    {
      id: 6,
      title: 'UX Designer',
      description: 'Design thinking and UX interview preparation',
      difficulty: 'easy',
      questions: 18,
      path: '/interview-prep/ux-designer',
    },
  ];

  const filteredInterviews =
    selectedDifficulty === 'all'
      ? interviews
      : interviews.filter((i) => i.difficulty === selectedDifficulty);

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Interview Preparation
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Practice with AI-generated questions for your target role
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4 items-start sm:items-center"
      >
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search roles..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
          />
        </div>

        <div className="flex gap-2">
          {['all', 'easy', 'medium', 'hard'].map((level) => (
            <button
              key={level}
              onClick={() => setSelectedDifficulty(level)}
              className={`px-4 py-2 rounded-lg font-medium transition capitalize ${
                selectedDifficulty === level
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Interview Cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2, staggerChildren: 0.1 }}
        className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {filteredInterviews.map((interview, index) => (
          <motion.div
            key={interview.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <InterviewCard {...interview} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default InterviewPrep;
