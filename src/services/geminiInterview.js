/**
 * geminiInterview.js
 * Production-ready service for Google Gemini API integration
 * Handles dynamic question generation and answer evaluation
 */

const getApiKey = () => {
  return import.meta.env.VITE_GEMINI_API_KEY || 
         localStorage.getItem('VITE_GEMINI_API_KEY') || 
         localStorage.getItem('gemini_api_key');
};

const cleanJsonString = (str) => {
  let cleaned = str.trim();
  // Strip markdown code block formatting if present
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
 * Generate interview questions based on resume text, company, and career level
 * @param {string} resumeText - The extracted text of the resume
 * @param {Object} options - Custom options: { company: string, level: string }
 * @returns {Promise<Object>} Object containing question lists grouped by category
 */
export const generateInterviewQuestions = async (resumeText, options = {}) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Gemini API Key is not configured. Please provide an API key to proceed.');
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

Generate exactly the following interview questions:
- 10 HR Interview Questions
- 15 Technical Questions
- 10 Project Based Questions
- 10 Behavioral Questions
- 5 Coding Round Questions

For every question, also generate:
- Expected Answer (detailed technical guidelines or expected bullet points)
- Difficulty (strictly one of: "Easy", "Medium", "Hard")
- Evaluation Criteria (what a good response must satisfy)

You MUST return JSON only. The JSON response must strictly follow this schema:
{
  "hr": [
    {
      "question": "string",
      "expectedAnswer": "string",
      "difficulty": "Easy" | "Medium" | "Hard",
      "evaluationCriteria": "string"
    }
  ],
  "technical": [ ... ],
  "project": [ ... ],
  "behavioral": [ ... ],
  "coding": [ ... ]
}

Return ONLY valid JSON. Do not include any explanation, markdown code blocks, or preamble outside of the JSON structure. Make sure you return exactly 10 HR, 15 Technical, 10 Project, 10 Behavioral, and 5 Coding questions.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Gemini API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textResponse) {
      throw new Error('Gemini API returned an empty or invalid content response.');
    }

    const cleanJson = cleanJsonString(textResponse);
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error('Error generating interview questions:', error);
    throw error;
  }
};

/**
 * Evaluate user-typed response for a specific question
 * @param {string} question - The question asked
 * @param {string} expectedAnswer - The expected target answer
 * @param {string} userAnswer - The user's typed response
 * @param {string} difficulty - The difficulty level of the question
 * @returns {Promise<Object>} Grade metrics and qualitative feedback
 */
export const evaluateInterviewAnswer = async (question, expectedAnswer, userAnswer, difficulty) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Gemini API Key is not configured. Please provide an API key to proceed.');
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

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Gemini API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textResponse) {
      throw new Error('Gemini API returned an empty or invalid content response.');
    }

    const cleanJson = cleanJsonString(textResponse);
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error('Error evaluating interview answer:', error);
    throw error;
  }
};
