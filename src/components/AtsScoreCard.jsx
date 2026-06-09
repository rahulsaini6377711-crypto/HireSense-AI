import React from 'react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FiCheckCircle, FiXCircle, FiAlertTriangle, FiBook, FiAward, FiInfo } from 'react-icons/fi';

const AtsScoreCard = ({ analysis }) => {
  if (!analysis) return null;

  const {
    atsScore,
    overallRating,
    strengths = [],
    weaknesses = [],
    detectedSkills = [],
    missingSkills = [],
    improvementSuggestions = [],
    recommendedProjects = [],
    recommendedCertifications = []
  } = analysis;

  // Chart data
  const data = [
    { value: atsScore },
    { value: 100 - atsScore }
  ];

  // Colors based on score
  const getScoreColor = (score) => {
    if (score >= 90) return '#10B981'; // Green
    if (score >= 75) return '#3B82F6'; // Blue
    if (score >= 60) return '#F59E0B'; // Amber
    if (score >= 40) return '#F97316'; // Orange
    return '#EF4444'; // Red
  };

  const getRatingBadgeClass = (rating) => {
    switch (rating) {
      case 'Excellent':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/30';
      case 'Strong':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800/30';
      case 'Good':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800/30';
      case 'Needs Improvement':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300 border-orange-200 dark:border-orange-800/30';
      default:
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800/30';
    }
  };

  const scoreColor = getScoreColor(atsScore);

  return (
    <div className="space-y-8">
      {/* Visual Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Animated Score Gauge Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800/60 rounded-3xl border border-gray-200 dark:border-gray-700/50 p-6 flex flex-col items-center justify-center text-center shadow-lg backdrop-blur-xl relative overflow-hidden"
        >
          <div className="absolute top-4 left-4 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <FiInfo className="w-3.5 h-3.5" />
            <span>ATS Compliance index</span>
          </div>

          <div className="w-full h-48 relative flex items-center justify-center mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={scoreColor} stopOpacity={0.8} />
                    <stop offset="100%" stopColor={scoreColor} stopOpacity={1} />
                  </linearGradient>
                </defs>
                <Pie
                  data={data}
                  cx="50%"
                  cy="75%"
                  startAngle={180}
                  endAngle={0}
                  innerRadius="75%"
                  outerRadius="95%"
                  dataKey="value"
                  stroke="none"
                >
                  <Cell fill="url(#scoreGradient)" />
                  <Cell fill="rgba(0,0,0,0.06)" className="dark:fill-white/10" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Score Overlay */}
            <div className="absolute bottom-6 flex flex-col items-center justify-center">
              <span className="text-5xl font-black text-gray-900 dark:text-white leading-none">
                {atsScore}
              </span>
              <span className="text-xs uppercase tracking-widest text-gray-600 dark:text-gray-400 font-bold mt-1">
                Score
              </span>
            </div>
          </div>

          <div className="mt-2 w-full space-y-2">
            <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              Resume Strength Rating
            </div>
            <div className={`inline-flex px-4 py-1.5 rounded-full border text-sm font-bold shadow-sm ${getRatingBadgeClass(overallRating)}`}>
              {overallRating}
            </div>
          </div>
        </motion.div>

        {/* Strengths & Weaknesses Grids */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Strengths Card */}
          <div className="bg-white dark:bg-gray-800/60 rounded-3xl border border-gray-200 dark:border-gray-700/50 p-6 shadow-md flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
                <FiCheckCircle size={20} />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white">Key Strengths</h3>
            </div>
            <ul className="space-y-3 flex-1">
              {strengths.length > 0 ? (
                strengths.map((str, idx) => (
                  <li key={idx} className="flex gap-2.5 items-start text-sm text-gray-700 dark:text-gray-300">
                    <span className="text-emerald-500 font-bold mt-0.5">•</span>
                    <span>{str}</span>
                  </li>
                ))
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400 italic">No specific strengths parsed.</p>
              )}
            </ul>
          </div>

          {/* Weaknesses Card */}
          <div className="bg-white dark:bg-gray-800/60 rounded-3xl border border-gray-200 dark:border-gray-700/50 p-6 shadow-md flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400">
                <FiXCircle size={20} />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white">Areas to Address</h3>
            </div>
            <ul className="space-y-3 flex-1">
              {weaknesses.length > 0 ? (
                weaknesses.map((weak, idx) => (
                  <li key={idx} className="flex gap-2.5 items-start text-sm text-gray-700 dark:text-gray-300">
                    <span className="text-rose-500 font-bold mt-0.5">•</span>
                    <span>{weak}</span>
                  </li>
                ))
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400 italic text-emerald-500">Perfect resume structure completeness!</p>
              )}
            </ul>
          </div>
        </motion.div>
      </div>

      {/* Skills Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Detected Skills */}
        <div className="bg-white dark:bg-gray-800/60 rounded-3xl border border-gray-200 dark:border-gray-700/50 p-6 shadow-md">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            Detected Technical Skills ({detectedSkills.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {detectedSkills.length > 0 ? (
              detectedSkills.map(skill => (
                <span
                  key={skill}
                  className="px-3.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/30 rounded-xl text-xs font-semibold shadow-sm"
                >
                  ✓ {skill}
                </span>
              ))
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400 italic">No common keywords detected. Consider updating resume text format.</p>
            )}
          </div>
        </div>

        {/* Missing Skills */}
        <div className="bg-white dark:bg-gray-800/60 rounded-3xl border border-gray-200 dark:border-gray-700/50 p-6 shadow-md">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            Missing Skills Recommendations ({missingSkills.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {missingSkills.length > 0 ? (
              missingSkills.slice(0, 8).map(skill => (
                <span
                  key={skill}
                  className="px-3.5 py-1.5 bg-gray-50 dark:bg-gray-700/40 text-gray-600 dark:text-gray-400 border border-gray-200/50 dark:border-gray-700/30 rounded-xl text-xs font-semibold"
                >
                  + {skill}
                </span>
              ))
            ) : (
              <p className="text-sm text-gray-600 dark:text-emerald-400 italic">All core technology stacks covered!</p>
            )}
          </div>
        </div>
      </div>

      {/* Suggestions and Project Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Detailed suggestions */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800/60 rounded-3xl border border-gray-200 dark:border-gray-700/50 p-6 shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400">
              <FiAlertTriangle size={20} />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white">Actionable Suggestions</h3>
          </div>
          <ul className="space-y-4">
            {improvementSuggestions.map((sug, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 text-xs font-bold shrink-0 mt-0.5 border border-blue-100 dark:border-blue-900/30">
                  {idx + 1}
                </span>
                <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {sug}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Dynamic Project recommendations & Certifications */}
        <div className="space-y-6">
          {/* Projects */}
          <div className="bg-white dark:bg-gray-800/60 rounded-3xl border border-gray-200 dark:border-gray-700/50 p-6 shadow-md">
            <div className="flex items-center gap-2 mb-4">
              <FiBook className="text-purple-500" size={20} />
              <h3 className="font-bold text-gray-900 dark:text-white">Recommended Projects</h3>
            </div>
            <div className="space-y-4">
              {recommendedProjects.map((proj, idx) => {
                const [title, desc] = proj.split(': ');
                return (
                  <div key={idx} className="border-l-2 border-purple-500 pl-3">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h4>
                    {desc && <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{desc}</p>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Certifications */}
          <div className="bg-white dark:bg-gray-800/60 rounded-3xl border border-gray-200 dark:border-gray-700/50 p-6 shadow-md">
            <div className="flex items-center gap-2 mb-4">
              <FiAward className="text-amber-500" size={20} />
              <h3 className="font-bold text-gray-900 dark:text-white">Recommended Certs</h3>
            </div>
            <ul className="space-y-3">
              {recommendedCertifications.map((cert, idx) => (
                <li key={idx} className="flex gap-2 items-start text-xs text-gray-700 dark:text-gray-300">
                  <span className="text-amber-500">•</span>
                  <span>{cert}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AtsScoreCard;
