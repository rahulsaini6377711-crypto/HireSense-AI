/**
 * jobMatchAnalyzer.js
 * AI Job Match Score Engine
 * Compares user resume data against a job description to generate a precise match score.
 */

// ─── Full Skill Taxonomy ─────────────────────────────────────────────────────

const SKILL_ALIASES = {
  'javascript': ['javascript', 'js', 'es6', 'es2015', 'ecmascript', 'vanilla js'],
  'typescript': ['typescript', 'ts'],
  'react': ['react', 'reactjs', 'react.js', 'react native'],
  'next.js': ['next', 'nextjs', 'next.js'],
  'vue': ['vue', 'vuejs', 'vue.js', 'nuxt'],
  'angular': ['angular', 'angularjs', 'ng'],
  'node.js': ['node', 'nodejs', 'node.js', 'express', 'expressjs'],
  'python': ['python', 'py', 'django', 'flask', 'fastapi'],
  'java': ['java', 'spring', 'springboot', 'spring boot'],
  'c++': ['c++', 'cpp', 'c plus plus'],
  'c#': ['c#', 'csharp', '.net', 'dotnet', 'asp.net'],
  'go': ['golang', 'go lang', ' go '],
  'rust': ['rust', 'rust lang'],
  'php': ['php', 'laravel', 'symfony'],
  'ruby': ['ruby', 'rails', 'ruby on rails'],
  'sql': ['sql', 'mysql', 'postgresql', 'postgres', 'sqlite', 'oracle', 'mssql', 'mariadb'],
  'mongodb': ['mongodb', 'mongo', 'mongoose'],
  'redis': ['redis', 'redis cache'],
  'firebase': ['firebase', 'firestore', 'firebase realtime'],
  'html': ['html', 'html5'],
  'css': ['css', 'css3', 'scss', 'sass', 'less'],
  'tailwind': ['tailwind', 'tailwindcss', 'tailwind css'],
  'git': ['git', 'github', 'gitlab', 'bitbucket', 'version control'],
  'docker': ['docker', 'dockerfile', 'containerization'],
  'kubernetes': ['kubernetes', 'k8s', 'helm', 'kubectl'],
  'aws': ['aws', 'amazon web services', 'ec2', 's3', 'lambda', 'rds', 'cloudfront'],
  'gcp': ['gcp', 'google cloud', 'google cloud platform', 'bigquery'],
  'azure': ['azure', 'microsoft azure', 'azure devops'],
  'ci/cd': ['ci/cd', 'cicd', 'continuous integration', 'github actions', 'jenkins', 'travis', 'circleci'],
  'rest api': ['rest', 'restful', 'rest api', 'http api'],
  'graphql': ['graphql', 'apollo'],
  'machine learning': ['machine learning', 'ml', 'deep learning', 'neural network'],
  'data science': ['data science', 'data analysis', 'pandas', 'numpy', 'scikit-learn', 'sklearn'],
  'agile': ['agile', 'scrum', 'kanban', 'jira', 'sprint'],
  'linux': ['linux', 'unix', 'bash', 'shell scripting'],
  'figma': ['figma', 'sketch', 'adobe xd'],
  'testing': ['jest', 'mocha', 'cypress', 'selenium', 'unit testing', 'tdd', 'testing'],
  'terraform': ['terraform', 'infrastructure as code', 'iac'],
};

// ─── Keyword importance weights ───────────────────────────────────────────────

const HIGH_PRIORITY_TERMS = [
  'required', 'must have', 'essential', 'mandatory', 'minimum', 'you will',
  'responsibilities', 'you must', 'need to have', 'critical'
];

const EXPERIENCE_PATTERNS = [
  /(\d+)\+?\s*years?\s*(of\s*)?(experience|exp)/i,
  /experience.*?(\d+)\+?\s*years?/i,
  /senior|lead|principal|staff|architect|manager|director/i,
  /junior|entry.?level|associate|graduate|intern/i,
  /mid.?level|intermediate/i,
];

const EDUCATION_PATTERNS = [
  /bachelor'?s?|b\.?s\.?c?|b\.?e\.?|b\.?tech/i,
  /master'?s?|m\.?s\.?c?|m\.?tech|mba/i,
  /phd|ph\.?d|doctorate|doctoral/i,
  /degree|diploma|certification/i,
];

// ─── Core Analysis Engine ─────────────────────────────────────────────────────

/**
 * Analyze job description and extract structured data
 * @param {string} jobDescriptionText
 * @returns {Object} Extracted JD data
 */
