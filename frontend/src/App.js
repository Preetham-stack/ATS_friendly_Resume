import React, { useState } from 'react';
import './App.css';
import Header from './components/Header';
import ChatWindow from './components/ChatWindow';
import ScoreDisplay from './components/ScoreDisplay';
import ResumeDisplay from './components/ResumeDisplay';
import OptimizedResumeModal from './components/OptimizedResumeModal';

function App() {
  const [analysisResult, setAnalysisResult] = useState(null);
  const [generatedResume, setGeneratedResume] = useState(null);
  const [showOptimizedResume, setShowOptimizedResume] = useState(false);

  const handleAnalysisComplete = (result) => {
    setGeneratedResume(null);
    setAnalysisResult(result);
  };

  const handleResumeGenerated = (resume) => {
    setAnalysisResult(null);
    setGeneratedResume(resume);
  };

  return (
    <div className="App">
      <Header />
      <main className="main-content">
        <div className="chat-container">
          <ChatWindow 
            onAnalysisComplete={handleAnalysisComplete} 
            onResumeGenerated={handleResumeGenerated} 
          />
        </div>
        <div className="results-container">
          {generatedResume ? (
            <ResumeDisplay resume={generatedResume} />
          ) : (
            <ScoreDisplay 
              result={analysisResult} 
              onShowOptimizedResume={setShowOptimizedResume} 
            />
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
