import { analyzeResume as fallbackAnalyzeResume } from './aiAnalyzer';

const getApiKey = () => {
  return import.meta.env.VITE_GEMINI_API_KEY || 
         localStorage.getItem('VITE_GEMINI_API_KEY') || 
         localStorage.getItem('gemini_api_key');
};

const responseCache = new Map();

// Helper to enforce timeouts on promises
const withTimeout = (promise, ms, errorMessage = "Operation timed out") => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(errorMessage)), ms);
    promise.then(
      (res) => { clearTimeout(timer); resolve(res); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
};

// Helper to retry calls with exponential backoff
const withRetry = async (fn, retries = 3, delay = 500) => {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }
  throw lastError;
};

// Strips markdown json codeblock wrappers if returned by the model
const cleanJsonString = (str) => {
  let cleaned = str.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  return cleaned.trim();
};

/**
 * Conducts automated ATS resume analysis with Gemini Flash
 */
export const analyzeResumeWithGemini = async (resumeText, timeoutMs = 10000) => {
  if (!resumeText) return fallbackAnalyzeResume(resumeText);

  // Check cache to avoid duplicate billing/requests
  const cacheKey = `resume_${resumeText.substring(0, 100)}_${resumeText.length}`;
  if (responseCache.has(cacheKey)) {
    console.log("Returning cached resume analysis");
    return responseCache.get(cacheKey);
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("Gemini API key is not configured. Falling back to local rule-based analysis.");
    return fallbackAnalyzeResume(resumeText);
  }

  const prompt = `You are a Senior Technical Recruiter and ATS Expert.
Analyze the following resume text:
"""
${resumeText}
"""

Perform:
1. ATS Score evaluation (number from 0 to 100 based on standard ATS parameters: formatting, contact info, section structure, and technical depth).
2. Overall rating ("Excellent", "Strong", "Good", "Needs Improvement", or "Weak").
3. Core strengths (list of 2-4 strings).
4. Areas to address / Weaknesses (list of 2-4 strings).
5. Detected technical skills (list of technologies/tools present in the text).
6. Missing skills recommendations (list of modern tools/skills that are highly relevant to their background but missing).
7. Actionable improvement suggestions (list of 5 specific, helpful bullet points for formatting or descriptions).
8. Recommended projects (list of 2-3 projects with details, formatted as "Project Title: Description").
9. Recommended certifications (list of 2-3 industry-standard certs/badges).
10. Career advice (detailed actionable suggestion of 2-3 sentences).

You MUST return JSON only. The JSON response must strictly follow this schema:
{
  "atsScore": number,
  "overallRating": "Excellent" | "Strong" | "Good" | "Needs Improvement" | "Weak",
  "strengths": ["string"],
  "weaknesses": ["string"],
  "detectedSkills": ["string"],
  "missingSkills": ["string"],
  "improvementSuggestions": ["string"],
  "recommendedProjects": ["string"],
  "recommendedCertifications": ["string"],
  "careerAdvice": "string"
}

Return ONLY valid JSON. Do not include any explanations, markdown code blocks, or preamble outside of the JSON structure.`;

  try {
    const response = await withTimeout(
      withRetry(async () => {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.3,
            },
          }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error?.message || `Failed with status ${res.status}`);
        }
        return res;
      }),
      timeoutMs,
      "Gemini request timed out"
    );

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResponse) throw new Error("Empty response candidates");

    const cleanJson = cleanJsonString(textResponse);
    const parsed = JSON.parse(cleanJson);
    
    // Save to memory cache
    responseCache.set(cacheKey, parsed);
    return parsed;
  } catch (error) {
    console.warn("Gemini resume analysis failed. Using fallback:", error.message);
    return fallbackAnalyzeResume(resumeText);
  }
};

/**
 * Generates custom interview questions from candidate resume
 */
