'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  Sparkles,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Trash2,
  Loader2,
  FileText,
  AlertTriangle,
  LogIn,
  UserPlus,
  CheckCircle,
  X,
} from 'lucide-react';

const QUICK_CHIPS = [
  { text: 'Explain my ATS score', type: 'ats' },
  { text: 'Improve this bullet point', type: 'bullet' },
  { text: 'Find missing keywords', type: 'keywords' },
  { text: 'Prepare interview questions', type: 'interview' },
  { text: 'Draft matching cover letter', type: 'cover' },
];

export default function AssistantPage() {
  const { data: session, status } = useSession();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  // Resume-aware context states
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [isProjectsLoading, setIsProjectsLoading] = useState(false);

  // Guest usage limits
  const [isGuest, setIsGuest] = useState(true);
  const [guestLimit, setGuestLimit] = useState(5);
  const [guestCount, setGuestCount] = useState(0);
  const [isLimitReached, setIsLimitReached] = useState(false);

  // Unified Voice Mode States
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [voiceState, setVoiceState] = useState('idle'); // 'idle' | 'listening' | 'thinking' | 'speaking'
  const [micPermissionError, setMicPermissionError] = useState(false);
  const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState(false);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  const speakTimeoutRef = useRef(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load chat history & guest stats
  const fetchChatHistory = useCallback(async () => {
    if (status === 'loading') return;
    setIsHistoryLoading(true);
    try {
      const res = await fetch('/api/assistant');
      const data = await res.json();
      if (res.ok) {
        setMessages(data.messages || []);
        setIsGuest(data.isGuest);
        if (data.isGuest) {
          setGuestLimit(data.limit);
        }
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    } finally {
      setIsHistoryLoading(false);
    }
  }, [status]);

  // Load user's projects for Resume-Aware Selector
  const fetchProjects = useCallback(async () => {
    if (!session) return;
    setIsProjectsLoading(true);
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      if (res.ok && data.projects) {
        setProjects(data.projects);
      }
    } catch (err) {
      console.error('Failed to fetch user projects:', err);
    } finally {
      setIsProjectsLoading(false);
    }
  }, [session]);

  // Initial Bootup Hook
  useEffect(() => {
    fetchChatHistory();
    fetchProjects();

    // Check for web speech APIs
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechRecognitionSupported(true);
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = 'en-US';

        rec.onstart = () => {
          setVoiceState('listening');
          setMicPermissionError(false);
        };

        rec.onresult = (event) => {
          const resultText = event.results[0][0].transcript;
          if (resultText && resultText.trim() !== '') {
            setInputValue(resultText);
            // Trigger automatic submit helper
            handleSend(resultText);
          }
        };

        rec.onerror = (e) => {
          console.error('Speech recognition error:', e);
          if (e.error === 'not-allowed' || e.error === 'permission-denied') {
            setMicPermissionError(true);
            setIsVoiceMode(false);
            setVoiceState('idle');
          } else {
            if (isVoiceMode) {
              restartListening();
            }
          }
        };

        rec.onend = () => {
          setVoiceState(prev => (prev === 'listening' ? 'idle' : prev));
        };

        recognitionRef.current = rec;
      }

      if (window.speechSynthesis) {
        synthRef.current = window.speechSynthesis;
      }
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      if (speakTimeoutRef.current) {
        clearTimeout(speakTimeoutRef.current);
      }
    };
  }, [fetchChatHistory, fetchProjects]);

  // React to voice mode toggles
  useEffect(() => {
    if (!recognitionRef.current) return;
    if (isVoiceMode) {
      setMicPermissionError(false);
      
      const startRec = () => {
        try {
          recognitionRef.current.start();
        } catch (err) {
          console.warn('Recognition start error:', err);
        }
      };

      if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then((stream) => {
            // Instantly stop temporary stream tracks to free the mic for SpeechRecognition
            stream.getTracks().forEach(track => track.stop());
            setMicPermissionError(false);
            startRec();
          })
          .catch((err) => {
            console.error('getUserMedia permission error:', err);
            setMicPermissionError(true);
            setIsVoiceMode(false);
            setVoiceState('idle');
          });
      } else {
        startRec();
      }
    } else {
      try {
        recognitionRef.current.stop();
      } catch (err) {}
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      setVoiceState('idle');
    }
  }, [isVoiceMode]);

  // Restart listening loop cleanly
  const restartListening = () => {
    if (!recognitionRef.current || !isVoiceMode) return;
    try {
      recognitionRef.current.stop();
    } catch (e) {}

    setTimeout(() => {
      if (isVoiceMode) {
        try {
          recognitionRef.current.start();
        } catch (err) {
          console.warn('Mic restart failed:', err);
        }
      }
    }, 400);
  };

  // Speaks response aloud
  const speakResponse = useCallback((text) => {
    if (!isVoiceMode || !synthRef.current) return;
    try {
      synthRef.current.cancel();
      setVoiceState('speaking');

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 1.05;

      utterance.onend = () => {
        setVoiceState('idle');
        if (isVoiceMode) {
          restartListening();
        }
      };

      utterance.onerror = (e) => {
        console.error('Speech synthesis utterance error:', e);
        setVoiceState('idle');
        if (isVoiceMode) {
          restartListening();
        }
      };

      const voices = synthRef.current.getVoices();
      const preferred = voices.find(
        (v) =>
          v.name.includes('Google US English') ||
          v.name.includes('Microsoft Zira') ||
          v.lang === 'en-US'
      );
      if (preferred) utterance.voice = preferred;

      synthRef.current.speak(utterance);
    } catch (e) {
      console.error('Speech synthesis failure:', e);
      setVoiceState('idle');
      if (isVoiceMode) {
        restartListening();
      }
    }
  }, [isVoiceMode]);

  // Stop active synthesis speaking
  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setVoiceState('idle');
  }, []);

  // Update selected project details
  useEffect(() => {
    if (selectedProjectId) {
      const p = projects.find((proj) => proj.id === selectedProjectId);
      setSelectedProject(p || null);
    } else {
      setSelectedProject(null);
    }
  }, [selectedProjectId, projects]);

  // Main sending handler
  const handleSend = async (messageToSend) => {
    const textMessage = typeof messageToSend === 'string' ? messageToSend : inputValue;
    if (!textMessage || textMessage.trim() === '' || isSending || isLimitReached) return;

    setIsSending(true);
    setInputValue('');
    setVoiceState('thinking');
    stopSpeaking();

    const userMsg = { role: 'user', content: textMessage, createdAt: new Date().toISOString() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textMessage,
          projectId: selectedProjectId || undefined,
          history: updatedMessages.slice(0, -1),
        }),
      });

      const data = await res.json();

      if (res.status === 403 && data.error === 'limit_reached') {
        setIsLimitReached(true);
        setGuestCount(data.count);
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: '⚠️ Free guest message limit reached. Please log in or sign up to continue.',
            createdAt: new Date().toISOString(),
          },
        ]);
        if (isVoiceMode) {
          speakResponse('Free message limit reached. Please log in to continue.');
          setIsVoiceMode(false);
        }
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to communicate with the assistant.');
      }

      const assistantMsg = {
        role: 'assistant',
        content: data.response,
        ragConfidence: data.ragConfidence,
        ragSources: data.ragSources,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setIsGuest(data.isGuest);
      if (data.isGuest) {
        setGuestCount(guestLimit - data.remainingMessages);
        if (data.remainingMessages === 0) {
          setIsLimitReached(true);
        }
      }

      // Read output aloud if voice mode active
      if (isVoiceMode) {
        speakResponse(data.response);
      } else {
        setVoiceState('idle');
      }

    } catch (error) {
      console.error('Chat routing error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ Error: ${error.message || 'Server connection failed.'}`,
          createdAt: new Date().toISOString(),
        },
      ]);
      setVoiceState('idle');
      if (isVoiceMode) {
        restartListening();
      }
    } finally {
      setIsSending(false);
    }
  };

  // Clear Chat History
  const handleClearHistory = async () => {
    if (isSending) return;
    if (isGuest) {
      setMessages([]);
      return;
    }
    if (!confirm('Are you sure you want to clear your conversation history? This cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch('/api/assistant', { method: 'DELETE' });
      if (res.ok) {
        setMessages([]);
        stopSpeaking();
      } else {
        alert('Failed to clear conversation history. Please try again.');
      }
    } catch (err) {
      console.error('Error clearing chat:', err);
    }
  };

  // Submit on Enter press
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Trigger quick action prompt chips
  const handleChipClick = (chipText) => {
    if (isSending || isLimitReached) return;
    let prependedPrompt = chipText;

    if (selectedProject) {
      if (chipText.includes('ATS score')) {
        prependedPrompt = `Analyze my ATS score of ${selectedProject.atsScore || 'N/A'}% and explain the primary keywords missing for my target role: "${selectedProject.jobTitle || ''}".`;
      } else if (chipText.includes('bullet point') || chipText.includes('bullet optimizer')) {
        prependedPrompt = `Review my experience bullet points from my "${selectedProject.jobTitle || ''}" project resume and rewrite them cleanly using the STAR methodology (Situation, Task, Action, Result) with bracketed metric placeholders.`;
      } else if (chipText.includes('keywords') || chipText.includes('missing keywords')) {
        prependedPrompt = `Identify the missing keywords from my resume relative to the target job description: "${selectedProject.jobDescription?.substring(0, 300) || ''}...".`;
      } else if (chipText.includes('interview')) {
        prependedPrompt = `Give me 3 realistic, blunt interview questions for a "${selectedProject.jobTitle || ''}" role at "${selectedProject.company || 'a top firm'}".`;
      }
    }

    handleSend(prependedPrompt);
  };

  // Beautiful math renderer formatter helper
  const formatMessageText = (text) => {
    if (!text) return '';

    // Clear raw LaTeX brackets that standard markdown engines fail to render
    let cleaned = text
      .replace(/\$\$([\s\S]*?)\$\$/g, '$1') // $$...$$
      .replace(/\\\[([\s\S]*?)\\\]/g, '$1') // \[...\]
      .replace(/\\\(([\s\S]*?)\\\)/g, '$1') // \(...\)
      .replace(/\\text\{([\s\S]*?)\}/g, '$1') // \text{...}
      .replace(/\\frac\{([\s\S]*?)\}\{([\s\S]*?)\}/g, '$1 / $2'); // \frac{...}{...}

    // Capture standard weight layouts and wrap in custom formula boxes
    const equationRegex = /(\*\*Score\*\*|\*\*ATS Score Breakdown\*\*|\*\*STAR Formula\*\*|\*\*Equation\*\*|\*\*Weight Breakdown\*\*)\s*=\s*([^.\n]+)/gi;
    if (equationRegex.test(cleaned)) {
      cleaned = cleaned.replace(equationRegex, (match, title, formula) => {
        return `\n\n<div class="math-formula-box">
          <div class="math-formula-title">📋 VERIFIED FORMULA MODEL</div>
          <div class="math-formula-body">${title} = ${formula}</div>
        </div>\n\n`;
      });
    }

    return cleaned;
  };

  return (
    <div className="assistant-container">
      {/* Workspace Panel Split */}
      <div className="assistant-workspace-grid">
        
        {/* LEFT PANEL: Project Scope & grounding guidelines */}
        <aside className="assistant-side-panel">
          <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <div>
              <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 800, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Sparkles size={20} className="text-gradient-icon" style={{ color: 'var(--color-accent)' }} />
                Workspace Context
              </h2>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-2)' }}>
                Equip the assistant with your parsed resume and targeted job postings to enable high-accuracy tailored optimization.
              </p>
            </div>

            {/* Resume selector */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="project-selector" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <FileText size={16} />
                Active Project
              </label>
              {session ? (
                isProjectsLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)' }}>
                    <Loader2 size={14} className="animate-spin" /> Loading projects...
                  </div>
                ) : (
                  <select
                     id="project-selector"
                     className="form-input"
                     value={selectedProjectId}
                     onChange={(e) => setSelectedProjectId(e.target.value)}
                     style={{ fontSize: 'var(--font-size-sm)' }}
                  >
                    <option value="">-- Generic Mode (No Resume) --</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.jobTitle || 'Untitled'} ({p.company || 'Generic'}) - {p.atsScore || 0}% ATS
                      </option>
                    ))}
                  </select>
                )
              ) : (
                <div style={{ padding: 'var(--space-3)', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <span>Guest Session: Active resume loading is gated.</span>
                  <Link href="/login" style={{ color: 'var(--color-accent)', fontWeight: '600', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    Log in to unlock resume awareness <LogIn size={10} />
                  </Link>
                </div>
              )}
            </div>

            {/* Render selected project metadata info card */}
            {selectedProject && (
              <div style={{ padding: 'var(--space-3)', background: 'var(--color-accent-light)', border: '1px solid rgba(79, 70, 229, 0.2)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: '700', color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Resume-Aware Activated
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: '600', color: 'var(--color-text-primary)' }}>
                    {selectedProject.jobTitle || 'N/A'}
                  </span>
                  <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: '700', padding: '2px 6px', background: 'var(--color-success-light)', color: 'var(--color-success)', borderRadius: '4px' }}>
                    {selectedProject.atsScore || 0}% ATS
                  </span>
                </div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                  Company: {selectedProject.company || 'Generic'}
                </div>
              </div>
            )}

            <hr style={{ border: '0', borderTop: '1px solid var(--color-border)', margin: 'var(--space-1) 0' }} />

            {/* RAG grounding statement */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: '700', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                <CheckCircle size={14} style={{ color: 'var(--color-success)' }} />
                Grounded Knowledge Base (RAG)
              </div>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
                ParserProof uses a hybrid vector-less RAG index. Every recommendation is cross-referenced with verified recruitment principles and parsed JDs. The assistant will refuse fabrication and note metric gaps explicitly to guarantee profile integrity.
              </p>
            </div>

            {/* Actions Panel */}
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {isGuest && (
                <div style={{ fontSize: 'var(--font-size-xs)', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontWeight: '600', color: 'var(--color-text-primary)' }}>
                    <span>Guest Interactivity</span>
                    <span>{guestCount} / {guestLimit}</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'var(--color-bg-tertiary)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ width: `${(guestCount / guestLimit) * 100}%`, height: '100%', background: guestCount >= guestLimit ? 'var(--color-danger)' : 'var(--color-accent)', transition: 'width 0.3s ease' }} />
                  </div>
                </div>
              )}
              
              <button
                className="btn btn-secondary"
                onClick={handleClearHistory}
                disabled={messages.length === 0 || isSending}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}
              >
                <Trash2 size={16} /> Reset Chat history
              </button>
            </div>
          </div>
        </aside>

        {/* RIGHT PANEL: Chat viewport and triggers */}
        <main className="assistant-main-chat" style={{ position: 'relative' }}>
          <div className="card" style={{ height: '100%', padding: '0', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
            
            {/* Upper control header */}
            <div style={{ padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-bg-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: isSending ? 'var(--color-accent)' : 'var(--color-success)', animation: isSending ? 'pulse 1.5s infinite' : 'none' }} />
                <div>
                  <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: '700', color: 'var(--color-text-primary)', margin: 0 }}>
                    ParserProof AI Co-Pilot
                  </h3>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                    {isSending ? 'Synthesizing response...' : 'Ready to analyze profile'}
                  </span>
                </div>
              </div>

              {/* Spoken feedback control switch */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                {speechRecognitionSupported && (
                  <button
                    onClick={() => setIsVoiceMode((prev) => !prev)}
                    className={`btn ${isVoiceMode ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '6px var(--space-3)', fontSize: 'var(--font-size-xs)', display: 'flex', alignItems: 'center', gap: '6px', height: 'auto' }}
                    title={isVoiceMode ? 'Disable Speech Output Mode' : 'Enable Unified Voice Conversational Loop'}
                  >
                    {isVoiceMode ? (
                      <>
                        <Volume2 size={14} className="wave-active-indicator" /> Voice Mode On
                      </>
                    ) : (
                      <>
                        <VolumeX size={14} /> Voice Mode Off
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Conversation Feed */}
            <div className="assistant-messages-feed" style={{ position: 'relative' }}>
              
              {/* MIC PERMISSION ERROR NOTICE */}
              {micPermissionError && (
                <div className="mic-error-notice animate-slide-in" style={{ position: 'sticky', top: 0, margin: '0 0 var(--space-4) 0', width: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', width: '100%' }}>
                    <AlertTriangle size={18} className="mic-error-icon" style={{ marginTop: '2px' }} />
                    <div style={{ flexGrow: 1 }}>
                      <div style={{ fontWeight: '700', fontSize: '12px' }}>Microphone Access Blocked</div>
                      <div style={{ fontSize: '10px', marginTop: '2px', lineHeight: '1.4', opacity: 0.9 }}>
                        To apply your microphone permission, the browser requires a page reload. Click the button below to reload and activate Voice Mode.
                      </div>
                    </div>
                    <button onClick={() => setMicPermissionError(false)} className="mic-error-close">
                      <X size={12} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                    <button 
                      onClick={() => window.location.reload()} 
                      className="btn-reload-mic"
                      style={{
                        background: 'rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      Reload Page
                    </button>
                  </div>
                </div>
              )}

              {isHistoryLoading ? (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-3)', color: 'var(--color-text-tertiary)' }}>
                  <Loader2 className="animate-spin" size={32} style={{ color: 'var(--color-accent)' }} />
                  <span>Retrieving secure conversation feed...</span>
                </div>
              ) : messages.length === 0 ? (
                <div style={{ height: '100%', padding: 'var(--space-8)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
                  <div className="landing-logo-icon" style={{ width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-accent-light)', color: 'var(--color-accent)', marginBottom: 'var(--space-4)' }}>
                    <Sparkles size={28} />
                  </div>
                  <h4 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '800', color: 'var(--color-text-primary)', marginBottom: 'var(--space-2)' }}>
                    Grounded AI Career Assistant
                  </h4>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', lineHeight: '1.6', marginBottom: 'var(--space-6)' }}>
                    Welcome! I am ParserProof's direct career coach. I use RAG to search verified recruitment schemas. I will never fabricate experience or achievements.
                  </p>
                  
                  {/* Starter action chips */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', width: '100%' }}>
                    {QUICK_CHIPS.map((chip, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleChipClick(chip.text)}
                        className="btn btn-secondary"
                        style={{ width: '100%', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px var(--space-4)', fontSize: 'var(--font-size-sm)' }}
                      >
                        <span>{chip.text}</span>
                        <Sparkles size={12} style={{ color: 'var(--color-accent)' }} />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', paddingBottom: 'var(--space-4)' }}>
                  {messages.map((msg, index) => {
                    const isUser = msg.role === 'user';
                    const formattedContent = formatMessageText(msg.content);
                    const containsHtmlMath = formattedContent.includes('math-formula-box');

                    return (
                      <div
                        key={index}
                        className={`chat-bubble-container ${isUser ? 'user' : 'assistant'}`}
                        style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', width: '100%' }}
                      >
                        <div
                          className={`chat-bubble ${isUser ? 'chat-bubble-user' : 'chat-bubble-assistant'}`}
                          style={{
                            maxWidth: '75%',
                            padding: 'var(--space-3) var(--space-4)',
                            borderRadius: 'var(--radius-lg)',
                            background: isUser ? 'var(--color-accent)' : 'var(--color-bg-secondary)',
                            color: isUser ? 'var(--color-text-inverse)' : 'var(--color-text-primary)',
                            border: isUser ? 'none' : '1px solid var(--color-border)',
                            boxShadow: 'var(--shadow-sm)',
                            fontSize: 'var(--font-size-sm)',
                            lineHeight: '1.5',
                            position: 'relative',
                          }}
                        >
                          {/* Parse math html blocks cleanly */}
                          {containsHtmlMath ? (
                            <div dangerouslySetInnerHTML={{ __html: formattedContent }} />
                          ) : (
                            <div style={{ whiteSpace: 'pre-line' }}>{formattedContent}</div>
                          )}

                          {/* Grounding context reference block (RAG) */}
                          {!isUser && msg.ragSources && msg.ragSources.length > 0 && (
                            <div style={{ marginTop: 'var(--space-3)', paddingTop: 'var(--space-2)', borderTop: '1px dashed var(--color-border)', fontSize: '10px', color: 'var(--color-text-tertiary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <div style={{ fontWeight: '700', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <CheckCircle size={10} /> Grounded references verified:
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                {msg.ragSources.map((source, sIdx) => (
                                  <span key={sIdx} style={{ background: 'var(--color-bg-tertiary)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                                    {source.title} ({source.category})
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* UNIFIED VOICE ACTIVE OVERLAY SCREEN */}
            {isVoiceMode && voiceState !== 'idle' && (
              <div className="popover-voice-overlay" style={{ inset: '65px 0 65px 0' }}>
                <div className="voice-overlay-content">
                  
                  {/* Wave graphics dynamically sized by active state */}
                  <div className={`voice-radar-pulse ${voiceState}`}>
                    <div className="pulse-circle c1" />
                    <div className="pulse-circle c2" />
                    <div className="pulse-core">
                      {voiceState === 'listening' ? <Mic size={24} /> : <Volume2 size={24} />}
                    </div>
                  </div>

                  <div className="voice-state-text">
                    {voiceState === 'listening' && 'Listening to your voice...'}
                    {voiceState === 'thinking' && 'Analyzing grounding RAG guidelines...'}
                    {voiceState === 'speaking' && 'Synthesizing voice response...'}
                  </div>

                  {voiceState === 'speaking' && (
                    <button
                      onClick={() => {
                        stopSpeaking();
                        restartListening();
                      }}
                      className="btn btn-secondary"
                      style={{ padding: '6px 16px', fontSize: '11px', height: 'auto', borderRadius: '20px' }}
                    >
                      Skip Audio
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Quick Prompt Action Chips */}
            {messages.length > 0 && !isLimitReached && !isVoiceMode && (
              <div className="assistant-chips-bar" style={{ display: 'flex', gap: 'var(--space-2)', padding: 'var(--space-2) var(--space-4)', borderTop: '1px solid var(--color-border)', overflowX: 'auto', background: 'var(--color-bg-secondary)', scrollbarWidth: 'none' }}>
                {QUICK_CHIPS.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleChipClick(chip.text)}
                    disabled={isSending}
                    className="btn btn-secondary"
                    style={{
                      padding: '4px 10px',
                      borderRadius: '99px',
                      fontSize: '11px',
                      whiteSpace: 'nowrap',
                      height: 'auto',
                      fontWeight: '600',
                      flexShrink: 0,
                    }}
                  >
                    {chip.text}
                  </button>
                ))}
              </div>
            )}

            {/* Input submission container */}
            <div style={{ padding: 'var(--space-4) var(--space-6)', borderTop: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)', display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
              
              {/* Mic transcription button */}
              {speechRecognitionSupported && !isVoiceMode && (
                <button
                  onClick={() => setIsVoiceMode(true)}
                  disabled={isSending || isLimitReached}
                  className="btn btn-secondary"
                  style={{ padding: 'var(--space-3)', borderRadius: '50%', flexShrink: 0, width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Start Voice Conversational Loop"
                >
                  <Mic size={18} />
                </button>
              )}

              {/* Text Input area */}
              <input
                type="text"
                className="form-input"
                placeholder={isVoiceMode ? 'Voice Mode Active... Speak now' : 'Ask about ATS structure, resume gap optimizations...'}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSending || isLimitReached || isVoiceMode}
                style={{ flexGrow: 1, margin: 0, height: '42px', fontSize: 'var(--font-size-sm)' }}
                autoComplete="off"
              />

              {/* Send Button */}
              <button
                className="btn btn-primary"
                onClick={() => handleSend()}
                disabled={isSending || !inputValue.trim() || isLimitReached || isVoiceMode}
                style={{ padding: '0 var(--space-4)', height: '42px', borderRadius: 'var(--radius-md)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
              >
                {isSending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <Send size={16} /> <span className="desktop-only">Send</span>
                  </>
                )}
              </button>
            </div>

            {/* GUEST LIMIT OVERLAY GATING */}
            {isLimitReached && (
              <div className="assistant-lock-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(6px)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)' }}>
                <div className="card" style={{ maxWidth: '440px', textAlign: 'center', padding: 'var(--space-8)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-xl)', background: 'var(--color-bg-primary)', transform: 'translateY(0)', animation: 'slideIn 0.3s ease-out' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-4) auto' }}>
                    <AlertTriangle size={32} />
                  </div>
                  <h3 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '800', color: 'var(--color-text-primary)', marginBottom: 'var(--space-2)' }}>
                    Assistant Message Limit Reached
                  </h3>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', lineHeight: '1.6', marginBottom: 'var(--space-6)' }}>
                    You have utilized all <strong>{guestLimit} free guest interactions</strong>. Sign up for a free account to unlock unlimited grounded conversations, live resume tailoring, and interview simulations.
                  </p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <Link href="/signup" className="btn btn-primary" style={{ width: '100%', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <UserPlus size={16} /> Sign Up Free
                    </Link>
                    <Link href="/login" className="btn btn-secondary" style={{ width: '100%', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <LogIn size={16} /> Log In
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

      </div>
    </div>
  );
}
