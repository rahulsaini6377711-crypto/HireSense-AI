import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FiUsers,
  FiFileText,
  FiBriefcase,
  FiMic,
  FiTrendingUp,
  FiTarget,
  FiCalendar,
} from 'react-icons/fi';
import AdminStatCard from '../../components/admin/AdminStatCard';
import {
  AtsTrendsChart,
  UserGrowthChart,
  InterviewScoresChart,
  JobMatchStatsChart,
} from '../../components/admin/AdminCharts';
import LoadingSpinner from '../../components/LoadingSpinner';
import { getAdminMetrics, getAdminChartData } from '../../services/adminService';

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [metricsData, chartData] = await Promise.all([
        getAdminMetrics(),
        getAdminChartData(),
      ]);
      setMetrics(metricsData);
      setCharts(chartData);
    } catch (err) {
      console.error('Admin dashboard load error:', err);
      setError('Failed to load admin metrics. Check Firestore rules and aggregation permissions.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="bg-gray-900 border border-red-900/50 rounded-xl p-8 text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={loadDashboardData}
          className="px-4 py-2 bg-amber-500 text-gray-900 rounded-lg font-semibold hover:bg-amber-400 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-gray-400">
          Platform overview with Firestore aggregation metrics and analytics.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AdminStatCard
          title="Total Users"
          value={metrics.totalUsers}
          description="Registered accounts"
          icon={FiUsers}
          accent="blue"
        />
        <AdminStatCard
          title="Resume Uploads"
          value={metrics.totalResumeUploads}
          description="PDF resumes stored"
          icon={FiFileText}
          accent="purple"
        />
        <AdminStatCard
          title="Job Matches"
          value={metrics.totalJobMatches}
          description="Match calculations saved"
          icon={FiBriefcase}
          accent="amber"
        />
        <AdminStatCard
          title="Interview Sessions"
          value={metrics.totalInterviewSessions}
          description="Completed practice sessions"
          icon={FiMic}
          accent="emerald"
        />
        <AdminStatCard
          title="Average ATS Score"
          value={`${metrics.averageAtsScore}%`}
          description="Across all resume analyses"
          icon={FiTrendingUp}
          accent="cyan"
        />
        <AdminStatCard
          title="Average Job Match Score"
          value={`${metrics.averageJobMatchScore}%`}
          description="Across all job match results"
          icon={FiTarget}
          accent="rose"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-900 rounded-xl border border-gray-800 p-6"
      >
        <div className="flex items-center gap-2 mb-6">
          <FiCalendar className="text-amber-400" />
          <h2 className="text-xl font-bold text-white">User Analytics</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-gray-800/50 rounded-lg p-5 border border-gray-700">
            <p className="text-sm text-gray-400 uppercase tracking-wide">Daily Users</p>
            <p className="text-3xl font-bold text-white mt-2">{metrics.analytics.dailyUsers}</p>
            <p className="text-xs text-gray-500 mt-1">Registered today</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-5 border border-gray-700">
            <p className="text-sm text-gray-400 uppercase tracking-wide">Weekly Users</p>
            <p className="text-3xl font-bold text-white mt-2">{metrics.analytics.weeklyUsers}</p>
            <p className="text-xs text-gray-500 mt-1">Last 7 days</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-5 border border-gray-700">
            <p className="text-sm text-gray-400 uppercase tracking-wide">Monthly Users</p>
            <p className="text-3xl font-bold text-white mt-2">{metrics.analytics.monthlyUsers}</p>
            <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
          </div>
        </div>
      </motion.div>

      {charts && (
        <div className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <AtsTrendsChart data={charts.atsTrends} />
            <UserGrowthChart data={charts.userGrowth} />
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            <InterviewScoresChart data={charts.interviewScores} />
            <JobMatchStatsChart
              trendData={charts.jobMatchStats}
              distributionData={charts.jobMatchDistribution}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
