import React, { useState } from 'react';
import './App.css';
import ChatWindow from './components/ChatWindow';
import Header from './components/Header';
import ScoreDisplay from './components/ScoreDisplay';
import ResumeDisplay from './components/ResumeDisplay';
import OptimizedResumeModal from './components/OptimizedResumeModal';

function App() {
  const [analysisResult, setAnalysisResult] = useState(null);
  const [generatedResume, setGeneratedResume] = useState(null);
  const [showOptimizedResume, setShowOptimizedResume] = useState(false);
  const [resetChat, setResetChat] = useState(0); // State to trigger chat window reset
  const [isUpdating, setIsUpdating] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);

  const handleAnalysisComplete = (result) => {
    setGeneratedResume(null);
    setAnalysisResult(result);
  };

  const handleResumeGenerated = (resume) => {
    setAnalysisResult(null); // Clear analysis result once a new resume is generated
    setGeneratedResume(resume);
  };

  const handleUpdateResume = async () => {
    if (!analysisResult) {
      alert('No analysis result available to update.');
      return;
    }
    setIsUpdating(true);
    const formData = new FormData();

    formData.append('original_resume_text', analysisResult.resume);
    if (analysisResult.job_description) {
      formData.append('job_description', analysisResult.job_description);
    }
    const updatePrompt = `Optimize the provided resume based on these recommendations: \n- ${analysisResult.recommendations_for_improvement.join('\n- ')}`;
    formData.append('prompt', updatePrompt);

    try {
      const response = await fetch('http://localhost:5000/api/generate-resume', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Server responded with an error during resume update!');
      const data = await response.json();
      handleResumeGenerated(data); // Use the existing handler to set the new resume
    } catch (error) {
      console.error('Error updating resume:', error);
      alert('Failed to update resume. Please check the console for details.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTitleClick = () => {
    setAnalysisResult(null);
    setGeneratedResume(null);
    // The modal is part of the main app, so we should control its state here.
    setShowOptimizedResume(false);
    setChatHistory([]);
    setResetChat(prev => prev + 1); // Increment to trigger reset in ChatWindow
  };

  return (
    <div className="App">
      <Header onTitleClick={handleTitleClick} />
      <main className="main-content">
        <div className="chat-container">
          <ChatWindow 
            onAnalysisComplete={handleAnalysisComplete} 
            onResumeGenerated={handleResumeGenerated}
            analysisResult={analysisResult}
            setAnalysisResult={setAnalysisResult}
            handleUpdateResume={handleUpdateResume}
            chatHistory={chatHistory}
            setChatHistory={setChatHistory}
            resetTrigger={resetChat}
            handleTitleClick={handleTitleClick}
          />
        </div>
        <div className="results-container">
          {generatedResume ? (
            <ResumeDisplay resume={generatedResume} />
          ) : analysisResult ? (
            <ScoreDisplay result={analysisResult} onUpdateResume={handleUpdateResume} isUpdating={isUpdating} />
          ) : (
            <div className="placeholder-results">Your analysis and optimized resume will appear here.</div>
          )}
        </div>
      </main>

      {showOptimizedResume && analysisResult && (
        <OptimizedResumeModal 
          resumeText={analysisResult.optimized_resume_text}
          onClose={() => setShowOptimizedResume(false)}
        />
      )}
    </div>
  );
}

export default App;