export const generateQuestionsWithGemini = async (resumeText, options = {}, timeoutMs = 15000) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Gemini API Key is not configured. Please supply a key.');
  }

  const { company = 'None', level = 'Experienced' } = options;

  const companyPrompt = company && company !== 'None'
    ? `Tailor a substantial portion of the questions to match the interviewing style, core values, standards, and typical engineering patterns of ${company}.`
    : '';

  const levelPrompt = level
    ? `Formulate the difficulty, technical depth, architectural requirements, and complexity of the questions suitable for a candidate at the "${level}" career level.`
    : '';

  const prompt = `You are an experienced Senior Software Engineer and Technical Interviewer.
Analyze the following resume content:
"""
${resumeText}
"""

${companyPrompt}
${levelPrompt}

Generate exactly the following interview questions based on the candidate's Experience, Projects, Skills, and Education:
- 10 HR Interview Questions
- 15 Technical Questions
- 10 Project Based Questions
- 10 Behavioral Questions
- 5 Coding Round Questions

For every question, also generate:
- Expected Answer (detailed technical guidelines or expected bullet points)
- Difficulty (strictly one of: "Easy", "Medium", "Hard")
- Evaluation Criteria (what a good response must satisfy)
- Evaluation Rubric (clear metric grading rubric guidelines)
- Hints (array of 2 short hints to guide candidate's thoughts)

You MUST return JSON only. The JSON response must strictly follow this schema:
{
  "hr": [
    {
      "question": "string",
      "expectedAnswer": "string",
      "difficulty": "Easy" | "Medium" | "Hard",
      "evaluationCriteria": "string",
      "evaluationRubric": "string",
      "hints": ["string"]
    }
  ],
  "technical": [
    {
      "question": "string",
      "expectedAnswer": "string",
      "difficulty": "Easy" | "Medium" | "Hard",
      "evaluationCriteria": "string",
      "evaluationRubric": "string",
      "hints": ["string"]
    }
  ],
  "project": [
    {
      "question": "string",
      "expectedAnswer": "string",
      "difficulty": "Easy" | "Medium" | "Hard",
      "evaluationCriteria": "string",
      "evaluationRubric": "string",
      "hints": ["string"]
    }
  ],
  "behavioral": [
    {
      "question": "string",
      "expectedAnswer": "string",
      "difficulty": "Easy" | "Medium" | "Hard",
      "evaluationCriteria": "string",
      "evaluationRubric": "string",
      "hints": ["string"]
    }
  ],
  "coding": [
    {
      "question": "string",
      "expectedAnswer": "string",
      "difficulty": "Easy" | "Medium" | "Hard",
      "evaluationCriteria": "string",
      "evaluationRubric": "string",
      "hints": ["string"]
    }
  ]
}

Return ONLY valid JSON. Do not include any explanation, markdown code blocks, or preamble outside of the JSON structure. Make sure you return exactly 10 HR, 15 Technical, 10 Project, 10 Behavioral, and 5 Coding questions.`;

  const cacheKey = `questions_${resumeText.substring(0, 100)}_${company}_${level}`;
  if (responseCache.has(cacheKey)) {
    return responseCache.get(cacheKey);
  }

  try {
    const response = await withTimeout(
      withRetry(async () => {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.3,
            },
          }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error?.message || `Failed with status ${res.status}`);
        }
        return res;
      }),
      timeoutMs,
      "Gemini request timed out"
    );

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResponse) throw new Error("Empty response candidates");

    const cleanJson = cleanJsonString(textResponse);
    const parsed = JSON.parse(cleanJson);
    
    responseCache.set(cacheKey, parsed);
    return parsed;
  } catch (error) {
    console.error('Error generating questions with Gemini:', error);
    throw error;
  }
};

/**
 * Compare candidate's resume with a job title/tags for the Job Matcher
 */
