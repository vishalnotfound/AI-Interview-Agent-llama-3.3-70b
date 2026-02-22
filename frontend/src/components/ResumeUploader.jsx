import { useState, useRef, useCallback } from 'react';

export default function ResumeUploader({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [parsed, setParsed] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileRef = useRef(null);

  const validateFile = (selected) => {
    const ext = selected.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx', 'doc'].includes(ext)) {
      setError('Please upload a PDF or DOCX file.');
      setFile(null);
      return false;
    }
    setFile(selected);
    setError('');
    return true;
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) validateFile(selected);
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const { uploadResume } = await import('../api');
      const data = await uploadResume(file);
      setParsed(true);
      setLoading(false);
      fileRef.current = data;
    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.');
      setLoading(false);
    }
  };

  const handleStart = () => {
    if (fileRef.current) {
      onUploadSuccess(fileRef.current);
    }
  };

  const currentStep = parsed ? 1 : 0;

  return (
    <div className="upload-container">
      {/* Animated background orbs */}
      <div className="bg-orbs" aria-hidden="true">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      <div className="upload-card">
        {/* Hero Icon */}
        <div className="hero-icon-wrap">
          <div className={`hero-ring ${loading ? 'processing' : parsed ? 'done' : ''}`}></div>
          <svg className="hero-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="8" y="6" width="48" height="52" rx="6" stroke="url(#grad1)" strokeWidth="2.5" fill="none"/>
            <path d="M20 22h24M20 30h24M20 38h16" stroke="url(#grad1)" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="48" cy="48" r="14" fill="var(--bg)" stroke="url(#grad2)" strokeWidth="2.5"/>
            <path d="M44 48l3 3 6-6" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <defs>
              <linearGradient id="grad1" x1="8" y1="6" x2="56" y2="58">
                <stop stopColor="var(--primary)"/>
                <stop offset="1" stopColor="var(--success)"/>
              </linearGradient>
              <linearGradient id="grad2" x1="34" y1="34" x2="62" y2="62">
                <stop stopColor="var(--primary)"/>
                <stop offset="1" stopColor="var(--success)"/>
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Title & Subtitle */}
        <h1 className="hero-title">AI Interview Prep</h1>
        <p className="hero-subtitle">Upload your resume and ace your next interview with AI-powered mock sessions</p>

        {/* Feature Pills */}
        <div className="feature-pills">
          <span className="pill">
            <span className="pill-icon">🎯</span>
            <span>Tailored Questions</span>
          </span>
          <span className="pill">
            <span className="pill-icon">🎙️</span>
            <span>Voice Analysis</span>
          </span>
          <span className="pill">
            <span className="pill-icon">📊</span>
            <span>Smart Feedback</span>
          </span>
        </div>

        {/* Drop Zone */}
        <div
          className={`drop-zone ${dragActive ? 'drag-active' : ''} ${file ? 'has-file' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById('resume-file').click()}
        >
          <input
            type="file"
            accept=".pdf,.docx,.doc"
            onChange={handleFileChange}
            id="resume-file"
            className="file-input"
          />
          {file ? (
            <div className="file-selected">
              <span className="file-icon-selected">📎</span>
              <span className="file-name">{file.name}</span>
              <span className="file-size">{(file.size / 1024).toFixed(0)} KB</span>
            </div>
          ) : (
            <div className="drop-content">
              <div className="drop-icon">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <path d="M20 6v20M12 14l8-8 8 8" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6 28v4a2 2 0 002 2h24a2 2 0 002-2v-4" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <p className="drop-text">Drag & drop your resume here</p>
              <p className="drop-hint">or click to browse &middot; PDF, DOCX supported</p>
            </div>
          )}
        </div>

        {/* Error */}
        {error && <p className="error-text">{error}</p>}

        {/* Action Buttons */}
        {!parsed ? (
          <button
            className="btn btn-primary btn-glow"
            onClick={handleUpload}
            disabled={!file || loading}
          >
            {loading ? (
              <span className="loading-state">
                <span className="spinner-sm"></span>
                <span>Analyzing Resume</span>
              </span>
            ) : (
              <>
                <span>🚀</span>
                <span>Upload & Analyze</span>
              </>
            )}
          </button>
        ) : (
          <button className="btn btn-success btn-glow" onClick={handleStart}>
            <span>🎤</span>
            <span>Start Interview</span>
          </button>
        )}

        {parsed && (
          <p className="success-text">
            <span className="success-icon">✅</span> Resume analyzed! Ready to start.
          </p>
        )}

        {/* Step indicator */}
        <div className="steps-indicator">
          <div className={`step ${currentStep >= 0 ? 'active' : ''} ${currentStep > 0 ? 'completed' : ''}`}>
            <div className="step-dot">1</div>
            <span className="step-label">Upload</span>
          </div>
          <div className="step-line">
            <div className={`step-line-fill ${currentStep > 0 ? 'filled' : ''}`}></div>
          </div>
          <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>
            <div className="step-dot">2</div>
            <span className="step-label">Interview</span>
          </div>
          <div className="step-line">
            <div className="step-line-fill"></div>
          </div>
          <div className="step">
            <div className="step-dot">3</div>
            <span className="step-label">Report</span>
          </div>
        </div>
      </div>
    </div>
  );
}
