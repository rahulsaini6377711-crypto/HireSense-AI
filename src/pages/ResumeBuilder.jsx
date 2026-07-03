import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiSave, FiDownload, FiCpu, FiPlus, FiTrash2, FiClock, FiFileText, FiAward, FiBook } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import { db } from '../services/firebase';
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { generateResumeBulletsWithGemini } from '../services/geminiService';
import { useSEO } from '../hooks/useSEO';
import jsPDF from 'jspdf';

const ResumeBuilder = () => {
  useSEO('AI Resume Builder', 'Build and optimize your professional resume with AI bullet enhancers and templates.');
  const { user } = useAuth();

  // Resume form state
  const [resumeData, setResumeData] = useState({
    name: '',
    email: '',
    phone: '',
    summary: '',
    skills: '',
    experience: [{ id: 1, role: '', company: '', duration: '', bullets: '' }],
    projects: [{ id: 1, title: '', tech: '', description: '' }],
    education: [{ id: 1, degree: '', school: '', year: '' }]
  });

  // UI state
  const [selectedTemplate, setSelectedTemplate] = useState('modern'); // 'modern', 'professional', 'creative'
  const [savedVersions, setSavedVersions] = useState([]);
  const [enhancingIndex, setEnhancingIndex] = useState(null); // tracking AI action loading index
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [savingVersion, setSavingVersion] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      loadVersions();
    }
  }, [user]);

  const loadVersions = async () => {
    try {
      setLoadingVersions(true);
      const q = query(
        collection(db, 'resumes_history'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const versions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSavedVersions(versions);
    } catch (e) {
      console.error('Failed to load resume versions:', e);
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleSaveVersion = async () => {
    if (!resumeData.name.trim()) {
      toast.error('Please enter at least your name to save.');
      return;
    }

    try {
      setSavingVersion(true);
      const versionTitle = `Resume_${new Date().toLocaleDateString()}_${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      await addDoc(collection(db, 'resumes_history'), {
        userId: user.uid,
        title: versionTitle,
        data: resumeData,
        createdAt: serverTimestamp()
      });
      toast.success('Resume version saved successfully!');
      loadVersions();
    } catch (e) {
      console.error(e);
      toast.error('Failed to save version.');
    } finally {
      setSavingVersion(false);
    }
  };

  const handleRestoreVersion = (version) => {
    setResumeData(version.data);
    toast.success(`Restored to: ${version.title}`);
  };

  const handleInputChange = (field, val) => {
    setResumeData(prev => ({
      ...prev,
      [field]: val
    }));
  };

  const handleArrayChange = (section, id, field, val) => {
    setResumeData(prev => ({
      ...prev,
      [section]: prev[section].map(item => item.id === id ? { ...item, [field]: val } : item)
    }));
  };

  const addArrayItem = (section) => {
    const newItem = section === 'experience'
      ? { id: Date.now(), role: '', company: '', duration: '', bullets: '' }
      : section === 'projects'
      ? { id: Date.now(), title: '', tech: '', description: '' }
      : { id: Date.now(), degree: '', school: '', year: '' };

    setResumeData(prev => ({
      ...prev,
      [section]: [...prev[section], newItem]
    }));
  };

  const deleteArrayItem = (section, id) => {
    setResumeData(prev => ({
      ...prev,
      [section]: prev[section].filter(item => item.id !== id)
    }));
  };

  // AI Bullet Points Enhancer
  const handleEnhanceBullets = async (index, expItem) => {
    if (!expItem.role.trim() || !expItem.bullets.trim()) {
      toast.error('Please fill in Role and current Bullet description to enhance.');
      return;
    }

    try {
      setEnhancingIndex(index);
      toast.loading('Gemini is writing professional metrics-driven bullets...', { id: 'ai-bullets' });
      const optimizedBullets = await generateResumeBulletsWithGemini(resumeData.skills, expItem.bullets);
      
      const bulletText = Array.isArray(optimizedBullets) ? optimizedBullets.join('\n') : optimizedBullets;
      
      handleArrayChange('experience', expItem.id, 'bullets', bulletText);
      toast.success('Bullets optimized successfully!', { id: 'ai-bullets' });
    } catch (e) {
      console.error(e);
      toast.error('AI bullet enhancement failed.', { id: 'ai-bullets' });
    } finally {
      setEnhancingIndex(null);
    }
  };

  // Generate jsPDF Download
  const handleDownloadPDF = () => {
    const doc = new jsPDF('p', 'pt', 'a4');
    
    // Margins and positioning
    const leftMargin = 40;
    let yPos = 50;
    
    // Header Name
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(22);
    doc.text(resumeData.name || 'Your Name', leftMargin, yPos);
    
    // Contact Info
    yPos += 20;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const contactText = `${resumeData.email || 'email@example.com'} | ${resumeData.phone || 'Phone'}`;
    doc.text(contactText, leftMargin, yPos);
    
    // Divider
    yPos += 15;
    doc.setDrawColor(200, 200, 200);
    doc.line(leftMargin, yPos, 550, yPos);
    
    // Summary Section
    if (resumeData.summary) {
      yPos += 25;
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('SUMMARY', leftMargin, yPos);
      
      yPos += 15;
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);
      const splitSummary = doc.splitTextToSize(resumeData.summary, 510);
      doc.text(splitSummary, leftMargin, yPos);
      yPos += (splitSummary.length * 12) + 10;
    }
    
    // Skills Section
    if (resumeData.skills) {
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('SKILLS', leftMargin, yPos);
      
      yPos += 15;
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);
      const splitSkills = doc.splitTextToSize(resumeData.skills, 510);
      doc.text(splitSkills, leftMargin, yPos);
      yPos += (splitSkills.length * 12) + 15;
    }
    
    // Experience Section
    if (resumeData.experience.length > 0 && resumeData.experience[0].role) {
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('EXPERIENCE', leftMargin, yPos);
      
      resumeData.experience.forEach(exp => {
        if (!exp.role) return;
        yPos += 20;
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(`${exp.role} - ${exp.company}`, leftMargin, yPos);
        
        doc.setFont('Helvetica', 'italic');
        doc.text(exp.duration, 550 - doc.getTextWidth(exp.duration), yPos);
        
        yPos += 15;
        doc.setFont('Helvetica', 'normal');
        const splitBullets = doc.splitTextToSize(exp.bullets, 490);
        splitBullets.forEach(line => {
          doc.text(`• ${line}`, leftMargin + 10, yPos);
          yPos += 12;
        });
      });
      yPos += 15;
    }
    
    // Projects Section
    if (resumeData.projects.length > 0 && resumeData.projects[0].title) {
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('PROJECTS', leftMargin, yPos);
      
      resumeData.projects.forEach(proj => {
        if (!proj.title) return;
        yPos += 20;
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(`${proj.title} [Tech: ${proj.tech}]`, leftMargin, yPos);
        
        yPos += 15;
        doc.setFont('Helvetica', 'normal');
        const splitDesc = doc.splitTextToSize(proj.description, 510);
        doc.text(splitDesc, leftMargin, yPos);
        yPos += (splitDesc.length * 12);
      });
      yPos += 15;
    }
    
    // Save Document
    doc.save(`${resumeData.name.replace(/\s+/g, '_')}_resume.pdf`);
    toast.success('Resume downloaded successfully!');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">AI Resume Builder</h1>
          <p className="text-gray-600 dark:text-gray-400">Craft and optimize your CV live alongside dynamic templates.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSaveVersion}
            disabled={savingVersion}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow transition text-xs"
          >
            <FiSave /> Save Version
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow transition text-xs"
          >
            <FiDownload /> Export PDF
          </button>
        </div>
      </div>

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form Panel */}
        <div className="lg:col-span-6 space-y-6">
          {/* Version Selector */}
          {savedVersions.length > 0 && (
            <div className="bg-white dark:bg-gray-800/60 p-4 border border-gray-200 dark:border-gray-700 rounded-2xl flex items-center gap-3">
              <FiClock className="text-blue-500 shrink-0" />
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 shrink-0">History</label>
              <select
                onChange={(e) => {
                  const selected = savedVersions.find(v => v.id === e.target.value);
                  if (selected) handleRestoreVersion(selected);
                }}
                className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-xl outline-none text-xs"
              >
                <option value="">Restore a previously saved version...</option>
                {savedVersions.map(v => (
                  <option key={v.id} value={v.id}>{v.title}</option>
                ))}
              </select>
            </div>
          )}

          {/* Core Info Details */}
          <div className="bg-white/80 dark:bg-gray-800/60 border border-gray-250 dark:border-gray-700/50 rounded-3xl p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
              <FiFileText className="text-blue-500" /> Personal & Contact Info
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1.5">Full Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={resumeData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900/60 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1.5">Email Address</label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={resumeData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900/60 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-xs font-semibold"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1.5">Phone Number</label>
                <input
                  type="text"
                  placeholder="+1 (555) 019-2834"
                  value={resumeData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900/60 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-xs font-semibold"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1.5">Executive Summary</label>
              <textarea
                rows={3}
                placeholder="Passionate engineer with expertise in React..."
                value={resumeData.summary}
                onChange={(e) => handleInputChange('summary', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900/60 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-xs leading-relaxed"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1.5">Skills (comma separated)</label>
              <input
                type="text"
                placeholder="React, Javascript, Node.js, HTML, CSS"
                value={resumeData.skills}
                onChange={(e) => handleInputChange('skills', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900/60 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-xs font-semibold"
              />
            </div>
          </div>

          {/* Work History Form List */}
          <div className="bg-white/80 dark:bg-gray-800/60 border border-gray-250 dark:border-gray-700/50 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <FiAward className="text-blue-500" /> Work Experience
              </h3>
              <button
                onClick={() => addArrayItem('experience')}
                className="flex items-center gap-1 px-3 py-1 bg-blue-50 dark:bg-blue-950/20 text-blue-600 border border-blue-100 dark:border-blue-900/40 rounded-lg text-[10px] font-bold uppercase transition"
              >
                <FiPlus /> Add
              </button>
            </div>

            {resumeData.experience.map((exp, idx) => (
              <div key={exp.id} className="border-t border-gray-150 dark:border-gray-700/60 pt-4 first:border-none first:pt-0 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 px-2 py-0.5 rounded uppercase">Role #{idx + 1}</span>
                  {resumeData.experience.length > 1 && (
                    <button
                      onClick={() => deleteArrayItem('experience', exp.id)}
                      className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/25 rounded"
                    >
                      <FiTrash2 size={13} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Role Title"
                    value={exp.role}
                    onChange={(e) => handleArrayChange('experience', exp.id, 'role', e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-700 dark:bg-gray-900/60 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Company Name"
                    value={exp.company}
                    onChange={(e) => handleArrayChange('experience', exp.id, 'company', e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-700 dark:bg-gray-900/60 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Duration (e.g. 2022 - Present)"
                    value={exp.duration}
                    onChange={(e) => handleArrayChange('experience', exp.id, 'duration', e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-700 dark:bg-gray-900/60 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                  />
                </div>

                <div className="relative">
                  <label className="block text-[9px] uppercase font-bold text-gray-500 mb-1">Bullets Description</label>
                  <textarea
                    rows={3}
                    placeholder="Describe roles. Separate points by lines."
                    value={exp.bullets}
                    onChange={(e) => handleArrayChange('experience', exp.id, 'bullets', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900/60 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-xs leading-normal"
                  />
                  <button
                    onClick={() => handleEnhanceBullets(idx, exp)}
                    disabled={enhancingIndex === idx}
                    className="absolute right-3 bottom-3 flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-[9px] font-bold uppercase tracking-wider transition shadow-md disabled:opacity-50"
                  >
                    <FiCpu /> Enhance Bullet
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Education Form List */}
          <div className="bg-white/80 dark:bg-gray-800/60 border border-gray-250 dark:border-gray-700/50 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <FiBook className="text-blue-500" /> Education
              </h3>
              <button
                onClick={() => addArrayItem('education')}
                className="flex items-center gap-1 px-3 py-1 bg-blue-50 dark:bg-blue-950/20 text-blue-600 border border-blue-100 dark:border-blue-900/40 rounded-lg text-[10px] font-bold uppercase transition"
              >
                <FiPlus /> Add
              </button>
            </div>

            {resumeData.education.map((edu, idx) => (
              <div key={edu.id} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
                <input
                  type="text"
                  placeholder="Degree Title"
                  value={edu.degree}
                  onChange={(e) => handleArrayChange('education', edu.id, 'degree', e.target.value)}
                  className="sm:col-span-2 px-3 py-1.5 border border-gray-300 dark:border-gray-700 dark:bg-gray-900/60 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                />
                <input
                  type="text"
                  placeholder="School"
                  value={edu.school}
                  onChange={(e) => handleArrayChange('education', edu.id, 'school', e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 dark:border-gray-700 dark:bg-gray-900/60 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Year"
                    value={edu.year}
                    onChange={(e) => handleArrayChange('education', edu.id, 'year', e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-700 dark:bg-gray-900/60 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                  />
                  {resumeData.education.length > 1 && (
                    <button
                      onClick={() => deleteArrayItem('education', edu.id)}
                      className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/25 rounded"
                    >
                      <FiTrash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Live Preview Panel */}
        <div className="lg:col-span-6 space-y-6">
          {/* Template Selector */}
          <div className="bg-white/80 dark:bg-gray-800/60 border border-gray-250 dark:border-gray-700/50 rounded-2xl p-4 flex gap-2 justify-around shadow backdrop-blur-xl">
            {['modern', 'professional', 'creative'].map(t => (
              <button
                key={t}
                onClick={() => setSelectedTemplate(t)}
                className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition ${
                  selectedTemplate === t
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {t} Layout
              </button>
            ))}
          </div>

          {/* Styled Page Content Area */}
          <div className="bg-white border border-gray-200 shadow-2xl p-8 rounded-3xl min-h-[700px] text-gray-800 flex flex-col justify-between">
            {/* Header info */}
            <div>
              <div className="text-center space-y-2 border-b border-gray-100 pb-6">
                <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase">
                  {resumeData.name || 'Your Name'}
                </h2>
                <div className="text-xs text-gray-500 font-semibold flex justify-center gap-4 flex-wrap">
                  {resumeData.email && <span>{resumeData.email}</span>}
                  {resumeData.phone && <span>{resumeData.phone}</span>}
                </div>
              </div>

              {/* Summary */}
              {resumeData.summary && (
                <div className="my-6 space-y-2">
                  <h4 className={`text-xs font-bold uppercase tracking-wider ${selectedTemplate === 'creative' ? 'text-purple-600' : 'text-blue-600'}`}>Professional Summary</h4>
                  <p className="text-xs leading-relaxed text-gray-700">{resumeData.summary}</p>
                </div>
              )}

              {/* Skills */}
              {resumeData.skills && (
                <div className="my-6 space-y-2">
                  <h4 className={`text-xs font-bold uppercase tracking-wider ${selectedTemplate === 'creative' ? 'text-purple-600' : 'text-blue-600'}`}>Technical Skill Set</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {resumeData.skills.split(',').map(s => s.trim()).filter(Boolean).map(s => (
                      <span key={s} className="px-2.5 py-1 bg-gray-100 text-gray-800 text-[10px] font-bold rounded-md">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience */}
              {resumeData.experience.length > 0 && resumeData.experience[0].role && (
                <div className="my-6 space-y-3">
                  <h4 className={`text-xs font-bold uppercase tracking-wider ${selectedTemplate === 'creative' ? 'text-purple-600' : 'text-blue-600'}`}>Professional Experience</h4>
                  <div className="space-y-4">
                    {resumeData.experience.map(exp => (
                      <div key={exp.id}>
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-gray-950">{exp.role}</span>
                          <span className="text-[10px] font-semibold text-gray-500">{exp.duration}</span>
                        </div>
                        <p className="text-[11px] font-bold text-blue-600 mt-0.5">{exp.company}</p>
                        <ul className="list-disc pl-4 mt-2 text-[11px] text-gray-700 space-y-1">
                          {exp.bullets.split('\n').filter(Boolean).map((bullet, i) => (
                            <li key={i}>{bullet}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {resumeData.education.length > 0 && resumeData.education[0].degree && (
                <div className="my-6 space-y-3 border-t border-gray-100 pt-4">
                  <h4 className={`text-xs font-bold uppercase tracking-wider ${selectedTemplate === 'creative' ? 'text-purple-600' : 'text-blue-600'}`}>Education</h4>
                  <div className="space-y-3">
                    {resumeData.education.map(edu => (
                      <div key={edu.id} className="flex justify-between items-start text-xs">
                        <div>
                          <p className="font-bold text-gray-950">{edu.degree}</p>
                          <p className="text-[10px] text-gray-500 font-semibold">{edu.school}</p>
                        </div>
                        <span className="text-[10px] font-semibold text-gray-500">{edu.year}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="text-[9px] text-gray-400 text-center border-t border-gray-100 pt-4">
              Generated by HireSense AI Builder
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilder;
