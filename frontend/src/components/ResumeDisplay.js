// In C:/Users/MCPL-L166/PycharmProjects/ATSFriendly_Resume/frontend/src/components/ResumeDisplay.js

import React from 'react';
import './ResumeDisplay.css';

function ResumeDisplay({ resume }) {
  if (!resume) {
    return null;
  }

  // Check if we have the detailed update response object
  const isDetailedResponse = resume && typeof resume === 'object' && resume.optimized_resume_text;

  if (isDetailedResponse) {
    return (
      <div className="resume-display-container detailed-report">
        <div className="report-header">
          <h2>Optimized Resume Report</h2>
          <div className="score-summary">
            <span className="score-label">New ATS Score</span>
            <span className="score-number">{resume.ats_score || 0}%</span>
          </div>
        </div>

        <div className="modifications-section">
          <h3>Modifications Made</h3>
          <ul className="modifications-list">
            {resume.modifications_made?.map((mod, index) => (
              <li key={index}>{mod}</li>
            ))}
          </ul>
        </div>

        <div className="resume-text-section">
          <h3>Optimized Resume Text</h3>
          <a href={`http://localhost:5000${resume.download_path}`} download className="download-button">
            Download as DOCX
          </a>
          <pre className="resume-content">{resume.optimized_resume_text}</pre>
        </div>
      </div>
    );
  }

  // Fallback for simple text responses
  return (
    <div className="resume-display-container">
      <pre className="resume-content">{typeof resume === 'string' ? resume : ''}</pre>
    </div>
  );
}

export default ResumeDisplay;