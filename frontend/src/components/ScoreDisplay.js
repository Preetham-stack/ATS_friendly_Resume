import React, { useState } from 'react';
import './ScoreDisplay.css';

function ScoreDisplay({ result, resume, onUpdateResume, isUpdating, setAnalysisResult }) {
  const [newRecommendation, setNewRecommendation] = useState('');

  const cleanTextForPreview = (text) => {
    return text.replace(/\[H1\]|\[H2\]|\[H3\]|\[BULLET\]/g, '').trim();
  };

  const handleRemoveRecommendation = (indexToRemove) => {
    const updatedRecommendations = result.recommendations_for_improvement.filter(
      (_, index) => index !== indexToRemove
    );
    setAnalysisResult({
      ...result,
      recommendations_for_improvement: updatedRecommendations,
    });
  };

  const handleAddRecommendation = () => {
    if (newRecommendation.trim() === '') return;
    const updatedRecommendations = [
      ...(result.recommendations_for_improvement || []),
      newRecommendation.trim(),
    ];
    setAnalysisResult({
      ...result,
      recommendations_for_improvement: updatedRecommendations,
    });
    setNewRecommendation('');
  };

  const isDetailedResumeResponse = resume && typeof resume === 'object' && resume.optimized_resume_text;

  if (isDetailedResumeResponse) {
    return (
      <div className="resume-display-container detailed-report">
        <div className="report-header">
          <h2>Optimized Resume Report</h2>
          <div className="score-comparison-container">
            {result && result.ats_score_estimation !== undefined && (
              <div className="score-summary old-score">
                <span className="score-label">Old ATS Score</span>
                <span className="score-number">{result.ats_score_estimation || 0}%</span>
              </div>
            )}
            <div className="score-summary new-score">
              <span className="score-label">New ATS Score</span>
              <span className="score-number">{resume.ats_score || 0}%</span>
            </div>
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

  if (resume && typeof resume === 'string') {
    return (
      <div className="resume-display-container">
        <pre className="resume-content">{resume}</pre>
      </div>
    );
  }

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
            {result.recommendations_for_improvement?.map((rec, i) => (
              <li key={i}>
                {rec}
                <button onClick={() => handleRemoveRecommendation(i)} className="remove-btn">
                  &times;
                </button>
              </li>
            ))}
          </ul>
          <div className="add-recommendation-container">
            <input
              type="text"
              value={newRecommendation}
              onChange={(e) => setNewRecommendation(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddRecommendation()}
              placeholder="Add a new recommendation"
            />
            <button onClick={handleAddRecommendation}>Add</button>
          </div>
        </div>

        <button onClick={onUpdateResume} className="update-resume-button" disabled={isUpdating}>
          {isUpdating ? <div className="loader small"></div> : 'Update Resume'}
        </button>
      </div>
    );
  }

  return <div className="score-display placeholder">Your analysis results will appear here.</div>;
}

export default ScoreDisplay;