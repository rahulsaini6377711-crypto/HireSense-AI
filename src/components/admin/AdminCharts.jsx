import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

const chartTheme = {
  grid: '#374151',
  axis: '#9CA3AF',
  tooltip: {
    backgroundColor: '#111827',
    border: '1px solid #374151',
    borderRadius: '8px',
  },
};

const formatDateLabel = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  return `${parts[1]}/${parts[2]}`;
};

export const AtsTrendsChart = ({ data }) => (
  <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
    <h3 className="text-lg font-semibold text-white mb-4">ATS Score Trends</h3>
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
          <XAxis dataKey="date" tickFormatter={formatDateLabel} stroke={chartTheme.axis} fontSize={12} />
          <YAxis domain={[0, 100]} stroke={chartTheme.axis} fontSize={12} />
          <Tooltip
            contentStyle={chartTheme.tooltip}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="score"
            name="Avg ATS Score"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={{ fill: '#3B82F6', r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export const UserGrowthChart = ({ data }) => (
  <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
    <h3 className="text-lg font-semibold text-white mb-4">User Growth</h3>
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
          <XAxis dataKey="date" tickFormatter={formatDateLabel} stroke={chartTheme.axis} fontSize={12} />
          <YAxis stroke={chartTheme.axis} fontSize={12} allowDecimals={false} />
          <Tooltip contentStyle={chartTheme.tooltip} />
          <Area
            type="monotone"
            dataKey="users"
            name="New Users"
            stroke="#8B5CF6"
            fill="#8B5CF6"
            fillOpacity={0.2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export const InterviewScoresChart = ({ data }) => (
  <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
    <h3 className="text-lg font-semibold text-white mb-4">Interview Scores</h3>
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
          <XAxis dataKey="date" tickFormatter={formatDateLabel} stroke={chartTheme.axis} fontSize={12} />
          <YAxis domain={[0, 100]} stroke={chartTheme.axis} fontSize={12} />
          <Tooltip contentStyle={chartTheme.tooltip} />
          <Bar dataKey="score" name="Avg Score" fill="#10B981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export const JobMatchStatsChart = ({ trendData, distributionData }) => (
  <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
    <h3 className="text-lg font-semibold text-white mb-4">Job Match Statistics</h3>
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="h-64">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Score Trend</p>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
            <XAxis dataKey="date" tickFormatter={formatDateLabel} stroke={chartTheme.axis} fontSize={11} />
            <YAxis domain={[0, 100]} stroke={chartTheme.axis} fontSize={11} />
            <Tooltip contentStyle={chartTheme.tooltip} />
            <Line type="monotone" dataKey="score" stroke="#F59E0B" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="h-64">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Score Distribution</p>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={distributionData}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
            <XAxis dataKey="range" stroke={chartTheme.axis} fontSize={11} />
            <YAxis stroke={chartTheme.axis} fontSize={11} allowDecimals={false} />
            <Tooltip contentStyle={chartTheme.tooltip} />
            <Bar dataKey="count" name="Matches" fill="#F59E0B" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
);
