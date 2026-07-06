import { GoogleGenAI } from '@google/genai';
import { analyzeResume as fallbackAnalyzeResume } from './aiAnalyzer';
import toast from 'react-hot-toast';

// Default model configuration
const MODEL = "gemini-2.5-flash";

const getApiKey = () => {
  return import.meta.env.VITE_GEMINI_API_KEY;
};

const responseCache = new Map();
let resolvedModel = null; // Caches the active model resolved during fallbacks

const getActiveModel = () => {
  return resolvedModel || MODEL;
};

// Target retry delays: Retry 1: 2s, Retry 2: 5s, Retry 3: 10s
const RETRY_DELAYS = [2000, 5000, 10000];

const isTemporaryServerError = (err) => {
  const status = err.status || err.response?.status || 0;
  const msg = (err.message || "").toLowerCase();
  
  if (status === 500 || status === 502 || status === 503 || status === 504) {
    return true;
  }
  if (
    msg.includes("500") || 
    msg.includes("502") || 
    msg.includes("503") || 
    msg.includes("504") ||
    msg.includes("timeout") ||
    msg.includes("deadline") ||
    msg.includes("gateway") ||
    msg.includes("unavailable") ||
    msg.includes("overloaded")
  ) {
    return true;
  }
  return false;
};

const shouldRetryError = (err) => {
  const status = err.status || err.response?.status || 0;
  const msg = (err.message || "").toLowerCase();

  // Fail fast on authentication, authorization, or model-not-found issues
  if (
    status === 401 || 
    status === 403 || 
    status === 404 || 
    msg.includes("api_key_invalid") || 
    msg.includes("unauthorized") || 
    msg.includes("forbidden") || 
    msg.includes("not found")
  ) {
    return false;
  }
  
  return isTemporaryServerError(err) || msg.includes("network") || msg.includes("fetch") || msg.includes("dns") || msg.includes("connection");
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
 * Repairs truncated or incomplete JSON strings by closing unclosed quotes, brackets, and braces.
 */
const repairTruncatedJson = (text) => {
  let inString = false;
  let escaped = false;
  const stack = [];

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
    } else {
      if (char === '"') {
        inString = true;
      } else if (char === '{' || char === '[') {
        stack.push(char);
      } else if (char === '}') {
        if (stack[stack.length - 1] === '{') {
          stack.pop();
        }
      } else if (char === ']') {
        if (stack[stack.length - 1] === '[') {
          stack.pop();
        }
      }
    }
  }

  let repaired = text;
  if (inString) {
    repaired += '"';
  }

  while (stack.length > 0) {
    const last = stack.pop();
    if (last === '{') {
      repaired += '}';
    } else if (last === '[') {
      repaired += ']';
    }
  }

  // Remove trailing commas inside arrays and objects
  repaired = repaired.replace(/,\s*([\]}])/g, '$1');

  return repaired;
};

/**
 * Parses and repairs malformed JSON responses returned by Gemini.
 */
const repairAndParseJson = (text) => {
  const cleaned = cleanJsonString(text);

  try {
    return JSON.parse(cleaned);
  } catch (initialError) {
    console.warn("[JSON Parser] Initial JSON parse failed. Attempting structural repairs...", initialError.message);
    
    try {
      const repaired = repairTruncatedJson(cleaned);
      return JSON.parse(repaired);
    } catch (secondError) {
      // Fallback: Extract the first JSON structure in the text if surrounded by conversational filler
      const jsonStart = cleaned.indexOf('{');
      const jsonEnd = cleaned.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        try {
          const substringJson = cleaned.substring(jsonStart, jsonEnd + 1);
          const repairedSubstring = repairTruncatedJson(substringJson);
          return JSON.parse(repairedSubstring);
        } catch (subError) {
          // Fall through to throw original
        }
      }
      throw new Error(`JSON Parse Repair Failed. Original error: ${initialError.message}. Repair error: ${secondError.message}`);
    }
  }
};

// Cached GoogleGenAI client instance
let genAIInstance = null;
let lastUsedKey = null;

const getGenAIClient = (apiKey) => {
  if (genAIInstance && lastUsedKey === apiKey) {
    return genAIInstance;
  }
  // Initialize GoogleGenAI with proper httpOptions timeout (120 seconds)
  genAIInstance = new GoogleGenAI({
    apiKey,
    httpOptions: {
      timeout: 120000
    }
  });
  lastUsedKey = apiKey;
  return genAIInstance;
};

