import { jsPDF } from 'jspdf';

/**
 * Generate PDF report for Resume Analysis
 * @param {Object} analysis 
 * @param {string} fileName 
 */
export const generateResumeAnalysisPDF = (analysis, fileName = 'resume_report.pdf') => {
  try {
    const doc = new jsPDF();
    let y = 20;
    const margin = 20;
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    const checkPageBreak = (neededHeight) => {
      if (y + neededHeight >= pageHeight - margin) {
        doc.addPage();
        y = 20;
      }
    };

    // Brand Header
    doc.setFillColor(59, 130, 246); // Blue banner
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('HIRESENSE AI - RESUME ANALYSIS', margin, 26);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - margin - 50, 26);
    
    y = 55;
    
    // Resume File details
    doc.setTextColor(55, 65, 81);
    doc.setFontSize(11);
    doc.text(`Document Name: ${analysis.fileName || 'Uploaded Resume'}`, margin, y);
    y += 10;
    
    // Overall Stats Box
    doc.setFillColor(243, 244, 246);
    doc.rect(margin, y, pageWidth - (margin * 2), 25, 'F');
    
    doc.setTextColor(17, 24, 39);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`ATS Score: ${analysis.atsScore || 0}/100`, margin + 10, y + 10);
    doc.text(`Strength Rating: ${analysis.overallRating || 'N/A'}`, margin + 10, y + 18);
    y += 35;
    
    // Key Strengths
    doc.setFontSize(13);
    doc.setTextColor(16, 185, 129); // Green text
    doc.text('Key Strengths', margin, y);
    y += 8;
    
    doc.setTextColor(75, 85, 99);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    const strengths = analysis.strengths || [];
    strengths.forEach(str => {
      checkPageBreak(8);
      const splitText = doc.splitTextToSize(`* ${str}`, pageWidth - (margin * 2));
      doc.text(splitText, margin, y);
      y += (splitText.length * 6);
    });
    y += 10;

    // Areas to Improve
    checkPageBreak(15);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(239, 68, 68); // Red text
    doc.text('Areas to Address', margin, y);
    y += 8;
    
    doc.setTextColor(75, 85, 99);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    const weaknesses = analysis.weaknesses || [];
    weaknesses.forEach(weak => {
      checkPageBreak(8);
      const splitText = doc.splitTextToSize(`* ${weak}`, pageWidth - (margin * 2));
      doc.text(splitText, margin, y);
      y += (splitText.length * 6);
    });
    y += 10;

    // Detected & Missing Skills
    checkPageBreak(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(59, 130, 246); // Blue text
    doc.text('Skills Analysis', margin, y);
    y += 8;
    
    doc.setFontSize(10);
    doc.setTextColor(55, 65, 81);
    doc.setFont('helvetica', 'bold');
    doc.text('Detected Technical Skills:', margin, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(75, 85, 99);
    const skillsText = (analysis.skills || analysis.detectedSkills || []).join(', ');
    const splitSkills = doc.splitTextToSize(skillsText || 'None detected', pageWidth - (margin * 2));
    doc.text(splitSkills, margin, y);
    y += (splitSkills.length * 6) + 4;
    
    checkPageBreak(15);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(55, 65, 81);
    doc.text('Recommended Missing Skills to Target:', margin, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(75, 85, 99);
    const missingText = (analysis.missingSkills || []).slice(0, 10).join(', ');
    const splitMissing = doc.splitTextToSize(missingText || 'None', pageWidth - (margin * 2));
    doc.text(splitMissing, margin, y);
    y += (splitMissing.length * 6) + 12;

    // Actionable Suggestions
    checkPageBreak(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(107, 114, 128); // Grey
    doc.text('Actionable Improvement Suggestions', margin, y);
    y += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99);
    
    const suggestions = analysis.suggestions || analysis.improvementSuggestions || [];
    suggestions.forEach((sug, idx) => {
      checkPageBreak(12);
      const splitText = doc.splitTextToSize(`${idx + 1}. ${sug}`, pageWidth - (margin * 2));
      doc.text(splitText, margin, y);
      y += (splitText.length * 6);
    });

    doc.save(fileName);
  } catch (error) {
    console.error('Error generating Resume PDF:', error);
  }
};

/**
 * Generate PDF report for Interview Session feedback
 * @param {Object} session 
 * @param {string} fileName 
 */
export const generateInterviewSessionPDF = (session, fileName = 'interview_report.pdf') => {
  try {
    const doc = new jsPDF();
    let y = 20;
    const margin = 20;
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    const checkPageBreak = (neededHeight) => {
      if (y + neededHeight >= pageHeight - margin) {
        doc.addPage();
        y = 20;
      }
    };

    // Brand Header
    doc.setFillColor(139, 92, 246); // Purple banner
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('HIRESENSE AI - INTERVIEW ASSESSMENT', margin, 26);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Completed: ${new Date().toLocaleDateString()}`, pageWidth - margin - 50, 26);
    
    y = 55;
    
    // Session Info
    doc.setTextColor(55, 65, 81);
    doc.setFontSize(11);
    doc.text(`Role Assessed: ${(session.role || 'general').toUpperCase()}`, margin, y);
    y += 10;
    
    // Performance Box
    doc.setFillColor(243, 244, 246);
    doc.rect(margin, y, pageWidth - (margin * 2), 25, 'F');
    
    doc.setTextColor(17, 24, 39);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`Average Score: ${session.avgScore || 0}%`, margin + 10, y + 10);
    doc.text(`Grade/Rating: ${session.grade || 'N/A'} - ${session.performance || ''}`, margin + 10, y + 18);
    y += 35;
    
    // Question Log Header
    doc.setFontSize(13);
    doc.setTextColor(139, 92, 246);
    doc.text('Question Log & Answers', margin, y);
    y += 8;
    
    const answers = session.answers || [];
    answers.forEach((log) => {
      checkPageBreak(40);
      
      // Question block
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(17, 24, 39);
      const splitQ = doc.splitTextToSize(`Q${log.questionNum}: ${log.question}`, pageWidth - (margin * 2));
      doc.text(splitQ, margin, y);
      y += (splitQ.length * 5) + 2;

      // Score
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(59, 130, 246);
      doc.text(`Score: ${log.score || 0}/100`, margin + 5, y);
      y += 5;

      // User Answer
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(75, 85, 99);
      const splitAnswer = doc.splitTextToSize(`Your Response: ${log.userAnswer}`, pageWidth - (margin * 2) - 10);
      doc.text(splitAnswer, margin + 5, y);
      y += (splitAnswer.length * 5) + 2;

      // AI Tip
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(16, 185, 129);
      const splitTip = doc.splitTextToSize(`AI Assessment: ${log.feedback}`, pageWidth - (margin * 2) - 10);
      doc.text(splitTip, margin + 5, y);
      y += (splitTip.length * 5) + 6;
      
      // Divider
      doc.setDrawColor(229, 231, 235);
      doc.line(margin, y, pageWidth - margin, y);
      y += 8;
    });

    doc.save(fileName);
  } catch (error) {
    console.error('Error generating Interview PDF:', error);
  }
};
