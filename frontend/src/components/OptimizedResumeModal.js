import React from 'react';
import './OptimizedResumeModal.css';

function OptimizedResumeModal({ resumeText, onClose }) {

  const handleCopy = () => {
    navigator.clipboard.writeText(resumeText)
      .then(() => alert('Resume text copied to clipboard!'))
      .catch(err => alert('Failed to copy text.'));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Optimized Resume Text</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <pre className="resume-text-box">{resumeText}</pre>
        </div>
        <div className="modal-footer">
          <button className="copy-button" onClick={handleCopy}>Copy Text</button>
          <button className="close-action-button" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default OptimizedResumeModal;
