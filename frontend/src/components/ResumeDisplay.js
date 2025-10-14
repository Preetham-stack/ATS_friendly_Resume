import React from 'react';
import './ResumeDisplay.css';

function ResumeDisplay({ resume }) {
  if (!resume) {
    return null; // Or some placeholder
  }

  return (
    <div className="resume-display">
      <div className="resume-header">
        <h2>Generated Resume Draft</h2>
        {resume.skills && resume.skills.length > 0 && (
          <div className="skills-top-right">
            {resume.skills.map((skill, index) => (
              <span key={index} className="skill-badge">{skill}</span>
            ))}
          </div>
        )}
      </div>

      <div className="resume-content">
        <pre>{resume.content}</pre>
      </div>

      {resume.download_path && (
        <a href={`http://localhost:5000/${resume.download_path}`} download className="download-button">
          Download Resume
        </a>
      )}
    </div>
  );
}

export default ResumeDisplay;
