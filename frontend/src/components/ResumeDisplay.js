import React from 'react';
import './ResumeDisplay.css';

function ResumeDisplay({ resume }) {
  if (!resume) {
    return null; 
  }

  const cleanContentForDisplay = (text) => {
    if (!text) return '';
    const textWithMarkersRemoved = text.replace(/\[.*?\]/g, '');
    const cleanLines = textWithMarkersRemoved
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    return cleanLines.join('\n');
  };

  // **ADAPTATION**: Handle both old ('content', 'skills') and new ('generated_resume_text', 'extracted_skills') formats
  const resumeContent = resume.generated_resume_text || resume.content;
  const skills = resume.extracted_skills || resume.skills;
  const atsScore = resume.ats_score;

  const cleanResumeContent = cleanContentForDisplay(resumeContent);

  return (
    <div className="resume-display">
      <h2>Generated Resume Report</h2>

      {atsScore !== undefined && (
        <div className="score-section">
          <div className="score-summary">
              <span className="score-label">ATS Score</span>
              <span className="score-number">{atsScore}%</span>
          </div>
        </div>
      )}

      {skills && skills.length > 0 && (
        <div className="resume-section">
          <h3>Extracted Skills</h3>
          <div className="skills-container">
            {skills.map((skill, index) => (
              <span key={index} className="skill-badge">{skill}</span>
            ))}
          </div>
        </div>
      )}

      <div className="resume-text-section">
        <h3>Generated Resume Draft</h3>
        {resume.download_path && (
            <a href={`http://localhost:5000${resume.download_path}`} download className="download-button">
                Download as DOCX
            </a>
        )}
        <pre className="resume-content-text">{cleanResumeContent}</pre>
      </div>

    </div>
  );
}

export default ResumeDisplay;