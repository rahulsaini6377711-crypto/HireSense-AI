import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

let pdfjsLib = null;

const loadPdfJs = async () => {
  if (pdfjsLib) return pdfjsLib;
  
  // Dynamically import pdfjs-dist to prevent it from bloat-loading the main bundle
  pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
  return pdfjsLib;
};

/**
 * Extract text from a PDF file with optional progress tracking
 * @param {File} file - The PDF file to extract text from
 * @param {Function} onProgress - Optional callback for page-by-page progress
 * @returns {Promise<Object>} The extracted text and page count
 */
export const extractTextFromPDF = async (file, onProgress = null) => {
  try {
    const pdfjs = await loadPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    
    let extractedText = '';
    let pageCount = pdf.numPages;

    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .map((item) => item.str)
        .join(' ');
      
      extractedText += pageText + '\n';
      
      if (onProgress) {
        onProgress((pageNum / pageCount) * 100);
      }
    }

    return {
      text: extractedText.trim(),
      pageCount,
      success: true
    };
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error(`Failed to parse PDF: ${error.message}`);
  }
};

/**
 * Helper function to extract a section based on headers/keywords
 */
const extractSection = (text, keywords) => {
  const lines = text.split('\n');
  let inSection = false;
  let sectionLines = [];
  
  const headerRegex = new RegExp(`^\\s*(${keywords.join('|')})\\s*$`, 'i');
  
  const allKnownHeaders = [
    'education', 'academic background', 'academic history', 'academics', 'degrees',
    'experience', 'work experience', 'professional experience', 'employment history', 'work history', 'employment',
    'projects', 'personal projects', 'academic projects', 'key projects', 'portfolio',
    'certifications', 'certifications & licenses', 'licenses & certifications', 'licenses', 'courses', 'credentials',
    'skills', 'technical skills', 'languages', 'summary', 'objective', 'contact', 'interests', 'achievements', 'awards'
  ];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Check if line matches the target section header
    if (headerRegex.test(line) || (keywords.some(kw => line.toLowerCase() === kw) && line.length < 30)) {
      inSection = true;
      continue;
    }
    
    // If we are in the section and hit another section header, we stop
    if (inSection) {
      const lowerLine = line.toLowerCase();
      const isAnotherHeader = allKnownHeaders.some(h => 
        (lowerLine === h || lowerLine.startsWith(h + ' ') || lowerLine.endsWith(' ' + h)) && 
        line.length < 30 &&
        !keywords.includes(h)
      );
      
      if (isAnotherHeader) {
        break;
      }
      
      sectionLines.push(line);
    }
  }
  
  return sectionLines.join('\n').trim() || null;
};

/**
 * Parse a PDF resume file
 * @param {File} file - The PDF file to parse
 * @param {Function} onProgress - Optional callback for page-by-page progress
 * @returns {Promise<Object>} Parsed resume data with text, pageCount, fileName, uploadedAt
 */
export const parseResumePDF = async (file, onProgress = null) => {
  try {
    // Validate file
    if (!file || file.type !== 'application/pdf') {
      throw new Error('Only PDF files are supported');
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File size exceeds 10 MB limit');
    }

    // Extract text from PDF
    const { text, pageCount } = await extractTextFromPDF(file, onProgress);

    // Return structured data
    return {
      text,
      pageCount,
      fileName: file.name,
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
      success: true
    };
  } catch (error) {
    console.error('Error parsing resume:', error);
    throw error;
  }
};

/**
 * Validate resume file
 * @param {File} file - The file to validate
 * @returns {Object} Validation result with isValid and error message
 */
export const validateResumeFile = (file) => {
  if (!file) {
    return {
      isValid: false,
      error: 'No file selected'
    };
  }

  if (file.type !== 'application/pdf') {
    return {
      isValid: false,
      error: 'Only PDF files are supported. Please upload a PDF resume.'
    };
  }

  const maxSize = 10 * 1024 * 1024; // 10 MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size exceeds 10 MB limit. Your file is ${(file.size / (1024 * 1024)).toFixed(2)} MB.`
    };
  }

  return {
    isValid: true,
    error: null
  };
};

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Extract key information from resume text
 * @param {string} text - The extracted resume text
 * @returns {Object} Key information like email, phone, skills
 */
export const extractResumeInfo = (text) => {
  const info = {
    name: null,
    email: null,
    phone: null,
    skills: [],
    experience: null,
    education: null,
    projects: null,
    certifications: null
  };

  if (!text) return info;

  const normalizedText = text.toLowerCase();

  // Extract email
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = text.match(emailRegex);
  if (emails) {
    info.email = emails[0];
  }

  // Extract phone
  const phoneRegex = /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const phones = text.match(phoneRegex);
  if (phones) {
    info.phone = phones[0];
  }

  // Extract Name (heuristics matching capitalized starting words at page start)
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  for (let i = 0; i < Math.min(6, lines.length); i++) {
    const line = lines[i];
    const words = line.split(/\s+/);
    if (
      words.length >= 2 &&
      words.length <= 4 &&
      /^[A-Z]/.test(line) &&
      !line.includes('@') &&
      !line.includes('http') &&
      !line.includes(':') &&
      !/\d/.test(line) &&
      !/resume|cv|curriculum|vitae|page|contact/i.test(line)
    ) {
      info.name = line;
      break;
    }
  }

  // Fallback name if regex heuristics did not match
  if (!info.name && lines.length > 0) {
    info.name = lines[0];
  }

  // Extract potential skills (common technical terms)
  const commonSkills = [
    'javascript', 'python', 'java', 'c++', 'react', 'node', 'sql', 'mongodb',
    'html', 'css', 'aws', 'docker', 'kubernetes', 'git', 'agile', 'scrum',
    'typescript', 'angular', 'vue', 'nodejs', 'express', 'firebase', 'rust',
    'go', 'c#', 'php', 'swift', 'kotlin', 'flutter', 'tailwind', 'sass', 'redux',
    'graphql', 'django', 'flask', 'spring boot', 'mysql', 'postgresql', 'redis'
  ];
  
  info.skills = commonSkills.filter(skill => normalizedText.includes(skill));

  // Extract major sections
  info.education = extractSection(text, ['education', 'academic background', 'academic history', 'academics', 'degrees', 'education details']);
  info.experience = extractSection(text, ['experience', 'work experience', 'professional experience', 'employment history', 'work history', 'employment', 'experience details']);
  info.projects = extractSection(text, ['projects', 'personal projects', 'academic projects', 'key projects', 'portfolio', 'project details']);
  info.certifications = extractSection(text, ['certifications', 'certifications & licenses', 'licenses & certifications', 'licenses', 'courses', 'credentials', 'certifications details']);

  return info;
};
