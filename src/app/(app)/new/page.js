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
  'Analyzing resume content',
  'Extracting job requirements',
  'Matching keywords',
  'Writing tailored content',
  'Preparing results',
];

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
  const [errors, setErrors] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    if (!isGenerating) return;

    const interval = setInterval(() => {
      setGenerationStep((prev) => {
        if (prev >= GENERATION_STEPS.length - 1) return prev;
        return prev + 1;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isGenerating]);

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

      router.push(`/results/${data.project.id}`);
    } catch (err) {
      setIsGenerating(false);
      setGenerationStep(0);
      setErrors({ general: err.message });
    }
  };

  if (isGenerating) {
    return (
      <div className="page-content">
        <div className="generation-loading">
          <div className="generation-loading-icon">
            <Sparkles size={36} />
          </div>
          <h1 className="generation-loading-title">
            Analyzing & Optimizing Resume
          </h1>
          <p className="generation-loading-subtitle">
            Running ATS parser simulation and fixing keyword gaps...
          </p>
          <div className="generation-steps">
            {GENERATION_STEPS.map((step, index) => {
              let stepClass = 'generation-step';
              if (index < generationStep) stepClass += ' done';
              else if (index === generationStep) stepClass += ' active';

              return (
                <div key={step} className={stepClass}>
                  {index < generationStep ? (
                    <CheckCircle2 size={18} />
                  ) : index === generationStep ? (
                    <Loader2 size={18} className="loader-spinner" style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <Circle size={18} />
                  )}
                  <span>{step}</span>
                </div>
              );
            })}
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