export const parseJobDescription = (jobDescriptionText = '') => {
  const normalized = jobDescriptionText.toLowerCase();

  // Extract job title (first line or common pattern)
  const lines = jobDescriptionText.split('\n').map(l => l.trim()).filter(Boolean);
  const jobTitle = lines[0] || 'Software Engineer';

  // Extract company name (look for "at Company" or "Company is looking")
  const companyMatch = jobDescriptionText.match(/(?:at|@|company[:\s]+|hiring for)\s+([A-Z][a-zA-Z\s&.,]{2,30})/);
  const company = companyMatch ? companyMatch[1].trim() : 'Company';

  // Extract required skills
  const detectedSkills = [];
  Object.entries(SKILL_ALIASES).forEach(([canonical, aliases]) => {
    const found = aliases.some(alias => {
      const regex = new RegExp(`\\b${escapeRegex(alias)}\\b`, 'i');
      return regex.test(normalized);
    });
    if (found) detectedSkills.push(canonical);
  });

  // Extract experience requirements
  let requiredExperienceYears = 0;
  let experienceLevel = 'mid-level';
  for (const pattern of EXPERIENCE_PATTERNS) {
    const match = jobDescriptionText.match(pattern);
    if (match) {
      if (match[1]) requiredExperienceYears = parseInt(match[1]);
      if (/senior|lead|principal|staff|architect/i.test(match[0])) experienceLevel = 'senior';
      else if (/junior|entry.?level|associate|graduate|intern/i.test(match[0])) experienceLevel = 'junior';
      else if (/mid.?level|intermediate/i.test(match[0])) experienceLevel = 'mid-level';
      break;
    }
  }

  // Extract education requirements
  let requiredEducation = 'none';
  if (EDUCATION_PATTERNS[2].test(jobDescriptionText)) requiredEducation = 'phd';
  else if (EDUCATION_PATTERNS[1].test(jobDescriptionText)) requiredEducation = 'masters';
  else if (EDUCATION_PATTERNS[0].test(jobDescriptionText)) requiredEducation = 'bachelors';
  else if (EDUCATION_PATTERNS[3].test(jobDescriptionText)) requiredEducation = 'bachelors';

  // Extract all keywords (important ones)
  const keywords = extractKeywords(jobDescriptionText);

  return {
    jobTitle,
    company,
    detectedSkills,
    requiredExperienceYears,
    experienceLevel,
    requiredEducation,
    keywords,
    rawText: jobDescriptionText,
  };
};

/**
 * Run the full Job Match Analysis
 * @param {Object} resumeAnalysis - Saved analysis from Firestore (from getLatestAnalysisResult)
 * @param {string} jobDescriptionText - Raw JD text pasted/uploaded by user
 * @param {Object} jobMeta - { jobTitle, company } optional overrides
 * @returns {Object} Full match report
 */