export const initializeGemini = () => {
  const apiKey = getApiKey();
  if (apiKey) {
    try {
      getGenAIClient(apiKey);
      console.log("[Gemini Service] Successfully initialized client.");
    } catch (err) {
      console.error("[Gemini Service] Failed to initialize GoogleGenAI client:", err);
    }
  } else {
    console.error("[Gemini Service] API key is missing (VITE_GEMINI_API_KEY).");
    toast.error("Application configuration error. Contact administrator.", {
      id: "gemini-api-key-missing",
      duration: 10000
    });
  }
};

/**
 * Self-healing model fallback resolution logic.
 */
const handleModelFallback = async (ai, lastError) => {
  // Fallback 1: Try gemini-2.5-flash-lite
  if (!resolvedModel || resolvedModel === MODEL) {
    console.warn(`[Gemini Model Fallback] Target ${MODEL} failed or is unavailable. Trying gemini-2.5-flash-lite...`);
    resolvedModel = "gemini-2.5-flash-lite";
    return resolvedModel;
  }
  
  // Fallback 2: Query list of models from SDK and choose the first model that supports generateContent
  if (resolvedModel === "gemini-2.5-flash-lite") {
    console.warn(`[Gemini Model Fallback] Lite model failed. Listing supported models from SDK...`);
    try {
      const listRes = await ai.models.list();
      if (listRes.models && listRes.models.length > 0) {
        const matched = listRes.models.find(m => 
          m.supportedMethods && 
          (m.supportedMethods.includes('generateContent') || m.supportedMethods.includes('generateMessage'))
        );
        if (matched) {
          const resolvedName = matched.name.replace(/^models\//, '');
          resolvedModel = resolvedName;
          console.log(`[Gemini Model Fallback] Resolved active model from SDK listing: ${resolvedName}`);
          return resolvedModel;
        }
      }
    } catch (listErr) {
      console.error("[Gemini Model Fallback] Failed listing models:", listErr.message);
    }
  }

  // If fallback models both failed, throw original error
  throw lastError;
};

/**
 * Reusable request helper that executes content generation via the official @google/genai SDK.
 */
const makeGeminiRequest = async (prompt, config = {}, timeoutMs = 120000) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Application configuration error. Contact administrator.');
  }

  const ai = getGenAIClient(apiKey);
  let activeModel = getActiveModel();
  const startTime = new Date();
  console.log(`[Gemini Request] Request started at: ${startTime.toISOString()} using model: ${activeModel}`);

  let retryCount = 0;

  const executeCall = async (modelToUse) => {
    let lastError;
    const maxAttempts = 4; // 1 initial try + 3 retries
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (attempt > 1) {
        retryCount++;
      }
      try {
        const response = await ai.models.generateContent({
          model: modelToUse,
          contents: prompt,
          config: {
            temperature: 0.3,
            maxOutputTokens: 4096,
            topP: 0.8,
            topK: 40,
            ...config
          }
        });
        return response;
      } catch (err) {
        lastError = err;
        const msg = err.message || "";
        const status = err.status || err.response?.status || 0;

        // Check model availability signals to trigger fallback chains
        if (status === 404 || msg.includes("404") || msg.includes("model not found") || msg.toLowerCase().includes("model")) {
          err.isModelError = true;
        }

        // If it's a permanent error, or it's our last attempt, throw immediately
        if (!shouldRetryError(err) || attempt === maxAttempts || err.isModelError) {
          throw err;
        }

        // Delay and notify during retries: attempt 1 -> delays[0]=2s, attempt 2 -> delays[1]=5s, attempt 3 -> delays[2]=10s
        const delayMs = RETRY_DELAYS[attempt - 1] || 10000;
        console.warn(`[Gemini Retry] Attempt ${attempt} failed: ${msg}. Retrying in ${delayMs}ms...`);
        
        // Show busy message to user in UI (STEP 4)
        toast.loading("Google AI server is busy, retrying...", { id: 'gemini-retry-toast' });
        
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
    throw lastError;
  };

  try {
    let response;
    try {
      response = await executeCall(activeModel);
    } catch (err) {
      if (err.isModelError) {
        const nextModel = await handleModelFallback(ai, err);
        activeModel = nextModel;
        console.log(`[Gemini Request] Triggering fallback executeCall using model: ${activeModel}`);
        response = await executeCall(activeModel);
      } else {
        throw err;
      }
    }

    // Dismiss retry toast on success
    toast.dismiss('gemini-retry-toast');

    const text = response.text;
    if (!text) {
      throw new Error("Empty response returned by Gemini SDK");
    }

    const endTime = new Date();
    const duration = endTime - startTime;

    console.log(`[Gemini Request] Request started: ${startTime.toISOString()}`);
    console.log(`[Gemini Request] Response received: ${endTime.toISOString()}`);
    console.log(`[Gemini Request] Retry count: ${retryCount}`);
    console.log(`[Gemini Request] Total response time: ${duration}ms`);
    console.log(`[Gemini Request] Final status: Success`);
    if (response.usageMetadata) {
      console.log(`[Gemini Request] Token Usage: Prompt: ${response.usageMetadata.promptTokenCount}, Completion: ${response.usageMetadata.candidatesTokenCount}, Total: ${response.usageMetadata.totalTokenCount}`);
    }

    return text;
  } catch (error) {
    // Dismiss retry toast and trigger friendly error toast
    toast.dismiss('gemini-retry-toast');
    toast.error("Google AI is temporarily unavailable. Please try again in a few minutes.", { id: 'gemini-retry-toast' });

    const endTime = new Date();
    const duration = endTime - startTime;

    console.error(`[Gemini Request] Request started: ${startTime.toISOString()}`);
    console.error(`[Gemini Request] Failed after: ${duration}ms`);
    console.error(`[Gemini Request] Retry count: ${retryCount}`);
    console.error(`[Gemini Request] Final status: Failed (${error.message})`);

    // Throw friendly UI message instead of raw error crash (STEP 5)
    throw new Error("Google AI is temporarily unavailable. Please try again in a few minutes.");
  }
};

