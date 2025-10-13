import React from 'react';
import './ResumeDisplay.css';

function ResumeDisplay({ resume }) {
  if (!resume) {
    return null; // Or some placeholder
  }

  // The resume content is expected to be a string.
  // We can wrap it in a <pre> tag to preserve formatting.
  return (
    <div className="resume-display">
      <h2>Generated Resume Draft</h2>
      <div className="resume-content">
        <pre>{resume.content}</pre>
      </div>
      <a href={`http://localhost:5000/${resume.download_path}`} download className="download-button">
        Download Resume
      </a>
    </div>
  );
}

export default ResumeDisplay;
