'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload,
  FileText,
  X,
  Sparkles,
  Loader2,
  CheckCircle2,
  Circle,
  AlertCircle,
} from 'lucide-react';

const TONE_OPTIONS = [
  {
    value: 'professional',
    label: 'Professional',
    desc: 'Polished and accomplishment-focused',
  },
  {
    value: 'confident',
    label: 'Confident',
    desc: 'Assertive with leadership emphasis',
  },
  {
    value: 'concise',
    label: 'Concise',
    desc: 'Direct and high-impact',
  },
  {
    value: 'fresh-graduate',
    label: 'Fresh Graduate',
    desc: 'Entry-level with potential focus',
  },
];

const LENGTH_OPTIONS = [
  { value: 'short', label: 'Short', desc: 'Brief and focused' },
  { value: 'standard', label: 'Standard', desc: 'Balanced coverage' },
  { value: 'detailed', label: 'Detailed', desc: 'Comprehensive detail' },
];

const GENERATION_STEPS = [
  'Analyzing resume structure & hierarchy',
  'Simulating ATS parser screening filters',
  'Extracting core skills & job description keywords',
  'Mapping experience alignment & keyword density gaps',
  'Optimizing experience bullet points with grounded STAR metrics',
  'Drafting tailored, high-trust cover letter',
  'Synthesizing predictive interview prep questions',
  'Securing and preparing your high-accuracy resume download',
];

const CONSOLE_LOGS_BY_STEP = {
  0: [
    { tag: 'sys', msg: 'Initializing multi-pass AI optimization engine...' },
    { tag: 'parse', msg: 'Running structural parser: detecting resume layout and sections...' },
    { tag: 'parse', msg: 'Found sections: Summary, Experience, Education, Skills.' },
    { tag: 'parse', msg: 'Normalizing margins and layout alignments to ensure high-accuracy parser readability.' },
  ],
  1: [
    { tag: 'ats', msg: 'Simulating automated ATS parser screening filters...' },
    { tag: 'ats', msg: 'Loading Taleo, Workday, and Greenhouse emulation matrices...' },
    { tag: 'ats', msg: 'Validating contact blocks: phone, email, and LinkedIn links successfully mapped.' },
    { tag: 'ats', msg: 'Ensuring zero text box, table, or header wrapping issues detected.' },
  ],
  2: [
    { tag: 'jd', msg: 'Scanning job description block for core requirements...' },
    { tag: 'jd', msg: 'Running NLP parser: mining high-relevance technical skills and methodologies...' },
    { tag: 'jd', msg: 'Identified primary technologies and strategic competencies in JD.' },
  ],
  3: [
    { tag: 'align', msg: 'Evaluating keyword density overlaps and identifying compliance gaps...' },
    { tag: 'align', msg: 'Initial ATS compatibility score calculated at 38%.' },
    { tag: 'align', msg: 'Flagged missing exact-match skills from experience bullet points.' },
  ],
  4: [
    { tag: 'star', msg: 'Optimizing professional experience bullets using STAR method / XYZ formulas...' },
    { tag: 'star', msg: 'Formulating impactful accomplishments using active, high-trust power verbs.' },
    { tag: 'star', msg: 'Enforcing zero-fabrication safety compliance: maintaining absolute factual accuracy.' },
    { tag: 'star', msg: 'Drafted 3-5 grounded achievement bullet blocks per job role.' },
  ],
  5: [
    { tag: 'letter', msg: 'Drafting tailored, high-trust cover letter aligned to target vacancy...' },
    { tag: 'letter', msg: 'Connecting candidate highlights directly to critical job description responsibilities...' },
    { tag: 'letter', msg: 'Securing clean professional cover letter styling.' },
  ],
  6: [
    { tag: 'coach', msg: 'Synthesizing predictive mock-interview prep questions...' },
    { tag: 'coach', msg: 'Constructing 8 strategic situational and behavioral questions...' },
    { tag: 'coach', msg: 'Mapping high-value response hints based strictly on candidate background.' },
  ],
  7: [
    { tag: 'build', msg: 'Running final verification sweep over compiled optimization package...' },
    { tag: 'build', msg: 'Injecting print-optimized font structures (Inter & Lora)...' },
    { tag: 'build', msg: 'Securing download assemblies... All systems ready.' },
  ],
};

