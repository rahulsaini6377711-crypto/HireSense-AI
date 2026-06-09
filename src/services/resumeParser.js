let pdfjsLib = null;

const loadPdfJs = async () => {
  if (pdfjsLib) return pdfjsLib;
  
  // Dynamically import pdfjs-dist to prevent it from bloat-loading the main bundle
  pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();
  return pdfjsLib;
};

/**
 * Extract text from a PDF file
 * @param {File} file - The PDF file to extract text from
 * @returns {Promise<string>} The extracted text
 */
export const extractTextFromPDF = async (file) => {
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
 * Parse a PDF resume file
 * @param {File} file - The PDF file to parse
 * @returns {Promise<Object>} Parsed resume data with text, pageCount, fileName, uploadedAt
 */
export const parseResumePDF = async (file) => {
  try {
    // Validate file
    if (!file || file.type !== 'application/pdf') {
      throw new Error('Only PDF files are supported');
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File size exceeds 10 MB limit');
    }

    // Extract text from PDF
    const { text, pageCount } = await extractTextFromPDF(file);

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
    email: null,
    phone: null,
    skills: [],
    experience: null,
    education: null
  };

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

  // Extract potential skills (common technical terms)
  const commonSkills = [
    'javascript', 'python', 'java', 'c++', 'react', 'node', 'sql', 'mongodb',
    'html', 'css', 'aws', 'docker', 'kubernetes', 'git', 'agile', 'scrum',
    'typescript', 'angular', 'vue', 'nodejs', 'express', 'firebase'
  ];
  
  const lowerText = text.toLowerCase();
  info.skills = commonSkills.filter(skill => lowerText.includes(skill));

  return info;
};
