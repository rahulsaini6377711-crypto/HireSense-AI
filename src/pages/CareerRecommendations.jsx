import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiBookOpen, FiAward, FiArrowRight, FiInfo } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import { getLatestAnalysisResult } from '../services/resumeStorage';
import { Link } from 'react-router-dom';

const CareerRecommendations = () => {
  const { user } = useAuth();
  const [latestAnalysis, setLatestAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      fetchAnalysis();
    }
  }, [user]);

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      const analysis = await getLatestAnalysisResult(user.uid);
      setLatestAnalysis(analysis);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getRecommendedRoles = () => {
    if (!latestAnalysis || !latestAnalysis.skills) {
      return ['Junior Software Engineer', 'Web Developer', 'Technical Support Analyst'];
    }
    
    const skills = latestAnalysis.skills.map(s => s.toLowerCase());
    const roles = [];
    
    if (skills.includes('react') || skills.includes('javascript') || skills.includes('typescript')) {
      roles.push('Frontend UI Engineer', 'React Specialist', 'Fullstack JavaScript Developer');
    }
    if (skills.includes('node.js') || skills.includes('mongodb') || skills.includes('sql')) {
      roles.push('Backend Engineer', 'Database Administrator', 'API Developer');
    }
    if (skills.includes('python')) {
      roles.push('Machine Learning Scientist', 'Data Analyst', 'Python Developer');
    }
    
    if (roles.length === 0) {
      roles.push('Junior Systems Developer', 'Associate Software Engineer');
    }
    
    return roles;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Career Guidance & Roadmap
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Personalized career guidance and skill path blueprints mapping directly to your resume parser insights.
        </p>
      </motion.div>

      {/* Warning Notice if no analysis */}
      {!latestAnalysis && !loading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-blue-500/10 to-purple-600/10 border border-blue-200 dark:border-blue-900/30 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Run Resume Analysis First</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xl">
              We need a completed resume analysis to formulate career guidance, recommended projects, or custom certification blueprints.
            </p>
          </div>
          <Link
            to="/resume-analysis"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg transition whitespace-nowrap"
          >
            Go to Uploader
          </Link>
        </motion.div>
      )}

      {latestAnalysis && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Path & Roadmap Columns */}
          <div className="lg:col-span-2 space-y-8">
            {/* Roles recommendations */}
            <div className="bg-white dark:bg-gray-800/60 rounded-3xl p-6 border border-gray-200 dark:border-gray-700/50 shadow-lg backdrop-blur-xl">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FiTrendingUp className="text-blue-500" />
                Target Career Titles
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {getRecommendedRoles().map((role, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-900/40 rounded-2xl border border-gray-200/50 dark:border-gray-700/30">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Title Recommendation</span>
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white">{role}</h4>
                  </div>
                ))}
              </div>
            </div>

            {/* Learning Roadmap Blueprint */}
            <div className="bg-white dark:bg-gray-800/60 rounded-3xl p-6 border border-gray-200 dark:border-gray-700/50 shadow-lg backdrop-blur-xl space-y-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FiBookOpen className="text-purple-500" />
                Custom Learning Roadmap
              </h3>
              
              <div className="relative border-l-2 border-gray-200 dark:border-gray-700 ml-4 space-y-8">
                {/* Step 1 */}
                <div className="relative pl-6">
                  <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-blue-600 border-4 border-white dark:border-gray-800" />
                  <h4 className="font-bold text-sm text-gray-900 dark:text-white">Step 1: Address Core Skills Gaps</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 max-w-lg leading-relaxed">
                    Prioritize adding missing skills: <strong className="text-blue-600 dark:text-blue-400">{latestAnalysis.missingSkills?.slice(0, 4).join(', ') || 'Docker, AWS'}</strong>. Recruiters filter for these stacks on search platforms.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="relative pl-6">
                  <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-purple-600 border-4 border-white dark:border-gray-800" />
                  <h4 className="font-bold text-sm text-gray-900 dark:text-white">Step 2: Construct Hands-On Proof</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 max-w-lg leading-relaxed">
                    Build one of the recommended projects (e.g. <em>{latestAnalysis.recommendedProjects?.[0]?.split(':')[0] || 'E-Commerce Hub'}</em>) and store it publicly on GitHub.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="relative pl-6">
                  <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-amber-600 border-4 border-white dark:border-gray-800" />
                  <h4 className="font-bold text-sm text-gray-900 dark:text-white">Step 3: Academic/Industry Validation</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 max-w-lg leading-relaxed">
                    Study and clear certification milestones (e.g., <em>{latestAnalysis.recommendedCertifications?.[0] || 'AWS Cloud Practitioner'}</em>) to add official credentials to your LinkedIn.
                  </p>
                </div>

                {/* Step 4 */}
                <div className="relative pl-6">
                  <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-emerald-600 border-4 border-white dark:border-gray-800" />
                  <h4 className="font-bold text-sm text-gray-900 dark:text-white">Step 4: Interview Simulation</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 max-w-lg leading-relaxed">
                    Run through AI Interview Prep sessions for target titles to refine response times and pass real assessments.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar recommendations */}
          <div className="space-y-6">
            {/* Recommended Projects Card */}
            <div className="bg-white dark:bg-gray-800/60 rounded-3xl p-6 border border-gray-200 dark:border-gray-700/50 shadow-lg backdrop-blur-xl">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FiBookOpen className="text-purple-500" />
                Target Projects
              </h3>
              <div className="space-y-4">
                {latestAnalysis.recommendedProjects?.map((proj, idx) => {
                  const [title, desc] = proj.split(': ');
                  return (
                    <div key={idx} className="border-l-2 border-purple-500 pl-3 space-y-1">
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white">{title}</h4>
                      <p className="text-[10px] text-gray-600 dark:text-gray-400 leading-normal">{desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recommended Certifications Card */}
            <div className="bg-white dark:bg-gray-800/60 rounded-3xl p-6 border border-gray-200 dark:border-gray-700/50 shadow-lg backdrop-blur-xl">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FiAward className="text-amber-500" />
                Target Credentials
              </h3>
              <ul className="space-y-3 text-xs text-gray-700 dark:text-gray-300">
                {latestAnalysis.recommendedCertifications?.map((cert, idx) => (
                  <li key={idx} className="flex gap-2 items-start">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>{cert}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CareerRecommendations;
