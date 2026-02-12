import { useState, useEffect, useRef, useCallback } from 'react';
import { evaluateAnswer } from '../api';
import QuestionCard from './QuestionCard';
import TranscriptBox from './TranscriptBox';
import EvaluationCard from './EvaluationCard';

const TOTAL_QUESTIONS = 5;
const MAX_RECORD_SECONDS = 90;
const SILENCE_TIMEOUT_MS = 6000; // auto-submit after 6s of silence

export default function InterviewSession({ sessionId, firstQuestion, onComplete }) {
  const [currentQuestion, setCurrentQuestion] = useState(firstQuestion);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [status, setStatus] = useState('speaking'); // speaking | recording | evaluating | idle
  const [evaluation, setEvaluation] = useState(null);
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

  // Check speech recognition support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
  }, []);

  // Speak the question aloud using TTS
  const speakQuestion = useCallback((text) => {
    return new Promise((resolve) => {
      if (!window.speechSynthesis) {
        resolve();
        return;
      }
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.lang = 'en-US';

      // Try to pick a good voice
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v =>
        v.lang.startsWith('en') && v.name.includes('Google')
      ) || voices.find(v => v.lang.startsWith('en'));
      if (preferred) utterance.voice = preferred;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        resolve();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  }, []);

  // Stop recording
  const stopRecording = useCallback(() => {
    shouldListenRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (silenceRef.current) {
      clearTimeout(silenceRef.current);
      silenceRef.current = null;
    }
    setIsRecording(false);
  }, []);

  // Submit the answer
  const handleSubmit = useCallback(async () => {
    if (isSubmittingRef.current) return;
    const answer = transcriptRef.current.trim();
    if (!answer) {
      setError('No speech detected. Listening again...');
      // Re-listen after a brief pause
      setTimeout(() => startListening(), 1500);
      return;
    }

    isSubmittingRef.current = true;
    stopRecording();
    setStatus('evaluating');
    setError('');

    try {
      const data = await evaluateAnswer({
        session_id: sessionId,
        current_question: currentQuestion,
        current_answer: answer,
        previous_questions: previousQuestions,
        previous_answers: previousAnswers,
      });

      if (data.final_report) {
        setEvaluation(data.evaluation);
        // Speak a summary before showing the report
        await speakQuestion("Great job! Your interview is complete. Here are your results.");
        onComplete(data.final_report);
        isSubmittingRef.current = false;
        return;
      }

      setEvaluation(data.evaluation);
      setPreviousQuestions((prev) => [...prev, currentQuestion]);
      setPreviousAnswers((prev) => [...prev, answer]);

      const nextQ = data.next_question;
      setCurrentQuestion(nextQ);
      setQuestionNumber(data.question_count + 1);
      setTranscript('');
      transcriptRef.current = '';
      isSubmittingRef.current = false;

      // Brief pause to show evaluation, then speak next question
      setStatus('idle');
      setTimeout(async () => {
        setEvaluation(null);
        setStatus('speaking');
        await speakQuestion(nextQ);
        startListening();
      }, 2500);
    } catch (err) {
      setError(err.message || 'Evaluation failed. Retrying...');
      setStatus('idle');
      isSubmittingRef.current = false;
    }
  }, [sessionId, currentQuestion, previousQuestions, previousAnswers, onComplete, stopRecording, speakQuestion]);

  // Start listening for speech
  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition not supported. Please use Chrome.');
      return;
    }

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

    // Reset silence timer on every speech result
    const resetSilenceTimer = () => {
      if (silenceRef.current) clearTimeout(silenceRef.current);
      silenceRef.current = setTimeout(() => {
        // Auto-submit after silence
        if (transcriptRef.current.trim() && !isSubmittingRef.current) {
          stopRecording();
          handleSubmit();
        }
      }, SILENCE_TIMEOUT_MS);
    };

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + ' ';
        } else {
          interim += result[0].transcript;
        }
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
      // Restart if we're still supposed to be listening
      if (shouldListenRef.current && !isSubmittingRef.current) {
        try {
          recognition.start();
        } catch (e) {
          // already started
        }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    setStatus('recording');

    // Start silence timer
    resetSilenceTimer();

    // Max time auto-stop
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          stopRecording();
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [stopRecording, handleSubmit]);

  // Speak the first question on mount
  useEffect(() => {
    const init = async () => {
      // Small delay to let voices load
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
      <QuestionCard
        question={currentQuestion}
        questionNumber={questionNumber}
        total={TOTAL_QUESTIONS}
      />

      <TranscriptBox transcript={transcript} isRecording={isRecording} />

      {status === 'speaking' && (
        <div className="status-indicator speaking-indicator">
          <div className="sound-wave">
            <span /><span /><span /><span /><span />
          </div>
          <span>AI is asking the question...</span>
        </div>
      )}

      {status === 'recording' && (
        <div className="status-indicator recording-indicator">
          <span className="rec-dot" />
          <span>Listening... (auto-submits after {SILENCE_TIMEOUT_MS / 1000}s of silence)</span>
          <span className="timer-text">⏱️ {timer}s</span>
        </div>
      )}

      {status === 'evaluating' && (
        <div className="status-indicator evaluating-indicator">
          <div className="spinner" />
          <span>Evaluating your answer...</span>
        </div>
      )}

      {status === 'idle' && (
        <div className="status-indicator">
          <span>Preparing next question...</span>
        </div>
      )}

      {/* Manual stop button as a fallback */}
      {status === 'recording' && (
        <button className="btn btn-stop" onClick={() => { stopRecording(); handleSubmit(); }}>
          ⏹️ Done Speaking
        </button>
      )}

      {error && <p className="error-text">{error}</p>}

      <EvaluationCard evaluation={evaluation} />
    </div>
  );
}