export const analyzeJobMatch = (resumeAnalysis = {}, jobDescriptionText = '', jobMeta = {}) => {
  if (!jobDescriptionText.trim()) {
    return createEmptyResult('No job description provided.');
  }

  const jd = parseJobDescription(jobDescriptionText);
  const jobTitle = jobMeta.jobTitle || jd.jobTitle;
  const company = jobMeta.company || jd.company;

  // Resume data
  const resumeSkills = [
    ...(resumeAnalysis.skills || []),
    ...(resumeAnalysis.detectedSkills || []),
  ].map(s => s.toLowerCase());

  const resumeText = (resumeAnalysis.resumeText || '').toLowerCase();
  const hasResume = resumeText.length > 0 || resumeSkills.length > 0;

  // ── 1. Skill Match (40 points) ────────────────────────────────────────────
  const jdSkillsLower = jd.detectedSkills.map(s => s.toLowerCase());

  const matchingSkills = [];
  const missingSkills = [];

  jdSkillsLower.forEach(jdSkill => {
    const aliases = SKILL_ALIASES[jdSkill] || [jdSkill];
    const userHasIt = aliases.some(alias =>
      resumeSkills.some(rs => rs.includes(alias) || alias.includes(rs))
    );
    const canonicalName = Object.keys(SKILL_ALIASES).find(k => k === jdSkill) || jdSkill;

    if (userHasIt) {
      matchingSkills.push(canonicalName);
    } else {
      missingSkills.push(canonicalName);
    }
  });

  const skillMatchRatio = jdSkillsLower.length > 0
    ? matchingSkills.length / jdSkillsLower.length
    : resumeSkills.length > 0 ? 0.5 : 0;
  const skillScore = Math.round(skillMatchRatio * 40);

  // ── 2. Keyword Match (25 points) ─────────────────────────────────────────
  const jdKeywords = jd.keywords;
  const matchedKeywords = [];
  const missingKeywords = [];

  jdKeywords.forEach(kw => {
    const inResume = resumeText.includes(kw.toLowerCase()) ||
      resumeSkills.some(s => s.includes(kw.toLowerCase()));
    if (inResume) matchedKeywords.push(kw);
    else missingKeywords.push(kw);
  });

  const keywordRatio = jdKeywords.length > 0 ? matchedKeywords.length / jdKeywords.length : 0.4;
  const keywordScore = Math.round(keywordRatio * 25);

  // ── 3. Experience Match (20 points) ──────────────────────────────────────
  let experienceScore = 10; // default partial credit
  const hasExperienceSection = /\b(experience|employment|work history|professional)\b/i.test(resumeText);
  const hasInternship = /\b(intern|internship)\b/i.test(resumeText);

  if (hasExperienceSection) {
    if (jd.experienceLevel === 'junior') experienceScore = 20;
    else if (jd.experienceLevel === 'mid-level') experienceScore = hasExperienceSection ? 16 : 8;
    else if (jd.experienceLevel === 'senior') {
      // Check for seniority signals
      const hasSeniorSignals = /\b(led|managed|architected|designed|ownership|delivered|principal|senior|lead)\b/i.test(resumeText);
      experienceScore = hasSeniorSignals ? 18 : 10;
    }
  } else if (hasInternship) {
    experienceScore = jd.experienceLevel === 'junior' ? 15 : 8;
  }

  // ── 4. Education Match (15 points) ───────────────────────────────────────
  const resumeHasPhD = /\b(phd|ph\.d|doctorate)\b/i.test(resumeText);
  const resumeHasMasters = /\b(master|m\.s|msc|mtech|mba)\b/i.test(resumeText);
  const resumeHasBachelors = /\b(bachelor|b\.s|bsc|b\.tech|b\.e|degree|university|college)\b/i.test(resumeText);

  let educationScore = 5; // base
  if (jd.requiredEducation === 'phd') {
    educationScore = resumeHasPhD ? 15 : resumeHasMasters ? 10 : 5;
  } else if (jd.requiredEducation === 'masters') {
    educationScore = resumeHasMasters || resumeHasPhD ? 15 : resumeHasBachelors ? 10 : 5;
  } else if (jd.requiredEducation === 'bachelors') {
    educationScore = resumeHasBachelors || resumeHasMasters || resumeHasPhD ? 15 : 8;
  } else {
    educationScore = resumeHasBachelors ? 12 : 8;
  }

  // ── Final Score ────────────────────────────────────────────────────────────
  const rawScore = skillScore + keywordScore + experienceScore + educationScore;
  const matchScore = Math.min(100, Math.max(0, rawScore));

  // ── Match Level ────────────────────────────────────────────────────────────
  let matchLevel = '';
  let matchColor = '';
  if (matchScore >= 90) { matchLevel = 'Excellent Match'; matchColor = 'emerald'; }
  else if (matchScore >= 75) { matchLevel = 'Strong Match'; matchColor = 'blue'; }
  else if (matchScore >= 60) { matchLevel = 'Moderate Match'; matchColor = 'amber'; }
  else if (matchScore >= 40) { matchLevel = 'Weak Match'; matchColor = 'orange'; }
  else { matchLevel = 'Poor Match'; matchColor = 'rose'; }

  // ── Recommended Skills to Learn ───────────────────────────────────────────
  const recommendedSkills = generateSkillRecommendations(missingSkills, resumeSkills);

  // ── Resume Strengths for this JD ─────────────────────────────────────────
  const resumeStrengths = [];
  if (matchingSkills.length > 0) {
    resumeStrengths.push(`Your profile covers ${matchingSkills.length} of the required technical skills.`);
  }
  if (skillMatchRatio >= 0.7) {
    resumeStrengths.push('Strong technical skill alignment with the job requirements.');
  }
  if (matchedKeywords.length > 0) {
    resumeStrengths.push(`${matchedKeywords.length} key job description terms found in your resume.`);
  }
  if (hasExperienceSection) {
    resumeStrengths.push('Professional experience section signals relevant work history to ATS systems.');
  }
  if (resumeHasBachelors || resumeHasMasters) {
    resumeStrengths.push('Education credentials meet or exceed job requirements.');
  }
  if (resumeStrengths.length === 0) {
    resumeStrengths.push('Resume has parseable content detectable by ATS systems.');
  }

  // ── Improvement Suggestions ───────────────────────────────────────────────
  const improvementSuggestions = [];
  if (missingSkills.length > 0) {
    improvementSuggestions.push(
      `Add missing skills to your resume: ${missingSkills.slice(0, 4).join(', ')}. These are required by this job.`
    );
  }
  if (missingKeywords.length > 0) {
    improvementSuggestions.push(
      `Incorporate these ATS keywords from the JD: ${missingKeywords.slice(0, 5).join(', ')}.`
    );
  }
  if (skillMatchRatio < 0.5) {
    improvementSuggestions.push(
      'Consider building projects that demonstrate the missing skills before applying.'
    );
  }
  if (!hasExperienceSection) {
    improvementSuggestions.push(
      'Add a detailed Professional Experience section with quantified achievements (e.g., "Increased performance by 40%").'
    );
  }
  if (missingKeywords.length > 5) {
    improvementSuggestions.push(
      'Tailor your resume for this specific role by mirroring exact phrases from the job description.'
    );
  }
  improvementSuggestions.push(
    'Use strong action verbs (Architected, Developed, Optimized, Led) when describing achievements.'
  );
  if (improvementSuggestions.length < 4) {
    improvementSuggestions.push(
      'Quantify achievements in your experience section with metrics (percentages, team sizes, revenue impact).'
    );
  }

  // ── Chart breakdown ───────────────────────────────────────────────────────
  const breakdown = {
    skillMatch: { score: skillScore, max: 40, pct: Math.round(skillMatchRatio * 100) },
    keywordMatch: { score: keywordScore, max: 25, pct: Math.round(keywordRatio * 100) },
    experienceMatch: { score: experienceScore, max: 20, pct: Math.round((experienceScore / 20) * 100) },
    educationMatch: { score: educationScore, max: 15, pct: Math.round((educationScore / 15) * 100) },
  };

  return {
    matchScore,
    matchLevel,
    matchColor,
    jobTitle,
    company,
    matchingSkills,
    missingSkills,
    matchedKeywords,
    missingKeywords,
    recommendedSkills,
    resumeStrengths,
    improvementSuggestions,
    breakdown,
    analyzedAt: new Date().toISOString(),
  };
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractKeywords(text) {
  const normalized = text.toLowerCase();
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'that', 'this',
    'these', 'those', 'it', 'its', 'we', 'you', 'they', 'their', 'our',
    'your', 'his', 'her', 'who', 'what', 'which', 'when', 'where', 'why',
    'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other',
    'some', 'such', 'than', 'then', 'so', 'not', 'no', 'if', 'as', 'up',
    'about', 'into', 'through', 'during', 'before', 'after', 'above',
    'below', 'between', 'out', 'off', 'over', 'under', 'again', 'further',
    'once', 'here', 'there', 'any', 'own', 'same', 'very', 'just', 'also',
    'using', 'use', 'used', 'work', 'working', 'strong', 'ability', 'good',
    'knowledge', 'understanding', 'experience', 'years', 'role', 'team',
    'skills', 'required', 'preferred', 'plus', 'nice'
  ]);

  // Extract 2–3 word phrases and single meaningful words
  const words = normalized
    .replace(/[^a-z0-9#+./\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));

  // Weight: words near HIGH_PRIORITY_TERMS get importance
  const highPriorityContext = [];
  const lines = normalized.split(/[\n.]/);

  lines.forEach(line => {
    const isHighPriority = HIGH_PRIORITY_TERMS.some(t => line.includes(t));
    if (isHighPriority) {
      const lineWords = line.split(/\s+/).filter(w => w.length > 3 && !stopWords.has(w));
      highPriorityContext.push(...lineWords);
    }
  });

  // Combine and deduplicate, prioritize high-priority
  const combined = [...new Set([...highPriorityContext, ...words])];

  // Filter out skills (already captured separately) and return top 20 terms
  return combined
    .filter(w => w.length >= 4 && !w.match(/^\d+$/))
    .slice(0, 20);
}

function generateSkillRecommendations(missingSkills, userSkills) {
  const recommendations = [];

  const SKILL_ROADMAP = {
    'react': { learn: 'React.js', from: 'https://react.dev', time: '4-6 weeks' },
    'typescript': { learn: 'TypeScript', from: 'TypeScript Official Docs', time: '2-3 weeks' },
    'node.js': { learn: 'Node.js + Express', from: 'Node.js Official Site', time: '4-6 weeks' },
    'docker': { learn: 'Docker Fundamentals', from: 'Docker Official Tutorial', time: '1-2 weeks' },
    'kubernetes': { learn: 'Kubernetes Basics', from: 'Kubernetes.io', time: '2-4 weeks' },
    'aws': { learn: 'AWS Cloud Practitioner', from: 'AWS Training', time: '4-8 weeks' },
    'ci/cd': { learn: 'GitHub Actions CI/CD', from: 'GitHub Docs', time: '1-2 weeks' },
    'machine learning': { learn: 'ML with Python', from: 'fast.ai or Coursera', time: '8-12 weeks' },
    'graphql': { learn: 'GraphQL Fundamentals', from: 'graphql.org', time: '2-3 weeks' },
    'sql': { learn: 'SQL & PostgreSQL', from: 'SQLZoo or Mode Analytics', time: '2-4 weeks' },
    'terraform': { learn: 'Terraform by HashiCorp', from: 'learn.hashicorp.com', time: '2-3 weeks' },
    'testing': { learn: 'Jest Testing + Cypress E2E', from: 'Jest Docs', time: '2-3 weeks' },
    'vue': { learn: 'Vue.js 3', from: 'vuejs.org', time: '3-5 weeks' },
    'next.js': { learn: 'Next.js App Router', from: 'nextjs.org/learn', time: '3-4 weeks' },
    'python': { learn: 'Python for Developers', from: 'Python.org or realpython.com', time: '4-8 weeks' },
    'go': { learn: 'Go Language', from: 'go.dev/learn', time: '4-6 weeks' },
  };

  missingSkills.slice(0, 6).forEach(skill => {
    const roadmap = SKILL_ROADMAP[skill.toLowerCase()];
    if (roadmap) {
      recommendations.push({
        skill: roadmap.learn,
        resource: roadmap.from,
        estimatedTime: roadmap.time,
      });
    } else {
      recommendations.push({
        skill: skill.charAt(0).toUpperCase() + skill.slice(1),
        resource: 'Search official documentation or Udemy',
        estimatedTime: '2-4 weeks',
      });
    }
  });

  return recommendations;
}

function createEmptyResult(message) {
  return {
    matchScore: 0,
    matchLevel: 'No Data',
    matchColor: 'gray',
    jobTitle: '',
    company: '',
    matchingSkills: [],
    missingSkills: [],
    matchedKeywords: [],
    missingKeywords: [],
    recommendedSkills: [],
    resumeStrengths: [],
    improvementSuggestions: [message],
    breakdown: {
      skillMatch: { score: 0, max: 40, pct: 0 },
      keywordMatch: { score: 0, max: 25, pct: 0 },
      experienceMatch: { score: 0, max: 20, pct: 0 },
      educationMatch: { score: 0, max: 15, pct: 0 },
    },
    analyzedAt: new Date().toISOString(),
  };
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Generate CSV report string from a match result
 * @param {Object} matchResult
 * @returns {string} CSV content
 */
export const generateMatchCSV = (matchResult) => {
  const { jobTitle, company, matchScore, matchLevel, matchingSkills, missingSkills,
    matchedKeywords, missingKeywords, improvementSuggestions, breakdown } = matchResult;

  const rows = [
    ['Job Match Report — HireSense AI'],
    [''],
    ['Job Title', jobTitle],
    ['Company', company],
    ['Match Score', `${matchScore}%`],
    ['Match Level', matchLevel],
    ['Analyzed At', new Date().toLocaleDateString()],
    [''],
    ['Category', 'Score', 'Max', 'Percentage'],
    ['Skill Match', breakdown.skillMatch.score, breakdown.skillMatch.max, `${breakdown.skillMatch.pct}%`],
    ['Keyword Match', breakdown.keywordMatch.score, breakdown.keywordMatch.max, `${breakdown.keywordMatch.pct}%`],
    ['Experience Match', breakdown.experienceMatch.score, breakdown.experienceMatch.max, `${breakdown.experienceMatch.pct}%`],
    ['Education Match', breakdown.educationMatch.score, breakdown.educationMatch.max, `${breakdown.educationMatch.pct}%`],
    [''],
    ['Matching Skills'],
    ...matchingSkills.map(s => [s]),
    [''],
    ['Missing Skills'],
    ...missingSkills.map(s => [s]),
    [''],
    ['Matched Keywords'],
    ...matchedKeywords.map(k => [k]),
    [''],
    ['Missing Keywords'],
    ...missingKeywords.map(k => [k]),
    [''],
    ['Improvement Suggestions'],
    ...improvementSuggestions.map((s, i) => [`${i + 1}. ${s}`]),
  ];

  return rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
};
