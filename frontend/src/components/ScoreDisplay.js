import React from 'react';
import './ScoreDisplay.css';

function ScoreDisplay({ result, onShowOptimizedResume }) {

  const handleExport = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/export-to-sheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(result),
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to export.');
      }
      alert('Successfully exported to Google Sheets!');
    } catch (error) {
      console.error('Error exporting to sheets:', error);
      alert(`Failed to export: ${error.message}`);
    }
  };

  if (!result) {
    return (
      <div className="score-display placeholder">
        <h2>Your Analysis Results</h2>
        <p>Upload your resume and a job description to see your ATS score and get suggestions for improvement.</p>
      </div>
    );
  }

  const { ats_score, modifications_made, user_recommendations, download_path } = result;

  return (
    <div className="score-display">
      <h2>Your Analysis Results</h2>
      <div className="score-circle">
        <span className="score-number">{ats_score}</span>
        <span className="score-label">/ 100</span>
      </div>
      <p className="score-feedback">
        {ats_score >= 85
          ? "Great job! Your resume is highly ATS-friendly."
          : "Your resume has been optimized to beat the bots!"
        }
      </p>

      <div className="results-pills">
        <button className="pill-button" onClick={() => onShowOptimizedResume(true)}>View Optimized Resume</button>
        {download_path && (
          <a href={`http://localhost:5000/${download_path}`} download className="pill-button download">
             Download (.docx)
          </a>
        )}
        <button className="pill-button export" onClick={handleExport}>Export to Sheets</button>
      </div>

      <div className="suggestions-container">
        <div className="suggestions-column">
          <h3>AI Modifications Made</h3>
          <ul className="suggestions-list">
            {modifications_made && modifications_made.length > 0 ? (
              modifications_made.map((mod, index) => (
                <li key={index}>{mod}</li>
              ))
            ) : (
              <li>No specific modifications were needed.</li>
            )}
          </ul>
        </div>
        <div className="suggestions-column">
          <h3>Further Recommendations</h3>
          <ul className="suggestions-list">
            {user_recommendations && user_recommendations.length > 0 ? (
              user_recommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))
            ) : (
              <li>No further recommendations. Looks great!</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default ScoreDisplay;