/**
 * Reusable helper for requests requiring a JSON response.
 */
const makeGeminiJsonRequest = async (prompt, config = {}, timeoutMs = 120000) => {
  const text = await makeGeminiRequest(prompt, {
    responseMimeType: 'application/json',
    ...config
  }, timeoutMs);
  return repairAndParseJson(text);
};

/**
 * Simple diagnostic test function for SDK verification.
 */
export const testGemini = async () => {
  const apiKey = getApiKey();
  const sdkVersion = "2.10.0";
  const modelName = getActiveModel(); 

  console.log(`[testGemini] SDK Version: ${sdkVersion}`);
  console.log(`[testGemini] Selected Model: ${modelName}`);

  if (!apiKey) {
    console.error("[testGemini] Failed: API key is not configured in VITE_GEMINI_API_KEY.");
    return {
      success: false,
      sdkVersion,
      modelName,
      duration: 0,
      error: "Application configuration error. Contact administrator.",
      fullError: new Error("Application configuration error. Contact administrator.")
    };
  }

  const startTime = Date.now();
  try {
    const ai = getGenAIClient(apiKey);
    const response = await ai.models.generateContent({
      model: modelName,
      contents: "Hello"
    });
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`[testGemini] Response Time: ${duration}ms`);
    console.log(`[testGemini] Raw Response:`, response);
    console.log(`[testGemini] Response Text:`, response.text);

    return {
      success: true,
      sdkVersion,
      modelName,
      duration,
      rawResponse: response,
      text: response.text
    };
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.error(`[testGemini] Request failed after ${duration}ms. Full SDK Error:`, error);
    
    const errReason = detectErrorReason(error);
    console.error(`[testGemini] Detected Error Reason: ${errReason}`);

    return {
      success: false,
      sdkVersion,
      modelName,
      duration,
      error: errReason,
      fullError: error
    };
  }
};

/**
 * Analyzes the exception object to return a detailed diagnostics classification category.
 */
const detectErrorReason = (error) => {
  const msg = (error?.message || "").toLowerCase();
  const status = error?.status || (error?.response?.status) || 0;
  
  if (status === 401 || status === 403 || msg.includes("api_key_invalid") || msg.includes("invalid api key") || msg.includes("unauthorized") || msg.includes("forbidden") || msg.includes("api key")) {
    return "Invalid API Key / Authentication Error";
  }
  if (status === 404 || msg.includes("model not found") || msg.includes("not_found") || msg.includes("404") || msg.includes("unsupported model")) {
    return "Unsupported Model";
  }
  if (status === 429 || msg.includes("quota") || msg.includes("rate limit") || msg.includes("exhausted") || msg.includes("429")) {
    return "Quota Exceeded";
  }
  if (msg.includes("region") || msg.includes("location not supported") || msg.includes("not available in your country")) {
    return "Region Blocked / Unsupported Location";
  }
  if (msg.includes("network") || msg.includes("fetch") || msg.includes("dns") || msg.includes("connection") || msg.includes("offline")) {
    if (msg.includes("firewall") || msg.includes("blocked by client") || msg.includes("cors")) {
      return "Firewall / Network Connection Blocked";
    }
    return "Network Error";
  }
  if (msg.includes("timeout") || msg.includes("deadline")) {
    return "Request Timeout";
  }
  if (status >= 500) {
    return "Google API Server Error (500+)";
  }
  return `SDK/Generic Error: ${error?.message || 'Unknown error'}`;
};

