'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  MessageSquare,
  Sparkles,
  X,
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
} from 'lucide-react';

const QUICK_CHIPS = [
  { text: 'Explain my ATS score', type: 'ats' },
  { text: 'Find keyword gaps', type: 'keywords' },
  { text: 'STAR bullet optimizer', type: 'bullet' },
  { text: 'Prepare interview questions', type: 'interview' },
];

export default function FloatingAssistant() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  // Widget visibility states
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Chat conversation states
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
  const [micErrorType, setMicErrorType] = useState('blocked'); // 'blocked' | 'not-found' | 'busy' | 'service-unavailable' | 'generic'
  const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState(false);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  const speakTimeoutRef = useRef(null);
  const chatBodyRef = useRef(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, scrollToBottom]);

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
      console.error('[Floating Co-Pilot] Failed to load chat history:', err);
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
        
        // Context Awareness: If active pathname contains results page /results/[id], auto-select it!
        if (pathname && pathname.startsWith('/results/')) {
          const pathParts = pathname.split('/');
          const projectId = pathParts[pathParts.length - 1];
          if (projectId) {
            const matchedProject = data.projects.find(p => p.id === projectId);
            if (matchedProject) {
              setSelectedProjectId(matchedProject.id);
            }
          }
        }
      }
    } catch (err) {
      console.error('[Floating Co-Pilot] Failed to fetch projects:', err);
    } finally {
      setIsProjectsLoading(false);
    }
  }, [session, pathname]);

  // Handle URL navigation checks to sync project selection dynamically
  useEffect(() => {
    if (projects.length > 0 && pathname && pathname.startsWith('/results/')) {
      const pathParts = pathname.split('/');
      const projectId = pathParts[pathParts.length - 1];
      if (projectId) {
        const matchedProject = projects.find(p => p.id === projectId);
        if (matchedProject) {
          setSelectedProjectId(matchedProject.id);
        }
      }
    }
  }, [pathname, projects]);

  // Bootup hooks
  useEffect(() => {
    fetchChatHistory();
    fetchProjects();

    // Check for web speech APIs support
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
            handleSend(resultText);
          }
        };

        rec.onerror = (e) => {
          console.error('[Floating Co-Pilot] Speech recognition error:', e);
          if (e.error === 'not-allowed' || e.error === 'permission-denied') {
            // Validate the actual hardware status using the HTML5 mediaDevices standard
            if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
              navigator.mediaDevices.getUserMedia({ audio: true })
                .then((stream) => {
                  // getUserMedia succeeded! The microphone is actually allowed, but Chrome's cloud Speech engine failed
                  stream.getTracks().forEach(track => track.stop());
                  setMicErrorType('service-unavailable');
                  setMicPermissionError(true);
                  setIsVoiceMode(false);
                  setVoiceState('idle');
                })
                .catch((err) => {
                  // getUserMedia failed! Let's categorize the exact exception
                  setIsVoiceMode(false);
                  setVoiceState('idle');
                  if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    setMicErrorType('blocked');
                  } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                    setMicErrorType('not-found');
                  } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                    setMicErrorType('busy');
                  } else {
                    setMicErrorType('generic');
                  }
                  setMicPermissionError(true);
                });
            } else {
              setMicErrorType('blocked');
              setMicPermissionError(true);
              setIsVoiceMode(false);
              setVoiceState('idle');
            }
          } else {
            // Restart listening if we are still in voice mode
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

  // React to voice mode state modifications
  useEffect(() => {
    if (!recognitionRef.current) return;
    if (isVoiceMode) {
      setMicPermissionError(false);
      
      const startRec = () => {
        try {
          recognitionRef.current.start();
        } catch (err) {
          console.warn('[Floating Co-Pilot] Recognition start error:', err);
        }
      };

      if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then((stream) => {
            // Instantly release microphone lock so SpeechRecognition can acquire it cleanly
            stream.getTracks().forEach(track => track.stop());
            setMicPermissionError(false);
            startRec();
          })
          .catch((err) => {
            console.error('[Floating Co-Pilot] getUserMedia permission error:', err);
            setIsVoiceMode(false);
            setVoiceState('idle');
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
              setMicErrorType('blocked');
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
              setMicErrorType('not-found');
            } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
              setMicErrorType('busy');
            } else {
              setMicErrorType('generic');
            }
            setMicPermissionError(true);
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

  // Restart Speech Recognition listening cleanly
  const restartListening = () => {
    if (!recognitionRef.current || !isVoiceMode) return;
    try {
      recognitionRef.current.stop();
    } catch (e) {}
    
    // Slight delay to prevent overlapping start failures
    setTimeout(() => {
      if (isVoiceMode) {
        try {
          recognitionRef.current.start();
        } catch (err) {
          console.warn('[Floating Co-Pilot] Mic restart failed:', err);
        }
      }
    }, 400);
  };

  // Speaks response aloud
  const speakResponse = useCallback((text) => {
    if (!isVoiceMode || !synthRef.current) return;
    try {
      synthRef.current.cancel(); // cut off lingering speech
      setVoiceState('speaking');

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 1.05;

      utterance.onend = () => {
        setVoiceState('idle');
        // Once Speaking is finished, auto-loop back to listening!
        if (isVoiceMode) {
          restartListening();
        }
      };

      utterance.onerror = (e) => {
        console.error('[Floating Co-Pilot] Utterance error:', e);
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
      console.error('[Floating Co-Pilot] TTS Synthesis failed:', e);
      setVoiceState('idle');
      if (isVoiceMode) {
        restartListening();
      }
    }
  }, [isVoiceMode]);

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
    if (synthRef.current) {
      synthRef.current.cancel();
    }

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
      console.error('[Floating Co-Pilot] Send error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ Connection failure: ${error.message || 'Server did not respond.'}`,
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

  // Clear chat logs
  const handleClearHistory = async () => {
    if (isSending) return;
    if (isGuest) {
      setMessages([]);
      return;
    }
    if (!confirm('Clear chat history? This resets database records.')) {
      return;
    }

    try {
      const res = await fetch('/api/assistant', { method: 'DELETE' });
      if (res.ok) {
        setMessages([]);
        if (synthRef.current) synthRef.current.cancel();
        setVoiceState('idle');
      }
    } catch (err) {
      console.error('[Floating Co-Pilot] Clear history failed:', err);
    }
  };

  // Submit on enter
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle Quick chip clicks
  const handleChipClick = (chipText) => {
    if (isSending || isLimitReached) return;
    let prependedPrompt = chipText;

    if (selectedProject) {
      if (chipText.includes('ATS score')) {
        prependedPrompt = `Explain my ATS score of ${selectedProject.atsScore || 0}% for the targeted "${selectedProject.jobTitle || 'Role'}" position. What should I prioritize to improve?`;
      } else if (chipText.includes('keyword gaps')) {
        prependedPrompt = `Identify the missing keywords from my resume relative to my target job: "${selectedProject.jobTitle || 'Role'}" at "${selectedProject.company || 'Company'}".`;
      } else if (chipText.includes('bullet optimizer')) {
        prependedPrompt = `Please pick one of my experience bullet points and rewrite it using the STAR Google XYZ format, adding metric placeholders.`;
      } else if (chipText.includes('interview')) {
        prependedPrompt = `Generate 3 role-specific interview preparation questions for my active project: "${selectedProject.jobTitle || 'Role'}".`;
      }
    }

    handleSend(prependedPrompt);
  };

  // Render text content and parse LaTeX / mathematical structures beautifully
  const formatMessageText = (text) => {
    if (!text) return '';

    // Regex to clear raw LaTeX delimiters that standard markdown cannot render
    let cleaned = text
      .replace(/\$\$([\s\S]*?)\$\$/g, '$1') // $$...$$
      .replace(/\\\[([\s\S]*?)\\\]/g, '$1') // \[...\]
      .replace(/\\\(([\s\S]*?)\\\)/g, '$1') // \(...\)
      .replace(/\\text\{([\s\S]*?)\}/g, '$1') // \text{...}
      .replace(/\\frac\{([\s\S]*?)\}\{([\s\S]*?)\}/g, '$1 / $2'); // \frac{...}{...}

    // Capture inline mathematical weight models and wrap them in high-contrast styled formula boxes
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

  // Open popover and mark unread as cleared
  const togglePopover = () => {
    setIsOpen(!isOpen);
    setUnreadCount(0);
  };

  // Don't render the FAB inside the main standalone assistant page to prevent overlay redundancy
  if (pathname === '/assistant') {
    return null;
  }

  return (
    <div className="floating-assistant-container" style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000, fontFamily: 'var(--font-inter), sans-serif' }}>
      
      {/* FLOATING ACTION TRIGGER BUTTON (FAB) */}
      <button
        onClick={togglePopover}
        className={`floating-assistant-fab ${isOpen ? 'active' : ''}`}
        title="Open ParserProof Co-Pilot"
      >
        {isOpen ? (
          <X size={22} />
        ) : (
          <>
            <Sparkles size={22} className="fab-sparkles-icon" />
            {unreadCount > 0 && <span className="fab-unread-badge">{unreadCount}</span>}
          </>
        )}
      </button>

      {/* CHAT POPOVER WINDOW */}
      {isOpen && (
        <div className="floating-assistant-popover">
          <div className="popover-card">
            
            {/* Popover Header */}
            <div className="popover-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="popover-logo-icon">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h4 className="popover-title">ParserProof Co-Pilot</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span className={`status-orb ${isSending ? 'thinking' : 'online'}`} />
                    <span className="popover-subtitle">
                      {isSending ? 'Generating context...' : 'Grounded RAG Guard active'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Header Right Action: Unified Voice Mode Switch */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {speechRecognitionSupported && (
                  <button
                    onClick={() => setIsVoiceMode(prev => !prev)}
                    className={`btn-voice-mode ${isVoiceMode ? 'active' : ''}`}
                    title={isVoiceMode ? 'Disable Voice Mode' : 'Enable Unified Hands-Free Voice Mode'}
                  >
                    {isVoiceMode ? (
                      <>
                        <Volume2 size={13} className="wave-active-indicator" />
                        <span className="voice-mode-txt">Voice On</span>
                      </>
                    ) : (
                      <>
                        <VolumeX size={13} />
                        <span className="voice-mode-txt">Voice Off</span>
                      </>
                    )}
                  </button>
                )}
                
                <button onClick={togglePopover} className="popover-close-btn">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Resume-Aware Project Context Selector */}
            {session && projects.length > 0 && (
              <div className="popover-context-bar">
                <FileText size={12} className="context-icon" />
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="popover-context-select"
                >
                  <option value="">-- Generic Career Coach Mode --</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      Focus Resume: {p.jobTitle || 'Untitled'} ({p.atsScore || 0}% ATS)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Chat Body viewport */}
            <div ref={chatBodyRef} className="popover-chat-body">
              
              {/* MIC PERMISSION ERROR NOTICE */}
              {micPermissionError && (
                <div className="mic-error-notice animate-slide-in" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <AlertTriangle size={18} className="mic-error-icon" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div style={{ flexGrow: 1 }}>
                      <div style={{ fontWeight: '700', fontSize: '12px' }}>
                        {micErrorType === 'blocked' && 'Microphone Access Blocked'}
                        {micErrorType === 'not-found' && 'No Microphone Detected'}
                        {micErrorType === 'busy' && 'Microphone is Busy'}
                        {micErrorType === 'service-unavailable' && 'Speech Service Unavailable'}
                        {micErrorType === 'generic' && 'Microphone Connection Error'}
                      </div>
                      <div style={{ fontSize: '10px', marginTop: '2px', lineHeight: '1.4', opacity: 0.9 }}>
                        {micErrorType === 'blocked' && 'To unblock Voice Mode, click the Lock icon in your browser address bar and enable microphone permissions, then reload.'}
                        {micErrorType === 'not-found' && 'No physical microphone was detected. Please plug in a mic or check your system audio input device settings.'}
                        {micErrorType === 'busy' && 'Your microphone is locked by another program (e.g. Zoom, Teams, Discord, or another tab). Close other audio apps and try again.'}
                        {micErrorType === 'service-unavailable' && 'Browser permission is allowed, but the browser speech recognition engine is unresponsive or offline. Please type instead!'}
                        {micErrorType === 'generic' && 'An error occurred while establishing a hardware connection with your mic. Check your operating system settings.'}
                      </div>
                    </div>
                    <button onClick={() => setMicPermissionError(false)} className="mic-error-close">
                      <X size={12} />
                    </button>
                  </div>
                  {micErrorType === 'blocked' && (
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
                  )}
                </div>
              )}

              {isHistoryLoading ? (
                <div className="chat-body-loader">
                  <Loader2 className="animate-spin" size={24} style={{ color: 'var(--color-accent)' }} />
                  <span>Loading history...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="chat-body-welcome">
                  <div className="welcome-avatar">
                    <Sparkles size={24} />
                  </div>
                  <h5>AI Assistant Pop-Up</h5>
                  <p>
                    I am your grounded career coach. Send a question below, or select a resume project to automatically align my advice with your background!
                  </p>

                  <div className="welcome-chips">
                    {QUICK_CHIPS.map((chip, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleChipClick(chip.text)}
                        className="welcome-chip"
                      >
                        {chip.text}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {messages.map((msg, index) => {
                    const isUser = msg.role === 'user';
                    const formattedContent = formatMessageText(msg.content);
                    const containsHtmlMath = formattedContent.includes('math-formula-box');

                    return (
                      <div key={index} className={`popover-bubble-row ${isUser ? 'user' : 'assistant'}`}>
                        <div
                          className={`popover-bubble ${isUser ? 'user' : 'assistant'}`}
                          style={{ boxShadow: 'var(--shadow-sm)' }}
                        >
                          {/* Parse math html blocks cleanly */}
                          {containsHtmlMath ? (
                            <div dangerouslySetInnerHTML={{ __html: formattedContent }} />
                          ) : (
                            <div style={{ whiteSpace: 'pre-line' }}>{formattedContent}</div>
                          )}

                          {/* Grounding context info tags */}
                          {!isUser && msg.ragSources && msg.ragSources.length > 0 && (
                            <div className="popover-bubble-grounding">
                              <span className="grounding-header">✓ Source Grounded:</span>
                              <span className="grounding-title">
                                {msg.ragSources.map(s => s.title).join(', ')}
                              </span>
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

            {/* UNIFIED VOICE ACTIVE INDICATOR WAVE OVERLAY */}
            {isVoiceMode && voiceState !== 'idle' && (
              <div className="popover-voice-overlay">
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
                        if (synthRef.current) synthRef.current.cancel();
                        setVoiceState('idle');
                        restartListening();
                      }}
                      className="btn btn-secondary"
                      style={{ padding: '4px 12px', fontSize: '10px', height: 'auto', borderRadius: '20px' }}
                    >
                      Skip Audio
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Quick chips bar when active conversation is streaming */}
            {messages.length > 0 && !isLimitReached && !isVoiceMode && (
              <div className="popover-chips-slider">
                {QUICK_CHIPS.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleChipClick(chip.text)}
                    disabled={isSending}
                    className="popover-slider-chip"
                  >
                    {chip.text}
                  </button>
                ))}
              </div>
            )}

            {/* Popover Footer Input Section */}
            <div className="popover-footer">
              <div style={{ display: 'flex', gap: '8px', width: '100%', alignItems: 'center' }}>
                
                {/* Micro-microphone button inside footbar */}
                {speechRecognitionSupported && (
                  isVoiceMode ? (
                    <button
                      onClick={() => setIsVoiceMode(false)}
                      className="popover-mic-btn active"
                      title="Stop Voice Mode"
                    >
                      <MicOff size={16} />
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsVoiceMode(true)}
                      disabled={isSending || isLimitReached}
                      className="popover-mic-btn"
                      title="Start Voice Mode"
                    >
                      <Mic size={16} />
                    </button>
                  )
                )}

                <input
                  type="text"
                  placeholder={
                    isSending 
                      ? 'Thinking...' 
                      : isVoiceMode 
                        ? 'Voice Mode active... Speak now' 
                        : 'Ask your optimization question...'
                  }
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isSending || isLimitReached || isVoiceMode}
                  className="popover-text-input"
                  autoComplete="off"
                />

                <button
                  onClick={() => handleSend()}
                  disabled={isSending || !inputValue.trim() || isLimitReached || isVoiceMode}
                  className="popover-send-btn"
                >
                  {isSending ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                </button>
              </div>

              {/* Guest message counter panel */}
              {isGuest && (
                <div className="popover-guest-meter">
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <span>Free anonymous interactions</span>
                    <span>{guestCount} / {guestLimit}</span>
                  </div>
                  <div className="guest-meter-track">
                    <div
                      className="guest-meter-bar"
                      style={{
                        width: `${(guestCount / guestLimit) * 100}%`,
                        background: guestCount >= guestLimit ? 'var(--color-danger)' : 'var(--color-accent)',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* GUEST LIMIT OVERLAY SCREEN */}
            {isLimitReached && (
              <div className="popover-lock-overlay">
                <div className="popover-lock-card">
                  <AlertTriangle size={24} style={{ color: 'var(--color-danger)', marginBottom: '8px' }} />
                  <h6>Limit Reached</h6>
                  <p>
                    You have finished your **{guestLimit} free guest messages**. Sign up for a free account to unlock unlimited grounded RAG analysis.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', marginTop: '4px' }}>
                    <Link href="/signup" className="btn btn-primary" style={{ width: '100%', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', padding: '6px 12px', height: 'auto' }}>
                      <UserPlus size={12} style={{ marginRight: '4px' }} /> Sign Up Free
                    </Link>
                    <Link href="/login" className="btn btn-secondary" style={{ width: '100%', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', padding: '6px 12px', height: 'auto' }}>
                      <LogIn size={12} style={{ marginRight: '4px' }} /> Log In
                    </Link>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
