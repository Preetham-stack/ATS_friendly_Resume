import React, { useState, useRef, useEffect } from 'react';
import './ChatWindow.css';

function ChatWindow({ onAnalysisComplete, onResumeGenerated, resetTrigger, analysisResultForUpdate }) {
  const [mode, setMode] = useState('analyze');
  const [resumeFile, setResumeFile] = useState(null); // For initial upload
  const [badgeFiles, setBadgeFiles] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const badgeInputRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    setMode('analyze');
    setResumeFile(null);
    setBadgeFiles([]);
    setInputText('');
    setIsLoading(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [resetTrigger, analysisResultForUpdate]); // Added analysisResultForUpdate to dependencies

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) setResumeFile(file);
    event.target.value = null;
  };

  const handleBadgeFileChange = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) setBadgeFiles(prev => [...prev, ...files]);
    event.target.value = null;
  };

  const removeFile = () => setResumeFile(null);
  const removeBadgeFile = (index) => {
    setBadgeFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleTextChange = (event) => {
    setInputText(event.target.value);
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  const triggerFileSelect = () => fileInputRef.current.click();
  const triggerBadgeFileSelect = () => badgeInputRef.current.click();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData();

    if (mode === 'analyze') {
      if (!resumeFile) {
        alert('Please upload a resume file using the '+' button.');
        setIsLoading(false);
        return;
      }
      formData.append('resume', resumeFile);
      formData.append('job_description', inputText);

      try {
        const response = await fetch('http://localhost:5000/api/analyze', {
          method: 'POST', body: formData,
        });
        if (!response.ok) throw new Error('Server responded with an error!');
        const data = await response.json();
        onAnalysisComplete(data);
      } catch (error) {
        console.error('Error analyzing resume:', error);
        alert('Failed to analyze resume. Please check the console for details.');
      }
    } else { // Generate mode
      if (!inputText) {
        alert('Please describe the resume you want to generate in the message box.');
        setIsLoading(false);
        return;
      }
      formData.append('prompt', inputText);
      badgeFiles.forEach(file => {
        formData.append('badges', file);
      });

      try {
        const response = await fetch('http://localhost:5000/api/generate-resume', {
          method: 'POST', body: formData,
        });
        if (!response.ok) throw new Error('Server responded with an error!');
        const data = await response.json();
        onResumeGenerated(data);
      } catch (error) {
        console.error('Error generating resume:', error);
        alert('Failed to generate resume. Please check the console for details.');
      }
    }

    setIsLoading(false);
    setInputText('');
    setResumeFile(null);
    setBadgeFiles([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleUpdateResume = async () => {
    setIsLoading(true);
    const formData = new FormData();

    if (!analysisResultForUpdate || !analysisResultForUpdate.resume || !analysisResultForUpdate.recommendations_for_improvement) {
      alert('Analysis results or recommendations are missing for update.');
      setIsLoading(false);
      return;
    }

    // Assuming the backend's /api/generate-resume endpoint can accept these parameters
    // for an "update" operation. It will use the recommendations as the prompt.
    formData.append('original_resume_text', analysisResultForUpdate.resume);
    if (analysisResultForUpdate.job_description) {
      formData.append('job_description', analysisResultForUpdate.job_description);
    }
    // Combine recommendations into a prompt for the generation API
    const updatePrompt = `Optimize the provided resume based on these recommendations: \n- ${analysisResultForUpdate.recommendations_for_improvement.join('\n- ')}`;
    formData.append('prompt', updatePrompt);

    try {
      const response = await fetch('http://localhost:5000/api/generate-resume', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Server responded with an error during resume update!');
      const data = await response.json();
      onResumeGenerated(data); // This will update generatedResume in App.js and clear analysisResult
      alert('Resume updated successfully! Check the right panel for the new version.');
    } catch (error) {
      console.error('Error updating resume:', error);
      alert('Failed to update resume. Please check the console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-window-container">
      <div className="chat-header">
        <span onClick={() => setMode('analyze')} className={`mode-option ${mode === 'analyze' ? 'active' : ''}`}>Analyze Resume</span>
        <span className="mode-separator">|</span>
        <span onClick={() => setMode('generate')} className={`mode-option ${mode === 'generate' ? 'active' : ''}`}>Generate Resume</span>
      </div>

      <div className="chat-body">
        {analysisResultForUpdate ? (
          <div className="analysis-result-card">
            <h3>Resume Analysis Complete!</h3>
            <div className="scores-container">
              <div className="score-summary">
                <span className="score-label">ATS Score</span>
                <span className="score-number">{analysisResultForUpdate.ats_score_estimation || 0}%</span>
              </div>
              <div className="score-summary">
                <span className="score-label">Skills Match</span>
                <span className="score-number">{analysisResultForUpdate.skills_matching_score || 0}%</span>
              </div>
            </div>

            <p className="feedback">{analysisResultForUpdate.feedback}</p>

            {analysisResultForUpdate.missing_keywords && analysisResultForUpdate.missing_keywords.length > 0 && (
              <>
                <h4>Missing Keywords</h4>
                <div className="keywords-container">
                  {analysisResultForUpdate.missing_keywords.map((keyword, i) => (
                    <span key={i} className="keyword-pill">{keyword}</span>
                  ))}
                </div>
              </>
            )}

            <div className="skills-comparison-container">
              <div className="skills-column">
                <h4>Skills in Job Description</h4>
                <ul className="skills-list">{analysisResultForUpdate.jd_skills?.map((skill, i) => <li key={i}>{skill}</li>)}</ul>
              </div>
              <div className="skills-column">
                <h4>Skills in Your Resume</h4>
                <ul className="skills-list">{analysisResultForUpdate.resume_skills?.map((skill, i) => <li key={i}>{skill}</li>)}</ul>
              </div>
            </div>

            <h4>Recommendations for Improvement:</h4>
            <ul className="recommendations-list">
              {analysisResultForUpdate.recommendations_for_improvement?.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
            <button onClick={handleUpdateResume} className="update-resume-button" disabled={isLoading}>
              {isLoading ? <div className="loader small"></div> : 'Update Resume'}
            </button>
          </div>
        ) : (
          <>
            {mode === 'analyze' && resumeFile && (
              <div className="file-display-card">
                <span className="file-icon">📄</span>
                <span className="file-name">{resumeFile.name}</span>
                <button onClick={removeFile} className="remove-file-button">&times;</button>
              </div>
            )}
            {mode === 'generate' && badgeFiles.length > 0 && (
              <div className="badge-display-area">
                {badgeFiles.map((file, index) => (
                  <div key={index} className="file-display-card badge-card">
                    <span className="file-icon">🎖️</span>
                    <span className="file-name">{file.name}</span>
                    <button onClick={() => removeBadgeFile(index)} className="remove-file-button">&times;</button>
                  </div>
                ))}
              </div>
            )}
            {!resumeFile && badgeFiles.length === 0 && (
              <div className="placeholder-text">
                {mode === 'analyze'
                  ? "Use the '+' to upload your resume, paste a job description, and hit send."
                  : "Use '+' to upload a resume, 🎖️ to add badges, describe the resume, and hit send."
                }
              </div>
            )}
          </>
        )}
      </div>

      <div className="chat-input-area">
        <form onSubmit={handleSubmit} className="message-form">
          {/* Disable file upload buttons if analysis result is displayed */}
          <button type="button" className="add-file-button" onClick={triggerFileSelect} disabled={!!analysisResultForUpdate}>+</button>
          {mode === 'generate' && (
            <button type="button" className="add-file-button" onClick={triggerBadgeFileSelect}>🎖️</button>
          )}
          <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept=".pdf,.docx" />
          <input type="file" ref={badgeInputRef} onChange={handleBadgeFileChange} style={{ display: 'none' }} accept="image/*" multiple />
          <textarea
            ref={textareaRef}
            className="message-input"
            placeholder={mode === 'analyze' ? 'Paste job description here (optional)..' : 'Describe the resume you want...'}
            value={inputText}
            onChange={handleTextChange}
            rows="1" // Disable input if analysis result is displayed
          />
          <button type="submit" className="send-button" disabled={isLoading}>
            {isLoading ? <div className="loader"></div> : '➤'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChatWindow;