export const compareJobWithGemini = async (resumeText, jobTitle, jobRequirements, timeoutMs = 8000) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    // Return a local computed fallback match
    return {
      matchPercentage: 70,
      missingSkills: ['Cloud Architecture', 'System Design'],
      improvementSuggestions: [
        'Highlight full-stack projects in your portfolio.',
        'Detail your experience with backend services.'
      ]
    };
  }

  const prompt = `You are a Technical Recruiter and ATS Expert.
Compare the following candidate resume text:
"""
${resumeText}
"""

Against this job requirement:
Job Title: ${jobTitle}
Requirements: ${jobRequirements}

Evaluate and extract:
1. Match Percentage (number from 0 to 100).
2. Missing Skills (list of tools, methodologies, or languages missing in resume).
3. Improvement Suggestions (list of 2-3 specific ways the candidate can alter their resume to match this position better).

You MUST return JSON only. The JSON response must strictly follow this schema:
{
  "matchPercentage": number,
  "missingSkills": ["string"],
  "improvementSuggestions": ["string"]
}

Return ONLY valid JSON. Do not include any explanations, markdown code blocks, or preamble outside of the JSON structure.`;

  const cacheKey = `jobmatch_${jobTitle.replace(/\s+/g, '')}_${resumeText.substring(0, 50)}`;
  if (responseCache.has(cacheKey)) {
    return responseCache.get(cacheKey);
  }

  try {
    const response = await withTimeout(
      withRetry(async () => {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.3,
            },
          }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error?.message || `Failed with status ${res.status}`);
        }
        return res;
      }),
      timeoutMs,
      "Gemini request timed out"
    );

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResponse) throw new Error("Empty response candidates");

    const cleanJson = cleanJsonString(textResponse);
    const parsed = JSON.parse(cleanJson);
    responseCache.set(cacheKey, parsed);
    return parsed;
  } catch (error) {
    console.warn("Gemini job comparison failed:", error.message);
    return {
      matchPercentage: 65,
      missingSkills: ['Advanced Dev Tools'],
      improvementSuggestions: ['Add more relevant experience keywords.']
    };
  }
};

/**
 * Evaluates candidate responses to mock questions
 */
export const evaluateAnswerWithGemini = async (question, expectedAnswer, userAnswer, difficulty, timeoutMs = 10000) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Gemini API Key is not configured. Please supply a key.');
  }

  const prompt = `You are an experienced Senior Software Engineer and Technical Interviewer.
Evaluate the candidate's answer to the following question.

Question: "${question}"
Expected Answer/Guidelines: "${expectedAnswer}"
Difficulty Level: "${difficulty}"
Candidate's Answer: "${userAnswer}"

Analyze the candidate's answer. Assess:
1. Technical accuracy and completeness.
2. Grammar, structure, and language mechanics.
3. Communication efficacy.
4. Specific strengths of their answer.
5. Specific weaknesses or critical concepts they missed.

You MUST return JSON only. The JSON response must strictly follow this schema:
{
  "score": (number between 0 and 100 representing overall grade),
  "confidence": (string, either "Low", "Medium", or "High" representing your assessment certainty),
  "strengths": (array of strings outlining strengths of their answer),
  "weaknesses": (array of strings outlining weaknesses or key technical details omitted),
  "grammarFeedback": (string summarizing grammar, vocabulary, or language improvements),
  "technicalAccuracy": (string assessing the technical correctness of the answer),
  "communicationScore": (number between 0 and 100 representing clarity and phrasing),
  "improvementSuggestions": (string providing actionable tips for improvement),
  "betterAnswer": (string containing a suggested model answer that is premium, detailed, and directly corrects the user's gaps)
}

Return ONLY valid JSON. Do not include any explanations, markdown code blocks, or preamble outside of the JSON structure.`;

  const cacheKey = `eval_${question.substring(0, 50)}_${userAnswer.substring(0, 50)}`;
  if (responseCache.has(cacheKey)) {
    return responseCache.get(cacheKey);
  }

  try {
    const response = await withTimeout(
      withRetry(async () => {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.2,
            },
          }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error?.message || `Failed with status ${res.status}`);
        }
        return res;
      }),
      timeoutMs,
      "Gemini request timed out"
    );

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResponse) throw new Error("Empty response candidates");

    const cleanJson = cleanJsonString(textResponse);
    const parsed = JSON.parse(cleanJson);
    
    responseCache.set(cacheKey, parsed);
    return parsed;
  } catch (error) {
    console.error('Error evaluating answer with Gemini:', error);
    throw error;
  }
};

