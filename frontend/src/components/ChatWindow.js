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
  const [resumeFile, setResumeFile] = useState(null);
  const [badgeFiles, setBadgeFiles] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAwaitingUserDetails, setIsAwaitingUserDetails] = useState(false);
  const [jobDescriptionForClarification, setJobDescriptionForClarification] = useState('');
  const [lastJobDescription, setLastJobDescription] = useState(''); // Store the last JD
  const fileInputRef = useRef(null);
  const badgeInputRef = useRef(null);
  const textareaRef = useRef(null);
  const chatBodyRef = useRef(null);

  useEffect(() => {
    if (resetTrigger > 0) {
      setResumeFile(null);
      setBadgeFiles([]);
      setInputText('');
      setIsLoading(false);
      setChatHistory([]);
      setIsAwaitingUserDetails(false);
      setJobDescriptionForClarification('');
      setLastJobDescription('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  }, [resetTrigger]);

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [chatHistory]);

  useEffect(() => {
    // Display a welcome message when the mode changes and the chat is empty
    if (chatHistory.length === 0) {
      if (mode === 'analyze') {
        setChatHistory([
          { type: 'agent', content: 'Meet JDMatch — the AI that reads your JD, reviews your resume, and makes it job-ready in seconds.' },
        ]);
      } else if (mode === 'generate') {
        setChatHistory([
          { type: 'agent', content: 'Meet JDMatch — No resume? No problem. Share your JD or details, and I’ll craft a fresh, job-ready resume for you.' },
        ]);
      }
    }
  }, [mode]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setResumeFile(file);
      setChatHistory(prev => [...prev, { type: 'file', name: file.name, fileType: 'resume' }]);
    }
    event.target.value = null;
  };

  const handleBadgeFileChange = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      setBadgeFiles(prev => [...prev, ...files]);
      const newBadges = files.map(file => ({ type: 'file', name: file.name, fileType: 'badge' }));
      setChatHistory(prev => [...prev, ...newBadges]);
    }
    event.target.value = null;
  };

  const removeFile = (name, fileType) => {
    if (fileType === 'resume') {
      setResumeFile(null);
      setChatHistory(prev => prev.filter(msg => msg.name !== name || msg.fileType !== 'resume'));
    } else if (fileType === 'badge') {
      setBadgeFiles(prev => prev.filter(file => file.name !== name));
      setChatHistory(prev => prev.filter(msg => msg.name !== name || msg.fileType !== 'badge'));
    }
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

    // Intent detection for using the previous JD
    const hasJDReference = lowercasedText.includes('jd') || lowercasedText.includes('job description');
    const hasPreviousReference = lowercasedText.includes('previous') || lowercasedText.includes('above') || lowercasedText.includes('last') || lowercasedText.includes('same');
    const hasActionReference = lowercasedText.includes('use') || lowercasedText.includes('update') || lowercasedText.includes('work with');

    if (hasJDReference && hasPreviousReference && (hasActionReference || resumeFile)) {
      if (lastJobDescription) {
        setChatHistory(prev => [...prev, { type: 'agent', content: "Sure, I can do that. I'll use the previous job description for the analysis." }]);
        return 'USE_PREVIOUS_JD';
      } else {
        setChatHistory(prev => [...prev, { type: 'agent', content: "I don't have a previous job description to use. Please provide one." }]);
        return true; // Block submission
      }
    }

    if (!analysisResult && (lowercasedText.startsWith('add') || lowercasedText.startsWith('remove') || lowercasedText.includes('update'))) {
      setChatHistory(prev => [...prev, { type: 'agent', content: "I can do that, but you need to analyze a resume first. Please upload a resume and job description." }]);
      return true;
    }

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

    if (lowercasedText.includes('update my resume') || lowercasedText.includes('generate the resume')) {
      if (analysisResult) {
        setChatHistory(prev => [...prev, { type: 'agent', content: "Sure, I'm updating the resume now based on the analysis. Please wait..." }]);
        handleUpdateResume();
      } else {
        setChatHistory(prev => [...prev, { type: 'agent', content: "I can't update a resume without an initial analysis. Please upload a resume and job description first." }]);
      }
      return true;
    }

    return false;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const userMessage = inputText.trim();
    let usePreviousJD = false;

    if (userMessage) {
      setChatHistory(prev => [...prev, { type: 'user', content: userMessage }]);
      setInputText('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';

      const agentResponse = handleAgentInteraction(userMessage);
      if (agentResponse === 'USE_PREVIOUS_JD') {
        usePreviousJD = true;
      } else if (agentResponse) {
        setIsLoading(false);
        return;
      }
    }

    if (!userMessage && !resumeFile && mode === 'analyze' && !usePreviousJD) {
      alert('Please upload a resume or type a message.');
      return;
    }
    if (!userMessage && mode === 'generate' && !isAwaitingUserDetails) {
      alert('Please describe the resume you want to generate in the message box.');
      return;
    }

    setIsLoading(true);

    const formData = new FormData();
    let endpoint = 'http://localhost:5000/api/analyze';
    let jdToUse = userMessage;

    if (usePreviousJD) {
      jdToUse = lastJobDescription;
    }

    if (mode === 'analyze') {
      if (!resumeFile) {
        alert('Please upload a resume file using the ' + ' button.');
        setIsLoading(false);
        return;
      }
      formData.append('resume', resumeFile);
      formData.append('job_description', jdToUse);
      setLastJobDescription(jdToUse); // Save the JD for future use
    } else { // Generate mode
      endpoint = 'http://localhost:5000/api/generate-resume';
      if (isAwaitingUserDetails) {
        const combinedDescription = `${jobDescriptionForClarification}\n\n--- Personal Details ---\n${userMessage}`;
        formData.append('job_description', combinedDescription);
      } else {
        formData.append('job_description', jdToUse);
      }

      if (resumeFile) {
        formData.append('resume', resumeFile);
      }
      badgeFiles.forEach(file => {
        formData.append('badges', file);
      });
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST', body: formData,
      });
      if (!response.ok) throw new Error('Server responded with an error!');
      const data = await response.json();

      if (mode === 'generate' && data.status === 'clarification_needed') {
        setChatHistory(prev => [...prev, { type: 'agent', content: data.message }]);
        setIsAwaitingUserDetails(true);
        setJobDescriptionForClarification(jdToUse);
      } else {
        if (mode === 'analyze') {
          onAnalysisComplete(data);
          setChatHistory(prev => [...prev, { type: 'agent', content: "I've finished analyzing the resume. You can see the report on the right. Feel free to ask for changes, like 'add skill Python' or 'update my resume'." }]);
        } else {
          onResumeGenerated(data);
          setChatHistory(prev => [...prev, { type: 'agent', content: "I've generated a new resume for you. You can see the draft on the right." }]);
        }
        setIsAwaitingUserDetails(false);
        setJobDescriptionForClarification('');
      }
    } catch (error) {
      console.error(`Error in ${mode} mode:`, error);
      alert(`Failed to ${mode} resume. Please check the console for details.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setChatHistory([]); // Clear chat history when mode changes
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
              : isAwaitingUserDetails
              ? "Please provide your personal details as requested above."
              : "Describe the resume you want, optionally add a base resume (+) or badges (🎖️), and hit send."
            }
          </div>
        )}
        {chatHistory.map((msg, index) => {
          if (msg.type === 'file') {
            return (
              <div key={index} className="file-display-card">
                <span className="file-icon">{msg.fileType === 'badge' ? '🎖️' : '📄'}</span>
                <span className="file-name">{msg.name}</span>
                <button onClick={() => removeFile(msg.name, msg.fileType)} className="remove-file-button">&times;</button>
              </div>
            );
          }
          return (
            <div key={index} className={`chat-message ${msg.type}`}>
              <div className="message-bubble">{msg.content}</div>
            </div>
          );
        })}
        {isLoading && (
            <div className="chat-message agent">
                <div className="message-bubble"><div className="loader small"></div></div>
            </div>
        )}
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
            placeholder={mode === 'analyze' ? 'Paste job description here (optional)..' : isAwaitingUserDetails ? 'Enter your personal details here...' : 'Describe the resume you want...'}
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