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

    formData.append('original_resume_text', analysisResult.resume_text);
    if (analysisResult.job_description) {
      formData.append('job_description', analysisResult.job_description);
    }
    formData.append('recommendations_for_improvement', JSON.stringify(analysisResult.recommendations_for_improvement));

    try {
      const response = await fetch('http://localhost:5000/api/update-resume', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Server responded with an error during resume update!');
      const data = await response.json();
      // By setting the generated resume directly, we preserve the original analysis result
      // so that we can compare the old and new ATS scores.
      setGeneratedResume(data);
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
    setShowOptimizedResume(false);
    setChatHistory([]);
    setResetChat(prev => prev + 1);
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
          />
        </div>
        <div className="results-container">
          { generatedResume && (generatedResume.generated_resume_text || generatedResume.content) ? (
            <ResumeDisplay resume={generatedResume} />
          ) : (analysisResult || generatedResume) ? (
            <ScoreDisplay 
              result={analysisResult} 
              resume={generatedResume} 
              onUpdateResume={handleUpdateResume} 
              isUpdating={isUpdating} 
              setAnalysisResult={setAnalysisResult}
            />
          ) : (
            <div className="placeholder-results">
               <div className="results-header">
                 <span className="mode-option active">Result Window</span>
               </div>
               <div className="placeholder-content">Your analysis and optimized resume will appear here.</div>
            </div>
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