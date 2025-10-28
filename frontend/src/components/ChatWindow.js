import React, { useState, useRef, useEffect } from 'react';
import './ChatWindow.css';

function ChatWindow({ 
  onAnalysisComplete, 
  onResumeGenerated, 
  resetTrigger,
  analysisResult,
  setAnalysisResult,
  handleUpdateResume,
  chatHistory,
  setChatHistory,
}) {
  const [mode, setMode] = useState('analyze');
  const [resumeFile, setResumeFile] = useState(null); // For initial upload
  const [badgeFiles, setBadgeFiles] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const badgeInputRef = useRef(null);
  const textareaRef = useRef(null);
  const chatBodyRef = useRef(null);

  useEffect(() => {
    // This effect should ONLY run when the resetTrigger prop changes.
    // The check for > 0 ensures it doesn't run on the initial render.
    if (resetTrigger > 0) { 
      setResumeFile(null);
      setBadgeFiles([]);
      setInputText('');
      setIsLoading(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  }, [resetTrigger]);

  useEffect(() => {
    // Scroll to the bottom of the chat body whenever history changes
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setResumeFile(file);
      setChatHistory(prev => [...prev, { type: 'file', name: file.name }]);
    }
    event.target.value = null;
  };

  const handleBadgeFileChange = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) setBadgeFiles(prev => [...prev, ...files]);
    event.target.value = null;
  };

  const removeFile = () => {
    setResumeFile(null);
    setChatHistory(prev => prev.filter(msg => msg.type !== 'file'));
  };
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

 const handleAgentInteraction = (text) => {
    const lowercasedText = text.toLowerCase();
    
    // Most agent interactions require an analysis to be present.
    if (!analysisResult && (lowercasedText.startsWith('add') || lowercasedText.startsWith('remove') || lowercasedText.includes('update'))) {
      setChatHistory(prev => [...prev, { type: 'agent', content: "I can do that, but you need to analyze a resume first. Please upload a resume and job description." }]);
      return true;
    }

    // Regex to capture action (add/remove), skills, and target (resume/jd)
    const skillCommandRegex = /^(add|remove) skills? (.*?)(?: to| from)? the (resume|job description|jd|analysis)?$/i;
    const match = text.match(skillCommandRegex);

    if (match) {
      const [, action, skillsStr, target] = match;
      const skills = skillsStr.split(',').map(s => s.trim()).filter(Boolean);

      if (skills.length === 0) {
        setChatHistory(prev => [...prev, { type: 'agent', content: "Please specify which skills you'd like to " + action + "." }]);
        return true;
      }

      const isAdd = action.toLowerCase() === 'add';
      const targetKey = (target && target.includes('resume')) ? 'resume_skills' : 'jd_skills';

      if (isAdd) {
        setAnalysisResult(prev => ({
          ...prev,
          [targetKey]: [...new Set([...(prev[targetKey] || []), ...skills])]
        }));
        setChatHistory(prev => [...prev, { type: 'agent', content: `Okay, I've added the following skills to the ${targetKey === 'resume_skills' ? 'resume' : 'job description'} analysis: ${skills.join(', ')}.` }]);
      } else {
        setAnalysisResult(prev => {
          const currentSkills = prev[targetKey] || [];
          const skillsToRemoveSet = new Set(skills.map(s => s.toLowerCase()));
          const newSkills = currentSkills.filter(s => !skillsToRemoveSet.has(s.toLowerCase()));
          return { ...prev, [targetKey]: newSkills };
        });
        setChatHistory(prev => [...prev, { type: 'agent', content: `Done. I've removed the following skills from the ${targetKey === 'resume_skills' ? 'resume' : 'job description'} analysis: ${skills.join(', ')}.` }]);
      }
      return true;
    }

    // Fallback for simple "add skill" without target
    if (lowercasedText.startsWith('add skill')) {
      const skillsToAdd = text.replace(/add skills?/i, '').trim().split(',').map(s => s.trim()).filter(Boolean);
      if (skillsToAdd.length > 0) {
        setAnalysisResult(prev => ({
          ...prev,
          jd_skills: [...new Set([...(prev.jd_skills || []), ...skillsToAdd])]
        }));
        setChatHistory(prev => [...prev, { type: 'agent', content: `Okay, I've added the following skills to the job description analysis: ${skillsToAdd.join(', ')}.` }]);
      } else {
        setChatHistory(prev => [...prev, { type: 'agent', content: "Please tell me which skills you'd like to add." }]);
      }
      return true;
    }

    // Intent: Add recommendation
    if (lowercasedText.startsWith('add recommendation')) {
      const recommendation = text.replace(/add recommendation/i, '').trim();
      if (recommendation && analysisResult) {
        setAnalysisResult(prev => ({
          ...prev,
          recommendations_for_improvement: [...(prev.recommendations_for_improvement || []), recommendation]
        }));
        setChatHistory(prev => [...prev, { type: 'agent', content: "I've added that to the recommendations." }]);
      } else {
        setChatHistory(prev => [...prev, { type: 'agent', content: "I can add a recommendation, but please tell me what it is." }]);
      }
      return true;
    }

    // Intent: Trigger resume update
    if (lowercasedText.includes('update my resume') || lowercasedText.includes('generate the resume')) {
      if (analysisResult) {
        setChatHistory(prev => [...prev, { type: 'agent', content: "Sure, I'm updating the resume now based on the analysis. Please wait..." }]);
        handleUpdateResume(); // This is the async function from App.js
      } else {
        setChatHistory(prev => [...prev, { type: 'agent', content: "I can't update a resume without an initial analysis. Please upload a resume and job description first." }]);
      }
      return true;
    }

    return false; // No specific agent action was taken
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    const userMessage = inputText.trim();
    if (!userMessage && !resumeFile) {
      alert('Please upload a resume or type a message.');
      return;
    }

    if (userMessage) {
      setChatHistory(prev => [...prev, { type: 'user', content: userMessage }]);
      setInputText(''); // Clear input after sending
      if (textareaRef.current) textareaRef.current.style.height = 'auto';

      if (handleAgentInteraction(userMessage)) {
        // Agent handled the interaction, so we stop here.
        // We also set loading to false in case it was set by a previous, non-agent interaction.
        setIsLoading(false);
        return; 
      }
    }

    setIsLoading(true);

    // Do not proceed to analysis if an analysis already exists. Agent handles modifications.
    // This check should only apply when in 'analyze' mode.
    if (mode === 'analyze' && analysisResult) {
      setIsLoading(false);
      setChatHistory(prev => [...prev, { type: 'agent', content: "I've already analyzed a resume. You can ask me to make changes or click 'Analyze Resume' to start over." }]);
      return;
    }

    const formData = new FormData();

    if (mode === 'analyze') {
      if (!resumeFile) {
        alert('Please upload a resume file using the '+' button.');
        setIsLoading(false);
        return;
      }
      formData.append('resume', resumeFile);
      // Use the last user message as the JD if it exists
      formData.append('job_description', userMessage);

      try {
        const response = await fetch('http://localhost:5000/api/analyze', {
          method: 'POST', body: formData,
        });
        if (!response.ok) throw new Error('Server responded with an error!');
        const data = await response.json();
        onAnalysisComplete(data);
        setChatHistory(prev => [...prev, { type: 'agent', content: "I've finished analyzing the resume. You can see the report on the right. Feel free to ask for changes, like 'add skill Python' or 'update my resume'." }]);
      } catch (error) {
        console.error('Error analyzing resume:', error);
        alert('Failed to analyze resume. Please check the console for details.');
      }
    } else { // Generate mode
      if (!userMessage) {
        alert('Please describe the resume you want to generate in the message box.');
        setIsLoading(false);
        return;
      }
      formData.append('prompt', userMessage);
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
    // Don't clear state here, it's part of the history now
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
  };

  return (
    <div className="chat-window-container">
      <div className="chat-header">
        <span onClick={() => handleModeChange('analyze')} className={`mode-option ${mode === 'analyze' ? 'active' : ''}`}>Analyze Resume</span>
        <span className="mode-separator">|</span>
        <span onClick={() => handleModeChange('generate')} className={`mode-option ${mode === 'generate' ? 'active' : ''}`}>Generate Resume</span>
      </div>

      <div className="chat-body" ref={chatBodyRef}>
        {chatHistory.length === 0 && (
          <div className="placeholder-text">
            {mode === 'analyze'
              ? "Use the '+' to upload your resume, paste a job description, and hit send."
              : "Use '+' to upload a resume, 🎖️ to add badges, describe the resume, and hit send."
            }
          </div>
        )}
        {chatHistory.map((msg, index) => {
          if (msg.type === 'file') {
            return (
              <div key={index} className="file-display-card">
                <span className="file-icon">📄</span>
                <span className="file-name">{msg.name}</span>
                <button onClick={removeFile} className="remove-file-button">&times;</button>
              </div>
            );
          }
          return (
            <div key={index} className={`chat-message ${msg.type}`}>
              <div className="message-bubble">{msg.content}</div>
            </div>
          );
        })}
      </div>

      <div className="chat-input-area">
        <form onSubmit={handleSubmit} className="message-form" onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSubmit(e); }}>
          <button type="button" className="add-file-button" onClick={triggerFileSelect}>+</button>
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
