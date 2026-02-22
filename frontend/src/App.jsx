import { useState } from 'react';
import ResumeUploader from './components/ResumeUploader';
import InterviewSession from './components/InterviewSession';
import FinalReport from './components/FinalReport';
import './App.css';

export default function App() {
  const [phase, setPhase] = useState('upload'); // upload | interview | report
  const [sessionId, setSessionId] = useState('');
  const [firstQuestion, setFirstQuestion] = useState('');
  const [finalReport, setFinalReport] = useState(null);

  const handleUploadSuccess = (data) => {
    setSessionId(data.session_id);
    setFirstQuestion(data.first_question);
    setPhase('interview');
  };

  const handleInterviewComplete = (report) => {
    setFinalReport(report);
    setPhase('report');
  };

  return (
    <div className="app">
      <header className="app-header">
        <span className="logo">
          <svg className="logo-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z" fill="url(#logoGrad)"/>
            <defs>
              <linearGradient id="logoGrad" x1="4" y1="2" x2="20" y2="20">
                <stop stopColor="#6C63FF"/>
                <stop offset="1" stopColor="#00C9A7"/>
              </linearGradient>
            </defs>
          </svg>
          <span className="logo-text">InterviewAI</span>
        </span>
      </header>

      <main className="app-main">
        {phase === 'upload' && (
          <ResumeUploader onUploadSuccess={handleUploadSuccess} />
        )}
        {phase === 'interview' && (
          <InterviewSession
            sessionId={sessionId}
            firstQuestion={firstQuestion}
            onComplete={handleInterviewComplete}
          />
        )}
        {phase === 'report' && (
          <FinalReport report={finalReport} />
        )}
      </main>
    </div>
  );
}