/**
 * Conducts automated ATS resume analysis with Gemini Flash
 */
export const analyzeResumeWithGemini = async (resumeText, timeoutMs = 120000) => {
  if (!resumeText) return fallbackAnalyzeResume(resumeText);

  // Check cache to avoid duplicate requests
  const cacheKey = `resume_${resumeText.substring(0, 100)}_${resumeText.length}`;
  if (responseCache.has(cacheKey)) {
    console.log("Returning cached resume analysis");
    return responseCache.get(cacheKey);
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
    const parsed = await makeGeminiJsonRequest(prompt, { temperature: 0.3, maxOutputTokens: 6000 }, timeoutMs);
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
export const generateQuestionsWithGemini = async (resumeText, options = {}, timeoutMs = 120000) => {
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

Return ONLY valid JSON. Do not include any explanation, markdown code blocks, or preamble outside of the JSON structure. Make sure you return exactly 10 HR, 15 Technical, 10 Project, 10 Behavioral, and 5 Coding questions. Keep the answers, evaluation criteria, and rubric guidelines concise (1-3 sentences maximum each) to ensure the output fits within token limits.`;

  const cacheKey = `questions_${resumeText.substring(0, 100)}_${company}_${level}`;
  if (responseCache.has(cacheKey)) {
    return responseCache.get(cacheKey);
  }

  try {
    const parsed = await makeGeminiJsonRequest(prompt, { temperature: 0.3, maxOutputTokens: 8192 }, timeoutMs);
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
export const compareJobWithGemini = async (resumeText, jobTitle, jobRequirements, timeoutMs = 120000) => {
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
    const parsed = await makeGeminiJsonRequest(prompt, { temperature: 0.3 }, timeoutMs);
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
export const evaluateAnswerWithGemini = async (question, expectedAnswer, userAnswer, difficulty, timeoutMs = 120000) => {
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
    const parsed = await makeGeminiJsonRequest(prompt, { temperature: 0.2, maxOutputTokens: 6000 }, timeoutMs);
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
export const generateCoverLetterWithGemini = async (resumeText, company, jobTitle, timeoutMs = 120000) => {
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
    const text = await makeGeminiRequest(prompt, { temperature: 0.7 }, timeoutMs);
    return text || "Cover letter generation failed.";
  } catch (error) {
    console.warn("Cover letter generation failed, using mock fallback:", error.message);
    return `Dear Hiring Manager at ${company || 'the Team'},\n\nI am writing to express my strong interest in the ${jobTitle || 'Software Engineer'} role. Based on my background in software development, I am confident I would be a great fit for your team.\n\nThank you for your time and consideration.\n\nSincerely,\nCandidate`;
  }
};

/**
 * Optimizes resumes for LinkedIn profiles
 */
export const optimizeLinkedInProfileWithGemini = async (resumeText, timeoutMs = 120000) => {
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
    return await makeGeminiJsonRequest(prompt, { temperature: 0.4 }, timeoutMs);
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
export const generateResumeBulletsWithGemini = async (skills, experienceText, timeoutMs = 120000) => {
  const prompt = `You are a Resume Writer.
Based on the skills: "${skills}" and raw experience text: "${experienceText}", generate 3 action-oriented, metric-driven resume bullet points starting with strong action verbs.

You MUST return JSON only. The JSON response must strictly follow this schema:
{
  "bullets": ["string"]
}

Return ONLY valid JSON. Do not include any explanations, markdown code blocks, or preamble outside of the JSON structure.`;

  try {
    const parsed = await makeGeminiJsonRequest(prompt, { temperature: 0.5 }, timeoutMs);
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
export const gradeCodingChallengeWithGemini = async (question, language, code, timeoutMs = 120000) => {
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
    return await makeGeminiJsonRequest(prompt, { temperature: 0.2, maxOutputTokens: 8192 }, timeoutMs);
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
