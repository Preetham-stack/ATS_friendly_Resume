import React from 'react';
import './ResumeDisplay.css';

function ResumeDisplay({ resume }) {
  if (!resume) {
    return null; // Or some placeholder
  }

  // This function cleans the raw text from the AI to make it readable in the web preview.
  // It removes formatting markers like [H1], [H2], [BULLET], etc.
  const cleanContentForDisplay = (text) => {
    if (!text) return '';

    // This regular expression finds and removes any text inside square brackets [].
    const textWithMarkersRemoved = text.replace(/\[.*?\]/g, '');

    // Clean up the lines by trimming whitespace and removing any empty lines that result.
    const cleanLines = textWithMarkersRemoved
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    return cleanLines.join('\n');
  };

  const cleanResumeContent = cleanContentForDisplay(resume.content);

  return (
    <div className="resume-display">
      <h2>Generated Resume Draft</h2>

      <div className="resume-content">
        {/* Display the CLEANED text, not the raw text with markers */}
        <pre>{cleanResumeContent}</pre>
      </div>

      {resume.skills && resume.skills.length > 0 && (
        <div className="resume-section">
          <h3>Skills</h3>
          <div className="skills-container">
            {resume.skills.map((skill, index) => (
              <span key={index} className="skill-badge">{skill}</span>
            ))}
          </div>
        </div>
      )}

      {resume.download_path && (
        <a href={`http://localhost:5000/${resume.download_path}`} download className="download-button">
          Download Resume
        </a>
      )}
    </div>
  );
}

export default ResumeDisplay;
