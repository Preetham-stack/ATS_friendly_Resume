 import React from 'react';
 import './ScoreDisplay.css';

 function ScoreDisplay({ result, onUpdateResume, isUpdating }) {
   if (!result) {
     return <div className="score-display placeholder">Your analysis results will appear here.</div>;
   }

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

 export default ScoreDisplay;