export default function NewProjectPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [tone, setTone] = useState('professional');
  const [length, setLength] = useState('standard');
  const [inputMethod, setInputMethod] = useState('paste');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [projectResult, setProjectResult] = useState(null);
  const [errors, setErrors] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const [logs, setLogs] = useState([]);
  const [percent, setPercent] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const consoleEndRef = useRef(null);

  // Animate through the premium optimization steps
  useEffect(() => {
    if (!isGenerating) {
      setGenerationStep(0);
      return;
    }

    const interval = setInterval(() => {
      setGenerationStep((prev) => {
        const nextStep = prev + 1;
        if (nextStep >= GENERATION_STEPS.length) {
          clearInterval(interval);
          return prev;
        }
        return nextStep;
      });
    }, 3500); // 3.5 seconds per step, total ~28 seconds of high-fidelity deliberate optimization

    return () => clearInterval(interval);
  }, [isGenerating]);

  // Append console logs with small realistic delays within each step
  useEffect(() => {
    if (!isGenerating) {
      setLogs([]);
      return;
    }

    const stepLogs = CONSOLE_LOGS_BY_STEP[generationStep] || [];
    let timeouts = [];

    stepLogs.forEach((log, index) => {
      const delay = index * 700; // print lines dynamically with sub-second spacing
      const timeout = setTimeout(() => {
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLogs((prev) => [...prev, { ...log, timestamp }]);
      }, delay);
      timeouts.push(timeout);
    });

    return () => timeouts.forEach(clearTimeout);
  }, [generationStep, isGenerating]);

  // Scroll terminal logs to bottom automatically
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Smooth percent tick-up animations mapped to active steps
  useEffect(() => {
    if (!isGenerating) {
      setPercent(0);
      return;
    }

    let target = Math.min(95, Math.round(((generationStep + 1) / GENERATION_STEPS.length) * 95));
    if (generationStep === GENERATION_STEPS.length - 1 && projectResult) {
      target = 100;
    }

    const interval = setInterval(() => {
      setPercent((prev) => {
        if (prev < target) {
          return prev + 1;
        }
        if (prev > target) {
          return prev - 1;
        }
        clearInterval(interval);
        return prev;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [generationStep, isGenerating, projectResult]);

  // Count elapsed seconds during active generation
  useEffect(() => {
    if (!isGenerating) {
      setElapsed(0);
      return;
    }
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isGenerating]);

  // Once the final step has finished AND we have the generated project result, redirect to results page
  useEffect(() => {
    if (generationStep === GENERATION_STEPS.length - 1 && projectResult && percent === 100) {
      const timeout = setTimeout(() => {
        router.push(`/results/${projectResult.id}`);
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [generationStep, projectResult, percent, router]);

  const handleFileUpload = useCallback(async (file) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size exceeds 5MB limit');
      return;
    }

    const allowedTypes = ['application/pdf', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Only PDF and TXT files are supported');
      return;
    }

    setUploadError('');
    setUploadedFile(file);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/resume/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setUploadError(data.error || 'Failed to process file');
        setUploadedFile(null);
        return;
      }

      setResumeText(data.text);
    } catch {
      setUploadError('Failed to upload file. Please try again.');
      setUploadedFile(null);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileUpload(file);
    },
    [handleFileUpload]
  );

  const handleFileInputChange = useCallback(
    (e) => {
      const file = e.target.files[0];
      if (file) handleFileUpload(file);
    },
    [handleFileUpload]
  );

  const removeFile = useCallback(() => {
    setUploadedFile(null);
    setResumeText('');
    setUploadError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const validate = () => {
    const newErrors = {};

    if (!resumeText || resumeText.trim().length < 50) {
      newErrors.resumeText =
        'Resume text must be at least 50 characters. Please paste or upload your resume.';
    } else if (resumeText.trim().length > 50000) {
      newErrors.resumeText =
        'Resume text must be at most 50,000 characters.';
    }

    if (!jobDescription || jobDescription.trim().length < 50) {
      newErrors.jobDescription =
        'Job description must be at least 50 characters. Please paste the full job posting.';
    } else if (jobDescription.trim().length > 50000) {
      newErrors.jobDescription =
        'Job description must be at most 50,000 characters.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGenerate = async () => {
    if (!validate()) return;

    setIsGenerating(true);
    setGenerationStep(0);
    setProjectResult(null);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText: resumeText.trim(),
          jobDescription: jobDescription.trim(),
          jobTitle: jobTitle.trim(),
          company: company.trim(),
          tone,
          length,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Generation failed');
      }

      setProjectResult(data.project);
    } catch (err) {
      setIsGenerating(false);
      setGenerationStep(0);
      setProjectResult(null);
      setErrors({ general: err.message });
    }
  };

  if (isGenerating) {
    const strokeDashoffset = 283 - (283 * percent) / 100;

    return (
      <div className="page-content" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div className="generation-loading-container">
          {/* Left Panel: Checklist & Progress Meter */}
          <div className="generation-left-panel">
            <div className="generation-progress-circle-wrapper">
              <div className="generation-progress-circle">
                <svg>
                  <circle className="bg" cx="55" cy="55" r="45" />
                  <circle
                    className="fg"
                    cx="55"
                    cy="55"
                    r="45"
                    style={{ strokeDashoffset }}
                  />
                </svg>
                <div className="generation-progress-text">{percent}%</div>
              </div>
            </div>

            <h1 className="generation-loading-title">
              Deliberate Multi-Pass Optimization
            </h1>
            <p className="generation-loading-subtitle">
              Running deep structural scans, keyword enrichment, and STAR bullet optimizations. This process is engineered for near-perfect results and will take approximately 30 seconds.
            </p>

            <div className="generation-steps">
              {GENERATION_STEPS.map((step, index) => {
                let stepClass = 'generation-step';
                if (index < generationStep) stepClass += ' done';
                else if (index === generationStep) stepClass += ' active';

                return (
                  <div key={step} className={stepClass}>
                    {index < generationStep ? (
                      <CheckCircle2 size={16} />
                    ) : index === generationStep ? (
                      <Loader2 size={16} className="loader-spinner" style={{ animation: 'spin 1.2s linear infinite' }} />
                    ) : (
                      <Circle size={16} />
                    )}
                    <span>{step}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Futuristic Animated Compass Radar Scanner */}
          <div className="generation-right-panel radar-panel">
            <div className="generation-console-header">
              <div className="generation-console-dots">
                <div className="generation-console-dot red" />
                <div className="generation-console-dot yellow" />
                <div className="generation-console-dot green" />
              </div>
              <div style={{ fontWeight: 600, letterSpacing: '0.05em', color: '#818cf8' }}>
                DEEP RADAR SCANNER
              </div>
              <div className="radar-version">v2.5.0</div>
            </div>
            <div className="radar-scanning-viewport">
              <div className="radar-scanner-container">
                {/* SVG Concentric Radar Compass Rings & Sweep */}
                 <svg className="radar-svg" viewBox="0 0 200 200">
                  <defs>
                    <linearGradient id="radarSweepGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {/* Concentric grid rings */}
                  <circle cx="100" cy="100" r="90" className="radar-grid-ring outer" />
                  <circle cx="100" cy="100" r="65" className="radar-grid-ring middle" />
                  <circle cx="100" cy="100" r="40" className="radar-grid-ring inner" />
                  
                  {/* Cardinal Axis gridlines */}
                  <line x1="10" y1="100" x2="190" y2="100" className="radar-grid-axis" />
                  <line x1="100" y1="10" x2="100" y2="190" className="radar-grid-axis" />
                  <line x1="36.36" y1="36.36" x2="163.64" y2="163.64" className="radar-grid-axis diagonal" />
                  <line x1="36.36" y1="163.64" x2="163.64" y2="36.36" className="radar-grid-axis diagonal" />

                  {/* Dynamic pulsing active keyword blips (positioned staggered around rings) */}
                  <circle cx="65" cy="65" className="radar-blip blip-1" r="3.5" />
                  <circle cx="140" cy="80" className="radar-blip blip-2" r="4" />
                  <circle cx="85" cy="135" className="radar-blip blip-3" r="3" />
                  <circle cx="130" cy="140" className="radar-blip blip-4" r="3.5" />
                  <circle cx="100" cy="45" className="radar-blip blip-5" r="4" />

                  {/* Rotating Sweeper vector line */}
                  <g className="radar-sweep-group">
                    <line x1="100" y1="100" x2="100" y2="10" className="radar-sweep-line" />
                    <polygon points="100,100 100,10 125,18" className="radar-sweep-gradient" />
                  </g>

                  {/* Pulsing Central Core */}
                  <circle cx="100" cy="100" r="16" className="radar-core-pulse-outer" />
                  <circle cx="100" cy="100" r="11" className="radar-core-pulse-inner" />
                </svg>
                
                {/* Central Core Icon overlay */}
                <div className="radar-core-icon">
                  <Sparkles size={12} className="radar-sparkle-spin" />
                </div>
              </div>

              {/* Dynamic Telemetry Feedback Area */}
              <div className="radar-telemetry-panel">
                <div className="radar-active-status-capsule">
                  <span className="radar-status-dot green" />
                  <span className="radar-status-text">
                    {GENERATION_STEPS[generationStep]}
                  </span>
                </div>

                <div className="radar-digital-readouts">
                  <div className="telemetry-stat">
                    <span className="stat-label">ELAPSED TIMER</span>
                    <span className="stat-value font-mono">
                      00:{elapsed < 10 ? `0${elapsed}` : elapsed}s
                    </span>
                  </div>
                  <div className="telemetry-separator" />
                  <div className="telemetry-stat">
                    <span className="stat-label">ATS CONFIDENCE</span>
                    <span className="stat-value font-mono">
                      {Math.min(99.8, 92.4 + (generationStep * 0.9) + (elapsed * 0.05)).toFixed(1)}%
                    </span>
                  </div>
                  <div className="telemetry-separator" />
                  <div className="telemetry-stat">
                    <span className="stat-label">KEYWORDS SYNCED</span>
                    <span className="stat-value font-mono">
                      {Math.min(64, generationStep * 8 + Math.floor(elapsed * 0.4))}
                    </span>
                  </div>
                </div>

                {/* Bottom ticker displaying the single most recent log line for backend realism */}
                <div className="radar-log-ticker-container">
                  <div className="ticker-label">LATEST ACTION:</div>
                  <div className="ticker-message font-mono">
                    {logs.length > 0 ? (
                      <>
                        <span className={`ticker-tag ${logs[logs.length - 1].tag}`}>
                          [{logs[logs.length - 1].tag.toUpperCase()}]
                        </span>{' '}
                        {logs[logs.length - 1].msg}
                      </>
                    ) : (
                      'INITIALIZING SYSTEMS...'
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="new-project-form">
        <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>
          New Project
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-base)', marginBottom: 'var(--space-6)' }}>
          Create a tailored resume optimized for your target position
        </p>

        <div className="security-banner">
          <div className="security-banner-icon">
            <span style={{ fontSize: '18px' }}>🔒</span>
          </div>
          <div className="security-banner-content">
            <div className="security-banner-title">Safe & Confidential Resume Scans</div>
            <div className="security-banner-desc">Your resume content is securely encrypted and never shared. We maintain a strict zero-fabrication policy and only format your actual background truthfully.</div>
          </div>
        </div>

        {errors.general && (
          <div className="toast toast-error" style={{ marginBottom: 'var(--space-6)', minWidth: 'auto', maxWidth: '100%', animation: 'none' }}>
            <AlertCircle size={18} />
            <span className="toast-message">{errors.general}</span>
            <button
              id="dismiss-general-error"
              className="toast-dismiss"
              onClick={() => setErrors((prev) => ({ ...prev, general: undefined }))}
              aria-label="Dismiss error"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Resume Input Section */}
        <div className="form-section">
          <h2 className="form-section-title">Your Resume</h2>
          <p className="form-section-subtitle">
            Paste your resume text or upload a file
          </p>

          <div className="input-method-toggle">
            <button
              id="method-paste"
              className={`btn btn-sm ${inputMethod === 'paste' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setInputMethod('paste')}
              type="button"
            >
              Paste Text
            </button>
            <button
              id="method-upload"
              className={`btn btn-sm ${inputMethod === 'upload' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setInputMethod('upload')}
              type="button"
            >
              Upload File
            </button>
          </div>

          {inputMethod === 'paste' ? (
            <div className="form-group">
              <div className="textarea-count-wrapper">
                <textarea
                  id="resume-text-input"
                  className="form-textarea"
                  style={{ minHeight: '250px', paddingBottom: 'var(--space-8)' }}
                  placeholder="Paste your complete resume here..."
                  value={resumeText}
                  onChange={(e) => {
                    setResumeText(e.target.value);
                    if (errors.resumeText) setErrors((prev) => ({ ...prev, resumeText: undefined }));
                  }}
                />
                <div className="textarea-char-count">{resumeText.length} characters</div>
              </div>
              {errors.resumeText && (
                <span className="form-error">
                  <AlertCircle size={14} />
                  {errors.resumeText}
                </span>
              )}
            </div>
          ) : (
            <div className="form-group">
              {!uploadedFile ? (
                <div
                  className={`file-upload ${isDragging ? 'dragging' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                >
                  <input
                    id="resume-file-input"
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.txt"
                    style={{ display: 'none' }}
                    onChange={handleFileInputChange}
                  />
                  <div className="file-upload-icon">
                    <Upload size={32} />
                  </div>
                  <span className="file-upload-text">
                    Drop your resume here or click to browse
                  </span>
                  <span className="file-upload-hint">
                    Supports PDF and TXT files (max 5MB)
                  </span>
                </div>
              ) : (
                <div className="file-upload-selected">
                  <FileText size={20} />
                  <span style={{ flex: 1 }}>{uploadedFile.name}</span>
                  <button
                    id="remove-uploaded-file"
                    onClick={removeFile}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'inherit',
                      cursor: 'pointer',
                      display: 'flex',
                      padding: '2px',
                    }}
                    aria-label="Remove file"
                    type="button"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
              {uploadError && (
                <span className="form-error">
                  <AlertCircle size={14} />
                  {uploadError}
                </span>
              )}
              {errors.resumeText && !uploadedFile && (
                <span className="form-error">
                  <AlertCircle size={14} />
                  {errors.resumeText}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Job Description Section */}
        <div className="form-section">
          <h2 className="form-section-title">Job Description</h2>
          <p className="form-section-subtitle">
            Paste the job posting you are applying for
          </p>

          <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
            <div className="textarea-count-wrapper">
              <textarea
                id="job-description-input"
                className="form-textarea"
                style={{ minHeight: '250px', paddingBottom: 'var(--space-8)' }}
                placeholder="Paste the complete job description here..."
                value={jobDescription}
                onChange={(e) => {
                  setJobDescription(e.target.value);
                  if (errors.jobDescription) setErrors((prev) => ({ ...prev, jobDescription: undefined }));
                }}
              />
              <div className="textarea-char-count">{jobDescription.length} characters</div>
            </div>
            {errors.jobDescription && (
              <span className="form-error">
                <AlertCircle size={14} />
                {errors.jobDescription}
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="job-title-input">
                Job Title (optional)
              </label>
              <input
                id="job-title-input"
                className="form-input"
                type="text"
                placeholder="e.g. Senior Software Engineer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="company-input">
                Company Name (optional)
              </label>
              <input
                id="company-input"
                className="form-input"
                type="text"
                placeholder="e.g. Google"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Customization Section */}
        <div className="form-section">
          <h2 className="form-section-title">Customization</h2>
          <p className="form-section-subtitle">
            Choose the tone and length for your tailored resume
          </p>

          <div style={{ marginBottom: 'var(--space-6)' }}>
            <label className="form-label" style={{ marginBottom: 'var(--space-3)', display: 'block' }}>
              Tone
            </label>
            <div className="tone-options">
              {TONE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  id={`tone-${option.value}`}
                  className={`tone-option ${tone === option.value ? 'selected' : ''}`}
                  onClick={() => setTone(option.value)}
                  type="button"
                >
                  <div className="tone-option-radio" />
                  <div>
                    <div className="tone-option-label">{option.label}</div>
                    <div className="tone-option-desc">{option.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="form-label" style={{ marginBottom: 'var(--space-3)', display: 'block' }}>
              Length
            </label>
            <div className="length-options">
              {LENGTH_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  id={`length-${option.value}`}
                  className={`tone-option ${length === option.value ? 'selected' : ''}`}
                  onClick={() => setLength(option.value)}
                  type="button"
                >
                  <div className="tone-option-radio" />
                  <div>
                    <div className="tone-option-label">{option.label}</div>
                    <div className="tone-option-desc">{option.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <button
          id="generate-resume-btn"
          className="btn btn-primary btn-lg"
          style={{ width: '100%' }}
          onClick={handleGenerate}
          type="button"
        >
          <Sparkles size={20} />
          Analyze & Optimize Resume
        </button>
      </div>
    </div>
  );
}
