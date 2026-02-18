import { useState, useEffect, useRef, useCallback } from 'react';
import { submitAnswer } from '../api';

const TOTAL_QUESTIONS = 5;
const MAX_RECORD_SECONDS = 90;
const SILENCE_TIMEOUT_MS = 6000; // auto-submit after 6s of silence

export default function InterviewSession({ sessionId, firstQuestion, onComplete }) {
  const [currentQuestion, setCurrentQuestion] = useState(firstQuestion);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [status, setStatus] = useState('speaking'); // speaking | recording | processing | idle
  const [error, setError] = useState('');
  const [previousQuestions, setPreviousQuestions] = useState([]);
  const [previousAnswers, setPreviousAnswers] = useState([]);
  const [timer, setTimer] = useState(MAX_RECORD_SECONDS);
  const [speechSupported, setSpeechSupported] = useState(true);

  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const silenceRef = useRef(null);
  const transcriptRef = useRef('');
  const isSubmittingRef = useRef(false);
  const shouldListenRef = useRef(false);
  const handleSubmitRef = useRef(null);
  const startListeningRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) setSpeechSupported(false);
  }, []);

  const speakQuestion = useCallback((text) => {
    return new Promise((resolve) => {
      if (!window.speechSynthesis) { resolve(); return; }
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.lang = 'en-US';

      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google'))
        || voices.find(v => v.lang.startsWith('en'));
      if (preferred) utterance.voice = preferred;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => { setIsSpeaking(false); resolve(); };
      utterance.onerror = () => { setIsSpeaking(false); resolve(); };

      window.speechSynthesis.speak(utterance);
    });
  }, []);

  const stopRecording = useCallback(() => {
    shouldListenRef.current = false;
    if (recognitionRef.current) { recognitionRef.current.stop(); recognitionRef.current = null; }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (silenceRef.current) { clearTimeout(silenceRef.current); silenceRef.current = null; }
    setIsRecording(false);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (isSubmittingRef.current) return;
    const answer = transcriptRef.current.trim();
    if (!answer) {
      setError('No speech detected. Listening again...');
      setTimeout(() => startListeningRef.current?.(), 1500);
      return;
    }

    isSubmittingRef.current = true;
    stopRecording();
    setStatus('processing');
    setError('');

    try {
      const data = await submitAnswer({
        session_id: sessionId,
        current_question: currentQuestion,
        current_answer: answer,
        previous_questions: previousQuestions,
        previous_answers: previousAnswers,
      });

      if (data.final_report) {
        await speakQuestion("Great job! Your interview is complete. Here are your results.");
        onComplete(data.final_report);
        isSubmittingRef.current = false;
        return;
      }

      setPreviousQuestions((prev) => [...prev, currentQuestion]);
      setPreviousAnswers((prev) => [...prev, answer]);

      const nextQ = data.next_question;
      setCurrentQuestion(nextQ);
      setQuestionNumber(data.question_count + 1);
      setTranscript('');
      transcriptRef.current = '';
      isSubmittingRef.current = false;

      // Speak the next question immediately
      setStatus('speaking');
      await speakQuestion(nextQ);
      startListeningRef.current?.();
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      setStatus('idle');
      isSubmittingRef.current = false;
    }
  }, [sessionId, currentQuestion, previousQuestions, previousAnswers, onComplete, stopRecording, speakQuestion]);

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { setError('Speech recognition not supported. Please use Chrome.'); return; }

    setTranscript('');
    transcriptRef.current = '';
    setError('');
    setTimer(MAX_RECORD_SECONDS);
    isSubmittingRef.current = false;
    shouldListenRef.current = true;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let finalTranscript = '';

    const resetSilenceTimer = () => {
      if (silenceRef.current) clearTimeout(silenceRef.current);
      silenceRef.current = setTimeout(() => {
        // If the AI is still speaking, reschedule — don't submit yet
        if (window.speechSynthesis?.speaking) {
          resetSilenceTimer();
          return;
        }
        if (!isSubmittingRef.current) {
          stopRecording();
          handleSubmitRef.current?.(); // handles both empty (restarts) and non-empty (submits)
        }
      }, SILENCE_TIMEOUT_MS);
    };

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) { finalTranscript += result[0].transcript + ' '; }
        else { interim += result[0].transcript; }
      }
      const full = finalTranscript + interim;
      transcriptRef.current = full;
      setTranscript(full);
      resetSilenceTimer();
    };

    recognition.onerror = (event) => {
      if (event.error !== 'aborted' && event.error !== 'no-speech') {
        setError(`Speech error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      // Chrome can stop recognition unexpectedly — restart with a fresh instance
      if (shouldListenRef.current && !isSubmittingRef.current) {
        try {
          const freshRecognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
          freshRecognition.continuous = true;
          freshRecognition.interimResults = true;
          freshRecognition.lang = 'en-US';
          freshRecognition.onresult = recognition.onresult;
          freshRecognition.onerror = recognition.onerror;
          freshRecognition.onend = recognition.onend;
          recognitionRef.current = freshRecognition;
          freshRecognition.start();
        } catch (e) { /* ignore restart errors */ }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    setStatus('recording');
    resetSilenceTimer(); // starts the 6s timer — it auto-reschedules while AI is speaking

    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) { stopRecording(); handleSubmitRef.current?.(); return 0; }
        return prev - 1;
      });
    }, 1000);
  }, [stopRecording]);

  // Keep refs in sync with latest function versions — breaks circular dependency
  useEffect(() => { handleSubmitRef.current = handleSubmit; }, [handleSubmit]);
  useEffect(() => { startListeningRef.current = startListening; }, [startListening]);

  // Speak the first question on mount
  useEffect(() => {
    const init = async () => {
      await new Promise(r => setTimeout(r, 500));
      window.speechSynthesis?.getVoices();
      setStatus('speaking');
      await speakQuestion(firstQuestion);
      startListening();
    };
    init();

    return () => {
      window.speechSynthesis?.cancel();
      if (recognitionRef.current) recognitionRef.current.stop();
      if (timerRef.current) clearInterval(timerRef.current);
      if (silenceRef.current) clearTimeout(silenceRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!speechSupported) {
    return (
      <div className="interview-container">
        <div className="error-banner">
          ⚠️ Your browser does not support the Web Speech API.
          <br />Please use Google Chrome for the best experience.
        </div>
      </div>
    );
  }

  return (
    <div className="interview-container">
      {/* Circular Agent Avatar */}
      <div className="agent-section">
        <div className={`agent-avatar ${status}`}>
          <div className="agent-ring" />
          <div className="agent-icon">
            {status === 'speaking' && '🗣️'}
            {status === 'recording' && '👂'}
            {status === 'processing' && '⚙️'}
            {status === 'idle' && '🤖'}
          </div>
        </div>
        <div className="agent-status-label">
          {status === 'speaking' && 'AI Agent Speaking...'}
          {status === 'recording' && 'Listening to Your Answer...'}
          {status === 'processing' && 'Generating Next Question...'}
          {status === 'idle' && 'Ready'}
        </div>
        {status === 'recording' && (
          <div className="timer-pill">
            <span className="rec-dot" />
            <span>⏱️ {timer}s</span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="question-progress">
        <span className="question-badge">Question {questionNumber}/{TOTAL_QUESTIONS}</span>
        <div className="progress-bar-track">
          <div
            className="progress-bar-fill"
            style={{ width: `${(questionNumber / TOTAL_QUESTIONS) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Text */}
      <div className="question-bubble">
        <p className="question-text">{currentQuestion}</p>
      </div>

      {/* Transcript */}
      <div className={`transcript-box ${isRecording ? 'recording' : ''}`}>
        <div className="transcript-header">
          {isRecording && <span className="rec-dot" />}
          <span>{isRecording ? 'Your Answer' : 'Transcript'}</span>
        </div>
        <p className="transcript-text">
          {transcript || (isRecording ? 'Start speaking...' : 'Waiting for your response...')}
        </p>
      </div>

      {/* Action Button */}
      {status === 'recording' && (
        <button className="btn btn-stop" onClick={() => { stopRecording(); handleSubmit(); }}>
          ⏹️ Done Speaking
        </button>
      )}

      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
