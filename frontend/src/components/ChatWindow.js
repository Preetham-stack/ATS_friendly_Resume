import React, { useState, useRef, useEffect } from 'react';
import './ChatWindow.css';

function ChatWindow({ onAnalysisComplete, onResumeGenerated, resetTrigger }) {
  const [mode, setMode] = useState('analyze'); // 'analyze' or 'generate'
  const [resumeFile, setResumeFile] = useState(null);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  // Effect to reset state when resetTrigger changes
  useEffect(() => {
    setMode('analyze');
    setResumeFile(null);
    setInputText('');
    setIsLoading(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [resetTrigger]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setResumeFile(file);
    }
    // Reset the file input so the same file can be re-uploaded
    event.target.value = null;
  };

  const removeFile = () => {
    setResumeFile(null);
  };

  const handleTextChange = (event) => {
    setInputText(event.target.value);
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    if (mode === 'analyze') {
      if (!resumeFile) {
        alert('Please upload a resume file using the '+' button.');
        setIsLoading(false);
        return;
      }
      const formData = new FormData();
      formData.append('resume', resumeFile);
      formData.append('job_description', inputText);

      try {
        const response = await fetch('http://localhost:5000/api/analyze', {
          method: 'POST',
          body: formData,
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
      try {
        const response = await fetch('http://localhost:5000/api/generate-resume', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: inputText }),
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
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
    }
  };

  return (
    <div className="chat-window-container">
      <div className="chat-header">
        <span
          onClick={() => setMode('analyze')}
          className={`mode-option ${mode === 'analyze' ? 'active' : ''}`}>
          Analyze Resume
        </span>
        <span className="mode-separator">|</span>
        <span
          onClick={() => setMode('generate')}
          className={`mode-option ${mode === 'generate' ? 'active' : ''}`}>
          Generate Resume
        </span>
      </div>

      <div className="chat-body">
        {mode === 'analyze' && resumeFile ? (
          <div className="file-display-card">
            <span className="file-icon">📄</span>
            <span className="file-name">{resumeFile.name}</span>
            <button onClick={removeFile} className="remove-file-button">&times;</button>
          </div>
        ) : (
          <div className="placeholder-text">
            {mode === 'analyze'
              ? "Use the '+' to upload your resume, paste a job description in the message box, and hit send."
              : "Describe the resume you want in the message box (e.g., 'a Python developer resume with 3 years of experience') and hit send."
            }
          </div>
        )}
      </div>

      <div className="chat-input-area">
        <form onSubmit={handleSubmit} className="message-form">
          <button type="button" className="add-file-button" onClick={triggerFileSelect}>
            +
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <textarea
            ref={textareaRef}
            className="message-input"
            placeholder={mode === 'analyze' ? 'Paste job description here (optional)..' : 'Describe the resume you want...'}
            value={inputText}
            onChange={handleTextChange}
            rows="1"
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