import React, { useState } from 'react';
import { FiChevronDown, FiChevronUp, FiCopy, FiDownload } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { formatFileSize } from '../services/resumeParser';

const ResumePreview = ({ resumeData, fileName, fileSize, uploadedAt, extractedInfo }) => {
  const [expandedSection, setExpandedSection] = useState('info');
  const [copied, setCopied] = useState(false);

  if (!resumeData) {
    return null;
  }

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadAsText = () => {
    const element = document.createElement('a');
    const file = new Blob([resumeData.text], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${fileName.replace('.pdf', '')}_extracted.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Resume text downloaded!');
  };

  return (
    <div className="space-y-4">
      {/* Resume Information Card */}
      <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-3xl border border-white/30 dark:border-gray-700/30 overflow-hidden">
        <button
          onClick={() => toggleSection('info')}
          className="w-full p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <span className="text-lg">📄</span>
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 dark:text-white">Resume Information</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">File details and metadata</p>
            </div>
          </div>
          {expandedSection === 'info' ? (
            <FiChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          ) : (
            <FiChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          )}
        </button>

        {expandedSection === 'info' && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">File Name</p>
                <p className="font-semibold text-gray-900 dark:text-white break-words">
                  {fileName}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">File Size</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {formatFileSize(fileSize)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pages</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {resumeData.pageCount}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Uploaded At</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {new Date(uploadedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Extracted Information Card */}
      {extractedInfo && (
        <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-3xl border border-white/30 dark:border-gray-700/30 overflow-hidden">
          <button
            onClick={() => toggleSection('info_extracted')}
            className="w-full p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <span className="text-lg">✨</span>
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900 dark:text-white">Extracted Information</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Contact and skill details
                </p>
              </div>
            </div>
            {expandedSection === 'info_extracted' ? (
              <FiChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <FiChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            )}
          </button>

          {expandedSection === 'info_extracted' && (
            <div className="border-t border-gray-200 dark:border-gray-700 p-6 space-y-4">
              {extractedInfo.email && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Email</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{extractedInfo.email}</p>
                </div>
              )}

              {extractedInfo.phone && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Phone</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{extractedInfo.phone}</p>
                </div>
              )}

              {extractedInfo.skills && extractedInfo.skills.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Skills Detected</p>
                  <div className="flex flex-wrap gap-2">
                    {extractedInfo.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Extracted Text Preview Card */}
      <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-3xl border border-white/30 dark:border-gray-700/30 overflow-hidden">
        <button
          onClick={() => toggleSection('text')}
          className="w-full p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <span className="text-lg">📝</span>
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 dark:text-white">Extracted Text</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Full resume content</p>
            </div>
          </div>
          {expandedSection === 'text' ? (
            <FiChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          ) : (
            <FiChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          )}
        </button>

        {expandedSection === 'text' && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => copyToClipboard(resumeData.text)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors"
              >
                <FiCopy className="w-4 h-4" />
                Copy Text
              </button>
              <button
                onClick={downloadAsText}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white text-sm font-medium transition-colors"
              >
                <FiDownload className="w-4 h-4" />
                Download
              </button>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 max-h-96 overflow-y-auto">
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap line-clamp-[20]">
                {resumeData.text}
              </p>
            </div>

            {resumeData.text.length > 1000 && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Showing first 1000 characters... Download to see full content
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumePreview;
