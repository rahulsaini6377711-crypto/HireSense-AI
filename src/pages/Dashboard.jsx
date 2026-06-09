import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FiTrendingUp, FiFileText, FiBriefcase, FiTarget } from 'react-icons/fi';
import ScoreCard from '../components/ScoreCard';
import AtsScoreCard from '../components/AtsScoreCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';
import { getLatestAnalysisResult } from '../services/resumeStorage';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [latestAnalysis, setLatestAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const analysis = await getLatestAnalysisResult(user.uid);
      if (analysis) {
        setLatestAnalysis(analysis);
      }
    } catch (error) {
      console.error('Error fetching dashboard analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { 
      title: 'Resume Score', 
      score: latestAnalysis ? latestAnalysis.atsScore : 0, 
      description: latestAnalysis ? 'Your ATS compatibility score' : 'Upload resume to calculate' 
    },
    { 
      title: 'Profile Strength', 
      score: latestAnalysis ? 85 : 10, 
      description: 'Account completeness' 
    },
    { 
      title: 'Interview Ready', 
      score: latestAnalysis ? 92 : 0, 
      description: 'Interview prep progress' 
    },
    { 
      title: 'Job Match', 
      score: latestAnalysis ? Math.round(latestAnalysis.atsScore * 1.05 > 100 ? 100 : latestAnalysis.atsScore * 1.05) : 0, 
      description: 'Average job match rating' 
    },
  ];

  const recentActivity = [
    { 
      type: latestAnalysis ? 'Resume Analyzed & Saved' : 'Profile Created', 
      date: latestAnalysis ? 'Recent analysis report saved' : 'Welcome to HireSense AI', 
      status: 'success' 
    },
  ];

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome back! Here's your career progress at a glance.
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, staggerChildren: 0.1 }}
        className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {stats.map((stat, index) => (
          <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <ScoreCard {...stat} />
          </motion.div>
        ))}
      </motion.div>

      {/* ATS Analysis Summary */}
      {latestAnalysis ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Latest ATS Resume Analysis
            </h2>
            <button 
              onClick={() => navigate('/resume-analysis')}
              className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Analyze New Resume
            </button>
          </div>
          <div className="bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/50 rounded-3xl p-6 shadow-md backdrop-blur-xl">
            <AtsScoreCard analysis={latestAnalysis} />
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center border border-gray-200 dark:border-gray-700 shadow-md"
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            No Resume Analyzed Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto text-sm">
            Upload your resume now to run an ATS check, evaluate core skills, and receive actionable profile improvement suggestions.
          </p>
          <button
            onClick={() => navigate('/resume-analysis')}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium text-sm shadow-md"
          >
            Get Started
          </button>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="grid md:grid-cols-2 gap-6"
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-md border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <FiFileText className="text-blue-600 dark:text-blue-300" size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Analyze Resume</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Get AI insights</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/resume-analysis')}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Upload Resume
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-md border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <FiBriefcase className="text-purple-600 dark:text-purple-300" size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Interview Prep</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Practice questions</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/interview-prep')}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
          >
            Start Practice
          </button>
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-md border border-gray-200 dark:border-gray-700"
      >
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          Recent Activity
        </h2>
        <div className="space-y-4">
          {recentActivity.map((activity, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {activity.type}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{activity.date}</p>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full" />
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