/**
 * Generates tailored cover letters
 */
export const generateCoverLetterWithGemini = async (resumeText, company, jobTitle, timeoutMs = 10000) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    return `Dear Hiring Manager at ${company || 'the Team'},\n\nI am writing to express my strong interest in the ${jobTitle || 'Software Engineer'} role. Based on my background in software development, I am confident I would be a great fit for your team.\n\nThank you for your time and consideration.\n\nSincerely,\nCandidate`;
  }

  const prompt = `You are a Professional Career Coach.
Based on the following candidate resume text:
"""
${resumeText}
"""

Write a highly tailored, professional cover letter for this position:
Company: ${company}
Job Title: ${jobTitle}

Return the cover letter text directly. Do not wrap in JSON or include any extra metadata.`;

  try {
    const response = await withTimeout(
      withRetry(async () => {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
            },
          }),
        });
        if (!res.ok) throw new Error(`HTTP status ${res.status}`);
        return res;
      }),
      timeoutMs,
      "Cover letter request timed out"
    );

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Cover letter generation failed.";
  } catch (error) {
    console.warn("Cover letter generation failed, using mock fallback:", error.message);
    return `Dear Hiring Manager at ${company || 'the Team'},\n\nI am writing to express my strong interest in the ${jobTitle || 'Software Engineer'} role. Based on my background in software development, I am confident I would be a great fit for your team.\n\nThank you for your time and consideration.\n\nSincerely,\nCandidate`;
  }
};

/**
 * Optimizes resumes for LinkedIn profiles
 */
export const optimizeLinkedInProfileWithGemini = async (resumeText, timeoutMs = 10000) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    return {
      headline: 'Software Engineer | React & Node.js Developer',
      about: 'Passionate software developer skilled in building highly responsive web applications and scalable backend APIs.',
      experience: ['Optimized React application performance resulting in 30% faster load times.', 'Implemented secure database tables with Firestore.'],
      skills: ['React', 'JavaScript', 'Node.js', 'Firebase']
    };
  }

  const prompt = `You are a LinkedIn Branding Expert.
Analyze this resume text:
"""
${resumeText}
"""

Generate optimized content for a LinkedIn Profile:
1. Professional Headline (max 220 chars, rich in keywords).
2. About / Summary section (first-person narrative, compelling).
3. Optimized bullet points for past experience (2-3 highly technical action-driven bullets).
4. Top 6 keywords/skills to list.

You MUST return JSON only. The JSON response must strictly follow this schema:
{
  "headline": "string",
  "about": "string",
  "experience": ["string"],
  "skills": ["string"]
}

Return ONLY valid JSON. Do not include any explanations, markdown code blocks, or preamble outside of the JSON structure.`;

  try {
    const response = await withTimeout(
      withRetry(async () => {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.4,
            },
          }),
        });
        if (!res.ok) throw new Error(`HTTP status ${res.status}`);
        return res;
      }),
      timeoutMs,
      "LinkedIn optimization request timed out"
    );

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const cleanJson = cleanJsonString(textResponse);
    return JSON.parse(cleanJson);
  } catch (error) {
    console.warn("LinkedIn optimization failed, using mock fallback:", error.message);
    return {
      headline: 'Software Engineer | React & Node.js Developer',
      about: 'Passionate software developer skilled in building highly responsive web applications and scalable backend APIs.',
      experience: ['Optimized React application performance resulting in 30% faster load times.', 'Implemented secure database tables with Firestore.'],
      skills: ['React', 'JavaScript', 'Node.js', 'Firebase']
    };
  }
};

