// AI Resume Analysis Engine Service
// This handles local rule-based parsing of extracted resume text

/**
 * Helper to check if a specific pattern is in the text
 * @param {string} text 
 * @param {RegExp} regex 
 * @returns {boolean}
 */
const checkPattern = (text, regex) => regex.test(text);

/**
 * Run AI Analysis on the extracted resume text
 * @param {string} resumeText 
 * @returns {Object} Analysis results
 */
export const analyzeResume = (resumeText) => {
  if (!resumeText) {
    return {
      atsScore: 0,
      overallRating: 'Weak',
      strengths: ['No text provided'],
      weaknesses: ['Empty resume content'],
      detectedSkills: [],
      missingSkills: [],
      improvementSuggestions: ['Please upload a valid PDF resume with readable text.'],
      recommendedProjects: [],
      recommendedCertifications: []
    };
  }

  const normalizedText = resumeText.toLowerCase();

  // 1. SECTION & CONTACT CHECKS
  // Contact Info Checks
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const phoneRegex = /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
  
  const hasEmail = checkPattern(resumeText, emailRegex);
  const hasPhone = checkPattern(resumeText, phoneRegex);
  const hasLinkedIn = normalizedText.includes('linkedin.com') || normalizedText.includes('linkedin');
  const hasGitHub = normalizedText.includes('github.com') || normalizedText.includes('github');

  let contactScore = 0;
  if (hasEmail) contactScore += 2.5;
  if (hasPhone) contactScore += 2.5;
  if (hasLinkedIn) contactScore += 2.5;
  if (hasGitHub) contactScore += 2.5;

  // Other Section Checks
  const hasEducation = checkPattern(normalizedText, /\b(education|degree|university|college|school|bachelor|master|phd|gpa)\b/);
  const hasExperience = checkPattern(normalizedText, /\b(experience|employment|work history|professional experience|job|internship|intern)\b/);
  const hasSkillsSection = checkPattern(normalizedText, /\b(skills|technologies|proficiencies|languages|tools)\b/);
  const hasProjects = checkPattern(normalizedText, /\b(projects|personal projects|academic projects|portfolio|built)\b/);
  const hasCertifications = checkPattern(normalizedText, /\b(certification|certifications|certified|certificate|credential)\b/);

  // 2. SKILL DETECTION
  const skillList = [
    { name: 'JavaScript', regex: /\b(javascript|js)\b/i },
    { name: 'React', regex: /\b(react|reactjs|react\.js)\b/i },
    { name: 'Node.js', regex: /\b(node|nodejs|node\.js)\b/i },
    { name: 'Firebase', regex: /\b(firebase)\b/i },
    { name: 'MongoDB', regex: /\b(mongodb|mongo)\b/i },
    { name: 'SQL', regex: /\b(sql|mysql|postgresql|sqlite)\b/i },
    { name: 'Python', regex: /\b(python|py)\b/i },
    { name: 'Java', regex: /\b(java)\b/i },
    { name: 'C++', regex: /\bc\+\+\b/i },
    { name: 'Git', regex: /\b(git|github|gitlab)\b/i },
    { name: 'HTML', regex: /\b(html|html5)\b/i },
    { name: 'CSS', regex: /\b(css|css3)\b/i },
    { name: 'Tailwind', regex: /\b(tailwind|tailwindcss)\b/i },
    { name: 'TypeScript', regex: /\b(typescript|ts)\b/i }
  ];

  const detectedSkills = [];
  const missingSkills = [];

  skillList.forEach(skill => {
    if (checkPattern(normalizedText, skill.regex)) {
      detectedSkills.push(skill.name);
    } else {
      missingSkills.push(skill.name);
    }
  });

  // If skills found is >= 3, count skills section as valid even if keyword is missing
  const isSkillsValid = hasSkillsSection || detectedSkills.length >= 3;

  // 3. SCORE CALCULATION
  const educationScore = hasEducation ? 15 : 0;
  const experienceScore = hasExperience ? 25 : 0;
  const skillsScore = isSkillsValid ? 20 : 0;
  const projectsScore = hasProjects ? 20 : 0;
  const certificationsScore = hasCertifications ? 10 : 0;

  const atsScore = Math.round(contactScore + educationScore + experienceScore + skillsScore + projectsScore + certificationsScore);

  // 4. RATING
  let overallRating = 'Weak';
  if (atsScore >= 90) overallRating = 'Excellent';
  else if (atsScore >= 75) overallRating = 'Strong';
  else if (atsScore >= 60) overallRating = 'Good';
  else if (atsScore >= 40) overallRating = 'Needs Improvement';

  // 5. STRENGTHS & WEAKNESSES
  const strengths = [];
  const weaknesses = [];

  if (hasEmail) strengths.push('Contains contact email address.');
  else weaknesses.push('Missing contact email address.');

  if (hasPhone) strengths.push('Contains contact phone number.');
  else weaknesses.push('Missing contact phone number.');

  if (hasLinkedIn) strengths.push('Professional LinkedIn connection link provided.');
  else weaknesses.push('LinkedIn profile link missing.');

  if (hasGitHub) strengths.push('GitHub repository link included.');
  else weaknesses.push('GitHub repository link missing for code showcase.');

  if (hasEducation) strengths.push('Dedicated Education credentials section present.');
  else weaknesses.push('Education background section is missing.');

  if (hasExperience) strengths.push('Structured Professional Experience history present.');
  else weaknesses.push('Professional Work Experience section is missing.');

  if (isSkillsValid) strengths.push('Comprehensive list of technical skills present.');
  else weaknesses.push('Skills section is missing or poorly defined.');

  if (hasProjects) strengths.push('Hands-on Projects section included.');
  else weaknesses.push('No projects section listed to demonstrate technical execution.');

  if (hasCertifications) strengths.push('Professional Certifications/Credentials listed.');
  else weaknesses.push('No certifications listed to validate skill proficiencies.');

  // Check count of strengths/weaknesses and insert generalized ones if empty
  if (strengths.length === 0) strengths.push('Resume contains parseable characters.');
  if (weaknesses.length === 0) weaknesses.push('Excellent profile layout completeness. No major weaknesses detected.');

  // 6. SUGGESTIONS
  const suggestions = [];

  if (!hasEmail || !hasPhone) {
    suggestions.push('Add full contact information (email and phone number) prominently at the top of your resume.');
  }
  if (!hasLinkedIn) {
    suggestions.push('Create and include a LinkedIn profile link to improve recruiter networking opportunities.');
  }
  if (!hasGitHub && (detectedSkills.includes('React') || detectedSkills.includes('JavaScript') || detectedSkills.includes('Node.js'))) {
    suggestions.push('Include a GitHub profile link to provide proof of code quality and highlight your open-source contributions.');
  }
  if (!hasEducation) {
    suggestions.push('Create a clear "Education" section list specifying your degrees, institutions, and graduation timelines.');
  }
  if (!hasExperience) {
    suggestions.push('Add a "Professional Experience" section. If you are a student, include internships, volunteer roles, or group projects.');
  }
  if (!hasProjects) {
    suggestions.push('Highlight 2-3 personal or academic projects showcasing skills like frontend dev, fullstack database integrations, or scripts.');
  }
  if (!hasCertifications) {
    suggestions.push('Add a "Certifications" or "Accomplishments" section to highlight courses, badges, or bootcamps completed.');
  }

  // Skill-Specific suggestions
  if (detectedSkills.includes('React')) {
    suggestions.push('Since you know React, add Next.js and Redux to your skills profile to display full-stack routing and advanced state management capability.');
  }
  if (detectedSkills.includes('JavaScript') && !detectedSkills.includes('TypeScript')) {
    suggestions.push('Since you know JavaScript, learn and list TypeScript. Most modern frontend roles require TS support.');
  }
  if (detectedSkills.includes('Firebase') && !detectedSkills.includes('Node.js')) {
    suggestions.push('Since you know Firebase, learn Node.js with Express to build custom backend APIs when you outgrow BaaS.');
  }

  // General ATS tips to ensure we have at least 5 suggestions
  const generalTips = [
    'Use standard bullet points starting with strong action verbs (e.g. "Designed", "Developed", "Optimized") instead of paragraphs.',
    'Keep your formatting standard: avoid using tables, headers/footers, or text boxes as they confuse ATS parsers.',
    'Review your resume page length: keep it strictly to 1 page if under 5 years experience, or 2 pages maximum for senior profiles.',
    'Customize your resume for every job application by mapping key phrases from the job description directly into your skills list.'
  ];

  while (suggestions.length < 5) {
    const nextTip = generalTips[suggestions.length % generalTips.length];
    if (!suggestions.includes(nextTip)) {
      suggestions.push(nextTip);
    } else {
      suggestions.push(generalTips[Math.floor(Math.random() * generalTips.length)]);
    }
  }

  // 7. RECOMMENDED PROJECTS & CERTIFICATIONS
  const recommendedProjects = [];
  const recommendedCertifications = [];

  if (detectedSkills.includes('React') || detectedSkills.includes('JavaScript')) {
    recommendedProjects.push('E-Commerce Platform: Build an online shop using React, Stripe payments, and context-based state management.');
    recommendedProjects.push('Task Collaborator: Create a real-time Kanban board with drag-and-drop mechanics using React and socket protocols.');
    
    recommendedCertifications.push('Meta Front-End Developer Professional Certificate (Coursera)');
    recommendedCertifications.push('freeCodeCamp JavaScript Algorithms and Data Structures');
  }

  if (detectedSkills.includes('Node.js') || detectedSkills.includes('SQL') || detectedSkills.includes('MongoDB')) {
    recommendedProjects.push('SaaS Backend API: Build a secure RESTful API using Node.js, Express, SQL/NoSQL databases, JWT, and email activations.');
    
    recommendedCertifications.push('MongoDB Certified Developer Associate');
    recommendedCertifications.push('AWS Certified Developer – Associate');
  }

  if (detectedSkills.includes('Python')) {
    recommendedProjects.push('Data Insights Model: Create a machine learning predictive analyzer utilizing pandas, numpy, and scikit-learn.');
    recommendedProjects.push('FastAPI Automation Agent: Implement a background scraping worker and trigger jobs via asynchronous backend tasks.');
    
    recommendedCertifications.push('PCEP – Certified Entry-Level Python Programmer (Python Institute)');
  }

  if (detectedSkills.includes('Java') || detectedSkills.includes('C++')) {
    recommendedProjects.push('Local Analytics Parser: Develop an object-oriented file directory scanner analyzing system metrics in Java/C++.');
    recommendedCertifications.push('Oracle Certified Associate, Java SE Developer');
  }

  // Fallback defaults if list is empty
  if (recommendedProjects.length === 0) {
    recommendedProjects.push('Full-Stack Web App: Build an online portal integrating database tables, user management, and responsive CSS frameworks.');
    recommendedProjects.push('Personal Portfolio Hub: Create a fast, accessible showcase site mapping credentials and featuring smooth web animations.');
  }

  if (recommendedCertifications.length === 0) {
    recommendedCertifications.push('Google IT Support Professional Certificate');
    recommendedCertifications.push('AWS Certified Cloud Practitioner');
  }

  return {
    atsScore,
    overallRating,
    strengths: strengths.slice(0, 4), // Limit lists for clean visuals
    weaknesses: weaknesses.slice(0, 4),
    detectedSkills,
    missingSkills,
    improvementSuggestions: suggestions,
    recommendedProjects: recommendedProjects.slice(0, 3),
    recommendedCertifications: recommendedCertifications.slice(0, 3)
  };
};
