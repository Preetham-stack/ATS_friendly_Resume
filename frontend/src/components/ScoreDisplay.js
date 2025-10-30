import React from 'react';
import './ScoreDisplay.css';

function ScoreDisplay({ result, resume, onUpdateResume, isUpdating }) {
  // Helper function to remove formatting markers for UI display
  const cleanTextForPreview = (text) => {
    return text.replace(/\[H1\]|\[H2\]|\[H3\]|\[BULLET\]/g, '').trim();
  };

  // Check if we have the detailed update response object (optimized resume)
  const isDetailedResumeResponse = resume && typeof resume === 'object' && resume.optimized_resume_text;

  if (isDetailedResumeResponse) {
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
          <pre className="resume-content">{cleanTextForPreview(resume.optimized_resume_text)}</pre>
        </div>
      </div>
    );
  }

  // Fallback for simple text responses (if resume is just a string, though not expected with current logic)
  if (resume && typeof resume === 'string') {
    return (
      <div className="resume-display-container">
        <pre className="resume-content">{resume}</pre>
      </div>
    );
  }

  // Display initial analysis report if 'result' is available
  if (result) {
    return (
      <div className="score-display">
        <h2>Analysis Report</h2>
        <div className="scores-container">
          <div className="score-summary">
            <span className="score-label">ATS Score</span>
            <span className="score-number">{result.ats_score_estimation || 0}%</span>
          </div>
          <div className="score-summary">
            <span className="score-label">Skills Match</span>
            <span className="score-number">{result.skills_matching_score || 0}%</span>
          </div>
        </div>
        <p className="feedback">{result.feedback}</p>

        {result.missing_keywords && result.missing_keywords.length > 0 && (
          <div className="keywords-section">
            <h3>Missing Keywords</h3>
            <div className="keywords-container">
              {result.missing_keywords.map((keyword, i) => (
                <span key={i} className="keyword-pill">{keyword}</span>
              ))}
            </div>
          </div>
        )}

        <div className="skills-comparison-container">
          <div className="skills-column">
            <h3>Skills in Job Description</h3>
            <ul className="skills-list">
              {result.jd_skills?.map((skill, i) => <li key={i}>{skill}</li>)}
            </ul>
          </div>
          <div className="skills-column">
            <h3>Skills in Your Resume</h3>
            <ul className="skills-list">
              {result.resume_skills?.map((skill, i) => <li key={i}>{skill}</li>)}
            </ul>
          </div>
        </div>

        <div className="recommendations-section">
          <h3>Recommendations for Improvement</h3>
          <ul className="recommendations-list">
            {result.recommendations_for_improvement?.map((rec, i) => <li key={i}>{rec}</li>)}
          </ul>
        </div>

        <button onClick={onUpdateResume} className="update-resume-button" disabled={isUpdating}>
          {isUpdating ? <div className="loader small"></div> : 'Update Resume'}
        </button>
      </div>
    );
  }

  // Default placeholder if neither result nor resume is available
  return <div className="score-display placeholder">Your analysis results will appear here.</div>;
}

export default ScoreDisplay;