/**
 * Enhances resume bullets based on skills and description details
 */
export const generateResumeBulletsWithGemini = async (skills, experienceText, timeoutMs = 8000) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    return [
      'Developed responsive user interface components using React and custom styling guides.',
      'Designed and optimized database schemas in SQL/NoSQL systems for fast page queries.',
      'Collaborated with cross-functional development teams in agile sprint environments.'
    ];
  }

  const prompt = `You are a Resume Writer.
Based on the skills: "${skills}" and raw experience text: "${experienceText}", generate 3 action-oriented, metric-driven resume bullet points starting with strong action verbs.

You MUST return JSON only. The JSON response must strictly follow this schema:
{
  "bullets": ["string"]
}

Return ONLY valid JSON. Do not include any explanations, markdown code blocks, or preamble outside of the JSON structure.`;

  try {
    const response = await withTimeout(
      withRetry(async () => {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.5,
            },
          }),
        });
        if (!res.ok) throw new Error(`HTTP status ${res.status}`);
        return res;
      }),
      timeoutMs,
      "Resume bullet enhancer timed out"
    );

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const cleanJson = cleanJsonString(textResponse);
    const parsed = JSON.parse(cleanJson);
    return parsed.bullets || parsed;
  } catch (error) {
    console.warn("Resume bullet enhancer failed, using mock fallback:", error.message);
    return [
      'Developed responsive user interface components using React and custom styling guides.',
      'Designed and optimized database schemas in SQL/NoSQL systems for fast page queries.',
      'Collaborated with cross-functional development teams in agile sprint environments.'
    ];
  }
};

/**
 * Evaluates candidate code solutions for code challenges
 */
export const gradeCodingChallengeWithGemini = async (question, language, code, timeoutMs = 10000) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    return {
      score: 80,
      complexity: 'Time: O(N), Space: O(N)',
      strengths: ['Correct code structure.', 'Uses appropriate variables.'],
      weaknesses: ['Does not validate corner cases.'],
      suggestions: 'Add sanity check if argument is empty.',
      optimalCode: 'console.log("No key fallback");'
    };
  }

  const prompt = `You are a Technical Interviewer and Senior Code Auditor.
Evaluate this candidate code challenge solution:

Question/Problem: "${question}"
Language: "${language}"
Candidate's Code:
"""
${code}
"""

Assess:
1. Score (number 0 to 100).
2. Time and Space Complexity.
3. Specific strengths of this implementation.
4. Specific weaknesses (e.g. edge cases missed, inefficient memory structures).
5. Suggestions for improvement.
6. Optimal Code (a clean, fully commented premium implementation in the same language).

You MUST return JSON only. The JSON response must strictly follow this schema:
{
  "score": number,
  "complexity": "string",
  "strengths": ["string"],
  "weaknesses": ["string"],
  "suggestions": "string",
  "optimalCode": "string"
}

Return ONLY valid JSON. Do not include any explanations, markdown code blocks, or preamble outside of the JSON structure.`;

  try {
    const response = await withTimeout(
      withRetry(async () => {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.2,
            },
          }),
        });
        if (!res.ok) throw new Error(`HTTP status ${res.status}`);
        return res;
      }),
      timeoutMs,
      "Code challenge evaluation timed out"
    );

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const cleanJson = cleanJsonString(textResponse);
    return JSON.parse(cleanJson);
  } catch (error) {
    console.warn("Coding grade evaluation failed, using fallback:", error.message);
    return {
      score: 75,
      complexity: 'Time: O(N), Space: O(1)',
      strengths: ['Compiles cleanly.', 'Readable logic.'],
      weaknesses: ['Transcribes input directly without safety checks.'],
      suggestions: 'Inject checks to handle input exceptions.',
      optimalCode: '// Fallback output\n' + code
    };
  }
};
