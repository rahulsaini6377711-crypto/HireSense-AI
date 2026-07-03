import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMapPin, FiDollarSign, FiCheck, FiX, FiInfo, FiChevronDown, FiChevronUp, FiLoader } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import { getLatestAnalysisResult, saveJobMatch, getUserJobMatches } from '../services/resumeStorage';
import { Link } from 'react-router-dom';
import { compareJobWithGemini } from '../services/geminiService';

const JobMatcher = () => {
  const { user } = useAuth();
  const [latestAnalysis, setLatestAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const matchesSavedRef = useRef(false);

  // Expanded card state
  const [expandedJobId, setExpandedJobId] = useState(null);
  const [jobComparisons, setJobComparisons] = useState({});
  const [loadingJobId, setLoadingJobId] = useState(null);

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

  const baseJobs = [
    {
      id: 1,
      title: 'Senior React Developer',
      company: 'Tech Corp',
      location: 'San Francisco, CA (Hybrid)',
      salary: '$120k - $150k',
      tags: ['React', 'JavaScript', 'Tailwind', 'Git'],
    },
    {
      id: 2,
      title: 'Full Stack Engineer',
      company: 'StartUp Inc',
      location: 'New York, NY (On-site)',
      salary: '$100k - $130k',
      tags: ['React', 'Node.js', 'MongoDB', 'TypeScript'],
    },
    {
      id: 3,
      title: 'Frontend Developer',
      company: 'Digital Agency',
      location: 'Remote',
      salary: '$80k - $110k',
      tags: ['React', 'HTML', 'CSS', 'JavaScript'],
    },
    {
      id: 4,
      title: 'Python Backend Specialist',
      company: 'AI Research Lab',
      location: 'Remote',
      salary: '$130k - $160k',
      tags: ['Python', 'SQL', 'Git', 'Node.js'],
    },
    {
      id: 5,
      title: 'Database Engineer',
      company: 'Fintech Solutions',
      location: 'Remote',
      salary: '$110k - $140k',
      tags: ['SQL', 'MongoDB', 'Python', 'Firebase'],
    }
  ];

  const calculateJobMatch = (jobTags) => {
    if (!latestAnalysis) {
      return { score: 0, matched: [], missing: jobTags };
    }
    
    // Check skills arrays
    const userSkills = (latestAnalysis.detectedSkills || latestAnalysis.skills || []).map(s => s.toLowerCase());
    const matched = jobTags.filter(tag => userSkills.some(us => us.includes(tag.toLowerCase()) || tag.toLowerCase().includes(us)));
    const missing = jobTags.filter(tag => !userSkills.some(us => us.includes(tag.toLowerCase()) || tag.toLowerCase().includes(us)));
    
    const matchRatio = matched.length / jobTags.length;
    const score = Math.round(30 + (matchRatio * 70));
    
    return { score, matched, missing };
  };

  useEffect(() => {
    if (!latestAnalysis || !user?.uid || matchesSavedRef.current) return;

    const persistMatches = async () => {
      matchesSavedRef.current = true;
      try {
        const existingMatches = await getUserJobMatches(user.uid);
        const existingKeys = new Set(
          existingMatches.map(m => `${m.jobTitle || ''}_${m.company || ''}`.toLowerCase())
        );

        await Promise.all(
          baseJobs.map(async (job) => {
            const jobKey = `${job.title || ''}_${job.company || ''}`.toLowerCase();
            if (existingKeys.has(jobKey)) {
              return;
            }

            const match = calculateJobMatch(job.tags);
            await saveJobMatch(user.uid, {
              jobTitle: job.title,
              company: job.company,
              location: job.location,
              matchScore: match.score,
              matchedSkills: match.matched,
              missingSkills: match.missing,
            });
          })
        );
      } catch (error) {
        console.error('Failed to save job matches:', error);
        matchesSavedRef.current = false;
      }
    };

    persistMatches();
  }, [latestAnalysis, user]);

  const handleJobClick = async (job) => {
    if (expandedJobId === job.id) {
      setExpandedJobId(null);
      return;
    }
    
    setExpandedJobId(job.id);
    
    if (jobComparisons[job.id]) return;
    if (!latestAnalysis) return;

    try {
      setLoadingJobId(job.id);
      const comparison = await compareJobWithGemini(
        latestAnalysis.resumeText || latestAnalysis.text || '',
        job.title,
        job.tags.join(', ')
      );
      setJobComparisons(prev => ({ ...prev, [job.id]: comparison }));
    } catch (e) {
      console.error('Failed to run Gemini job alignment check:', e);
    } finally {
      setLoadingJobId(null);
    }
  };

  const getMatchColor = (score) => {
    if (score >= 85) return 'text-emerald-500';
    if (score >= 65) return 'text-amber-500';
    return 'text-rose-500';
  };

  const getMatchBgColor = (score) => {
    if (score >= 85) return 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30';
    if (score >= 65) return 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30';
    return 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/30';
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
          AI Job Matcher
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Find matching positions based on your parsed technical skill sets.
        </p>
      </motion.div>

      {/* Profile Notice */}
      {!latestAnalysis && !loading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-blue-500/10 to-purple-600/10 border border-blue-200 dark:border-blue-900/30 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Calculate Personal Match Scores</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xl">
              We couldn't locate your latest resume parsing record. Upload a resume to evaluate how well your profile aligns with these developer openings.
            </p>
          </div>
          <Link
            to="/resume-analysis"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg transition whitespace-nowrap"
          >
            Upload Resume
          </Link>
        </motion.div>
      )}

      {/* Jobs Grid */}
      <div className="space-y-6">
        {baseJobs.map((job) => {
          const match = calculateJobMatch(job.tags);
          const score = latestAnalysis ? (jobComparisons[job.id]?.matchPercentage || match.score) : Math.round(50 + (job.id * 8));
          
          return (
            <motion.div
              key={job.id}
              whileHover={{ y: -2 }}
              className="bg-white dark:bg-gray-800/60 rounded-3xl p-6 shadow-lg border border-gray-200 dark:border-gray-700/50 flex flex-col justify-between gap-4"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 w-full">
                {/* Job Info */}
                <div className="space-y-4 flex-1">
                  <div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white leading-none">
                      {job.title}
                    </h3>
                    <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-1">
                      {job.company}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs font-semibold text-gray-550 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <FiMapPin />
                      {job.location}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <FiDollarSign />
                      {job.salary}
                    </span>
                  </div>

                  {/* Skill Badges */}
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-bold text-gray-450 tracking-wider">Required Skills</span>
                    <div className="flex flex-wrap gap-2">
                      {job.tags.map((tag) => {
                        const isFound = latestAnalysis && match.matched.some(m => m.toLowerCase() === tag.toLowerCase());
                        return (
                          <span
                            key={tag}
                            className={`px-3 py-1 rounded-lg text-xs font-bold border transition ${
                              latestAnalysis 
                                ? isFound 
                                  ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/30' 
                                  : 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 border-rose-100 dark:border-rose-900/30'
                                : 'bg-blue-50 dark:bg-blue-950/20 text-blue-800 dark:text-blue-300 border-blue-100 dark:border-blue-900/30'
                            }`}
                          >
                            {tag}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mismatched highlight */}
                  {latestAnalysis && match.missing.length > 0 && !expandedJobId && (
                    <div className="text-xs text-rose-500 font-bold flex items-center gap-1.5 bg-rose-50/50 dark:bg-rose-950/10 p-2.5 rounded-xl border border-rose-100 dark:border-rose-900/20 max-w-md animate-pulse">
                      <FiX className="shrink-0" />
                      <span>Missing skills to target: {match.missing.join(', ')}</span>
                    </div>
                  )}
                </div>

                {/* Match Score Display */}
                <div className={`shrink-0 border p-6 rounded-2xl flex flex-col items-center justify-center text-center w-32 h-32 ${getMatchBgColor(score)}`}>
                  <span className={`text-4xl font-black ${getMatchColor(score)} leading-none`}>
                    {score}%
                  </span>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2">
                    Match Score
                  </span>
                </div>
              </div>

              {/* Collapsible toggle */}
              {latestAnalysis && (
                <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center w-full">
                  <button
                    onClick={() => handleJobClick(job)}
                    className="flex items-center gap-1.5 text-xs font-bold text-blue-650 dark:text-blue-400 hover:text-blue-700 transition"
                  >
                    {expandedJobId === job.id ? (
                      <>
                        <FiChevronUp /> Hide AI Alignment Breakdown
                      </>
                    ) : (
                      <>
                        <FiChevronDown /> Reveal AI Alignment Breakdown & Advice
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Collapsible details */}
              <AnimatePresence>
                {expandedJobId === job.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="w-full overflow-hidden space-y-4"
                  >
                    {loadingJobId === job.id ? (
                      <div className="flex items-center justify-center py-6 gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                        <FiLoader className="animate-spin text-blue-500" />
                        <span>Generating custom Gemini alignment match report...</span>
                      </div>
                    ) : jobComparisons[job.id] ? (
                      <div className="bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 p-4 rounded-xl space-y-3 text-xs leading-relaxed mt-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-blue-600 dark:text-blue-450 uppercase text-[10px]">AI Job Match Index</span>
                          <span className="font-bold text-gray-900 dark:text-white">{jobComparisons[job.id].matchPercentage}% match</span>
                        </div>
                        <div className="border-t border-gray-200 dark:border-gray-800 pt-2.5">
                          <span className="font-bold text-rose-600 dark:text-rose-450 uppercase text-[10px]">Identified Skill Gaps</span>
                          <ul className="list-disc pl-4 mt-1 text-gray-700 dark:text-gray-300 space-y-1">
                            {jobComparisons[job.id].missingSkills?.map((s, i) => <li key={i}>{s}</li>) || <li>None</li>}
                          </ul>
                        </div>
                        <div className="border-t border-gray-200 dark:border-gray-800 pt-2.5">
                          <span className="font-bold text-emerald-600 dark:text-emerald-450 uppercase text-[10px]">Resume Improvement Suggestions</span>
                          <ul className="list-disc pl-4 mt-1 text-gray-700 dark:text-gray-300 space-y-1">
                            {jobComparisons[job.id].improvementSuggestions?.map((s, i) => <li key={i}>{s}</li>) || <li>None</li>}
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-xs text-rose-500">
                        Failed to compute Gemini alignment. Please try again.
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default JobMatcher;
