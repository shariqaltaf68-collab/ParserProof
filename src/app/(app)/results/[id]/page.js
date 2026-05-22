'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  FileText,
  MessageSquare,
  Search,
  Target,
  CheckCircle,
  XCircle,
  Copy,
  Check,
  Sparkles,
  BarChart3,
  AlertTriangle,
  Loader2,
  Lock,
  Crown,
} from 'lucide-react';

const TABS = [
  { key: 'resume', label: 'Improved Resume', icon: FileText, requiredPlan: 'free' },
  { key: 'cover', label: 'Cover Letter', icon: Sparkles, requiredPlan: 'starter' },
  { key: 'keywords', label: 'Keywords', icon: Search, requiredPlan: 'starter' },
  { key: 'interview', label: 'Interview Prep', icon: MessageSquare, requiredPlan: 'pro' },
  { key: 'gap', label: 'Skill Gap', icon: BarChart3, requiredPlan: 'pro' },
];

const PLAN_ORDER = { free: 0, starter: 1, pro: 2 };

function isTabLocked(tabRequiredPlan, userPlan) {
  const userLevel = PLAN_ORDER[userPlan] ?? 0;
  const requiredLevel = PLAN_ORDER[tabRequiredPlan] ?? 0;
  return userLevel < requiredLevel;
}

function getUpgradePlan(tabRequiredPlan) {
  if (tabRequiredPlan === 'starter') return { name: 'Starter', price: '₹199/month' };
  if (tabRequiredPlan === 'pro') return { name: 'Pro', price: '₹399/month' };
  return { name: 'Starter', price: '₹199/month' };
}

function LockedTabContent({ requiredPlan }) {
  const upgrade = getUpgradePlan(requiredPlan);
  return (
    <div className="locked-tab-overlay">
      <div className="locked-tab-card">
        <div className="locked-tab-icon">
          <Lock size={32} />
        </div>
        <h3 className="locked-tab-title">Upgrade to Unlock</h3>
        <p className="locked-tab-description">
          This feature is available on the <strong>{upgrade.name}</strong> plan and above.
          Upgrade for just <strong>{upgrade.price}</strong> to access deeper job-description intelligence.
        </p>
        <Link href="/billing" className="btn btn-primary">
          <Crown size={16} />
          Upgrade to {upgrade.name}
        </Link>
      </div>
    </div>
  );
}

function parseMarkdownToHtml(markdown) {
  if (!markdown) return '';
  
  const lines = markdown.split('\n');
  let html = '';
  let inList = false;
  let inCvItem = false;
  
  const closeList = () => {
    if (inList) {
      html += '</ul>';
      inList = false;
    }
  };

  const closeCvItem = () => {
    if (inCvItem) {
      html += '</div>';
      inCvItem = false;
    }
  };

  const parseInline = (txt) => {
    // replace **bold** with <strong>bold</strong>
    txt = txt.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // replace *italic* with <em>italic</em>
    txt = txt.replace(/\*(.*?)\*/g, '<em>$1</em>');
    return txt;
  };

  const isSectionEmpty = (sectionLines) => {
    let hasContent = false;
    const emptyPhrases = [
      /not\s+mentioned/i,
      /not\s+specified/i,
      /none\s+mentioned/i,
      /^n\/a$/i,
      /^none$/i,
      /not\s+applicable/i,
      /^no\s+certifications/i,
      /^no\s+projects/i,
      /^no\s+education/i
    ];
    
    for (const l of sectionLines) {
      const trimmed = l.trim();
      if (trimmed === '') continue;
      
      const isPlaceholder = emptyPhrases.some(regex => regex.test(trimmed));
      if (isPlaceholder) {
        continue;
      }
      
      hasContent = true;
    }
    
    return !hasContent;
  };

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    
    // Header (# Name)
    if (line.startsWith('# ')) {
      closeList();
      closeCvItem();
      const name = line.substring(2).trim();
      html += `<div class="cv-header">
        <h1 class="cv-name">${parseInline(name)}</h1>`;
      
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        if (nextLine.includes('@') || nextLine.includes('|') || nextLine.includes('•') || nextLine.includes('+91') || nextLine.includes('+1')) {
          html += `<div class="cv-contact">${parseInline(nextLine)}</div>`;
          i++; // skip next line as it was contact info
        }
      }
      html += `</div>`;
      continue;
    }

    // Section (## Section)
    if (line.startsWith('## ')) {
      // Look ahead to check if the section has any meaningful content
      const sectionLines = [];
      let j = i + 1;
      while (j < lines.length && !lines[j].trim().startsWith('## ') && !lines[j].trim().startsWith('# ')) {
        sectionLines.push(lines[j]);
        j++;
      }
      
      if (isSectionEmpty(sectionLines)) {
        i = j - 1; // skip this empty section entirely
        continue;
      }

      closeList();
      closeCvItem();
      const sectionName = line.substring(3).trim();
      html += `<div class="cv-section-container">
        <h2 class="cv-section-title">${parseInline(sectionName)}</h2>
        <div class="cv-section-line"></div>
      </div>`;
      continue;
    }

    // Subheader (### Job Title | Company | Location | Dates)
    if (line.startsWith('### ')) {
      closeList();
      closeCvItem();
      
      inCvItem = true;
      html += `<div class="cv-item" style="page-break-inside: avoid; margin-bottom: 12px;">`;
      
      const content = line.substring(4).trim();
      const parts = content.split('|').map(p => p.trim());
      
      if (parts.length >= 2) {
        const title = parts[0];
        const company = parts[1];
        const location = parts.length >= 3 ? parts[2] : '';
        const dates = parts.length >= 4 ? parts[3] : '';
        
        html += `
          <div class="cv-item-header">
            <div class="cv-item-title-row">
              <span class="cv-item-title">${parseInline(title)}</span>
              <span class="cv-item-dates">${parseInline(dates)}</span>
            </div>
            <div class="cv-item-subtitle-row">
              <span class="cv-item-company">${parseInline(company)}</span>
              <span class="cv-item-location">${parseInline(location)}</span>
            </div>
          </div>
        `;
      } else {
        html += `<h3 class="cv-item-title-simple">${parseInline(content)}</h3>`;
      }
      continue;
    }

    // Bullet points
    if (line.startsWith('- ') || line.startsWith('* ') || line.startsWith('• ')) {
      if (!inList) {
        closeList();
        inList = true;
        html += '<ul class="cv-list">';
      }
      let bulletContent = line.substring(2).trim();
      // Strip any duplicate leading bullets/asterisks/dashes if generated by the LLM
      while (bulletContent.startsWith('*') || bulletContent.startsWith('-') || bulletContent.startsWith('•')) {
        bulletContent = bulletContent.substring(1).trim();
      }
      html += `<li class="cv-list-item"><span class="cv-bullet">•</span>${parseInline(bulletContent)}</li>`;
      continue;
    }

    // Paragraph
    if (line !== '') {
      closeList();
      html += `<p class="cv-paragraph">${parseInline(line)}</p>`;
    } else {
      closeList();
    }
  }

  closeList();
  closeCvItem();
  
  return html;
}

function AtsScoreRing({ score }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 70
      ? 'var(--color-success)'
      : score >= 40
      ? 'var(--color-warning)'
      : 'var(--color-error)';

  return (
    <div className="ats-ring-wrapper">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="10"
        />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 70 70)"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="ats-ring-label">
        <span className="ats-ring-value" style={{ color }}>
          {score}
        </span>
        <span className="ats-ring-text">ATS Score</span>
      </div>
    </div>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <button className="btn btn-ghost btn-sm" onClick={copy}>
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const userPlan = session?.user?.plan || 'free';
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('resume');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/projects/${params.id}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error('Project not found.');
          throw new Error('Failed to load project.');
        }
        const data = await res.json();
        setProject(data.project);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  const handleDownload = useCallback(async () => {
    if (!project) return;
    setDownloading(true);
    try {
      const content = `
OPTIMIZED RESUME
================
${project.improvedResume || ''}

COVER LETTER
============
${project.coverLetter || ''}

KEYWORD ANALYSIS
================
${(() => {
  try {
    const kw = typeof project.keywordMatch === 'string' ? JSON.parse(project.keywordMatch) : project.keywordMatch;
    if (!kw) return 'N/A';
    const matched = kw.matched || [];
    const missing = kw.missing || [];
    return `Matched: ${matched.join(', ')}\nMissing: ${missing.join(', ')}`;
  } catch { return 'N/A'; }
})()}

INTERVIEW QUESTIONS
===================
${(() => {
  try {
    const qs = typeof project.interviewQs === 'string' ? JSON.parse(project.interviewQs) : project.interviewQs;
    if (!qs || !Array.isArray(qs)) return 'N/A';
    return qs.map((q, i) => `${i + 1}. ${typeof q === 'string' ? q : q.question || ''}`).join('\n');
  } catch { return 'N/A'; }
})()}
`.trim();

      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.title || 'resume'}-optimized.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // fallback: do nothing
    } finally {
      setDownloading(false);
    }
  }, [project]);
  
  const handleDownloadPdf = useCallback(async () => {
    if (!project) return;
    setDownloading(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      
      const element = document.createElement('div');
      element.className = 'pdf-export-container';
      
      let headerTitle = project.title || 'Untitled Project';
      let docType = 'Optimized Document';
      let rawText = '';
      
      if (activeTab === 'resume') {
        docType = 'Optimized Resume';
        rawText = project.improvedResume || '';
      } else if (activeTab === 'cover') {
        docType = 'Tailored Cover Letter';
        rawText = project.coverLetter || '';
      } else if (activeTab === 'gap') {
        docType = 'Skill Gap Analysis';
        rawText = project.skillGap || '';
      } else if (activeTab === 'keywords') {
        docType = 'Keyword Analysis';
        try {
          const kw = typeof project.keywordMatch === 'string' ? JSON.parse(project.keywordMatch) : project.keywordMatch;
          if (kw) {
            rawText = `Matched Keywords:\n${kw.matched?.join(', ') || 'None'}\n\nMissing Keywords:\n${kw.missing?.join(', ') || 'None'}`;
          }
        } catch {
          rawText = 'N/A';
        }
      } else if (activeTab === 'interview') {
        docType = 'Interview Preparation';
        try {
          const qs = typeof project.interviewQs === 'string' ? JSON.parse(project.interviewQs) : project.interviewQs;
          if (Array.isArray(qs)) {
            rawText = qs.map((q, i) => `${i + 1}. ${typeof q === 'string' ? q : q.question || ''}${typeof q === 'object' && q.hint ? `\nHint: ${q.hint}` : ''}`).join('\n\n');
          }
        } catch {
          rawText = 'N/A';
        }
      }

      const isDoc = activeTab === 'resume' || activeTab === 'cover';
      const parsedTextHtml = isDoc ? parseMarkdownToHtml(rawText) : '';

      element.innerHTML = `
        <style>
          .pdf-export-container {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #1f2937;
            background: #ffffff;
            padding: 25px 30px;
            font-size: 12px;
            line-height: 1.5;
          }
          .pdf-header {
            border-bottom: 2px solid #6366f1;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .pdf-title {
            font-size: 26px;
            font-weight: 800;
            color: #1e1b4b;
            margin: 0 0 6px 0;
            letter-spacing: -0.02em;
          }
          .pdf-subtitle {
            font-size: 13px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #6366f1;
            margin: 0;
          }
          .pdf-meta {
            font-size: 12px;
            color: #6b7280;
            margin-top: 5px;
          }
          .pdf-body {
            white-space: pre-wrap;
            font-size: 13px;
            color: #374151;
            font-family: inherit;
          }
          
          /* Professional CV PDF Layout */
          .cv-header {
            text-align: center;
            margin-bottom: 20px;
          }
          .cv-name {
            font-size: 24px;
            font-weight: 800;
            color: #111827;
            margin: 0 0 5px 0;
            letter-spacing: -0.02em;
            text-transform: uppercase;
          }
          .cv-contact {
            font-size: 11px;
            color: #4b5563;
            margin: 0;
            letter-spacing: 0.01em;
          }
          .cv-section-container {
            margin-top: 18px;
            margin-bottom: 8px;
            page-break-inside: avoid;
            page-break-after: avoid;
          }
          .cv-section-title {
            font-size: 13px;
            font-weight: 700;
            color: #1e3a8a;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            margin: 0 0 3px 0;
          }
          .cv-section-line {
            height: 1px;
            background-color: #d1d5db;
            width: 100%;
          }
          .cv-item {
            margin-bottom: 10px;
            page-break-inside: avoid;
          }
          .cv-item-header {
            margin-bottom: 3px;
          }
          .cv-item-title-row {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
          }
          .cv-item-title {
            font-size: 12px;
            font-weight: 700;
            color: #111827;
          }
          .cv-item-dates {
            font-size: 11px;
            color: #4b5563;
            font-weight: 600;
          }
          .cv-item-subtitle-row {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            font-size: 11px;
            color: #4b5563;
            margin-top: 1px;
          }
          .cv-item-company {
            font-weight: 600;
            color: #374151;
          }
          .cv-item-location {
            color: #6b7280;
            font-style: italic;
          }
          .cv-item-title-simple {
            font-size: 12px;
            font-weight: 700;
            color: #111827;
            margin: 0 0 3px 0;
          }
          .cv-list {
            margin: 0;
            padding-left: 0;
            list-style-type: none;
          }
          .cv-list-item {
            position: relative;
            padding-left: 15px;
            margin-bottom: 3px;
            color: #374151;
            font-size: 11.5px;
            line-height: 1.4;
          }
          .cv-bullet {
            position: absolute;
            left: 0;
            top: 0;
            color: #1e3a8a;
            font-weight: bold;
          }
          .cv-paragraph {
            margin: 0 0 8px 0;
            color: #374151;
            font-size: 11.5px;
            line-height: 1.45;
            text-align: justify;
          }
        </style>
        ${isDoc ? `
          <div class="cv-content-wrapper">
            ${parsedTextHtml}
          </div>
        ` : `
          <div class="pdf-header">
            <h1 class="pdf-title">${headerTitle}</h1>
            <p class="pdf-subtitle">${docType}</p>
            <div class="pdf-meta">Generated via ResumePilot on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
          <div class="pdf-body">${rawText}</div>
        `}
      `;

      const opt = {
        margin: [12, 15, 12, 15],
        filename: `${project.title || 'document'}-${activeTab}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      await html2pdf().from(element).set(opt).save();
    } catch (e) {
      console.error(e);
    } finally {
      setDownloading(false);
    }
  }, [project, activeTab]);

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
        <p>Loading your results...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <AlertTriangle size={48} />
        <h3>Something went wrong</h3>
        <p>{error}</p>
        <Link href="/dashboard" className="btn btn-primary">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  if (!project) return null;

  let keywordData = { matched: [], missing: [], score: 0 };
  try {
    const raw =
      typeof project.keywordMatch === 'string'
        ? JSON.parse(project.keywordMatch)
        : project.keywordMatch;
    if (raw) keywordData = raw;
  } catch {}

  let interviewQuestions = [];
  try {
    const raw =
      typeof project.interviewQs === 'string'
        ? JSON.parse(project.interviewQs)
        : project.interviewQs;
    if (Array.isArray(raw)) interviewQuestions = raw;
  } catch {}

  return (
    <div className="results-page">
      {/* Header */}
      <div className="results-header">
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => router.push('/dashboard')}
        >
          <ArrowLeft size={16} />
          Dashboard
        </button>
        <div className="results-header-actions" style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleDownload}
            disabled={downloading}
          >
            <FileText size={14} />
            Download TXT
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleDownloadPdf}
            disabled={downloading}
          >
            {downloading ? (
              <Loader2 size={14} className="spin" />
            ) : (
              <Download size={14} />
            )}
            {downloading ? 'Exporting PDF...' : 'Download PDF'}
          </button>
        </div>
      </div>

      {/* Title + Score */}
      <div className="results-summary">
        <div className="results-info">
          <h1 className="page-title">{project.title || 'Untitled Project'}</h1>
          <div className="results-meta">
            {project.jobTitle && (
              <span className="badge badge-info">{project.jobTitle}</span>
            )}
            {project.company && (
              <span className="badge badge-info">{project.company}</span>
            )}
            <span className="text-muted">
              {new Date(project.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>
        <AtsScoreRing score={project.atsScore || 0} />
      </div>

      {/* Tabs */}
      <div className="results-tabs">
        {TABS.map((tab) => {
          if (tab.key === 'gap' && !project.skillGap) return null;
          const Icon = tab.icon;
          const locked = isTabLocked(tab.requiredPlan, userPlan);
          return (
            <button
              key={tab.key}
              className={`results-tab${activeTab === tab.key ? ' active' : ''}${locked ? ' locked' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {locked && <Lock size={12} className="tab-lock-icon" />}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="results-content">
        {activeTab === 'resume' && (
          <div className="result-panel">
            <div className="result-panel-header">
              <h2>Improved Resume</h2>
              <CopyButton text={project.improvedResume || ''} />
            </div>
            <div className="result-panel-body cv-preview-body">
              <div 
                className="cv-content-wrapper"
                dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(project.improvedResume) }}
              />
            </div>
          </div>
        )}

        {activeTab === 'cover' && (
          isTabLocked('starter', userPlan) ? (
            <LockedTabContent requiredPlan="starter" />
          ) : (
            <div className="result-panel">
              <div className="result-panel-header">
                <h2>Tailored Cover Letter</h2>
                <CopyButton text={project.coverLetter || ''} />
              </div>
              <div className="result-panel-body cv-preview-body">
                <div 
                  className="cv-content-wrapper"
                  dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(project.coverLetter) }}
                />
              </div>
            </div>
          )
        )}

        {activeTab === 'keywords' && (
          isTabLocked('starter', userPlan) ? (
            <LockedTabContent requiredPlan="starter" />
          ) : (
            <div className="result-panel">
              <div className="result-panel-header">
                <h2>Keyword Analysis</h2>
              </div>
              <div className="result-panel-body">
                {keywordData.matched?.length > 0 && (
                  <div className="keyword-group">
                    <h3 className="keyword-group-title">
                      <CheckCircle size={16} className="icon-success" />
                      Matched Keywords ({keywordData.matched.length})
                    </h3>
                    <div className="keyword-tags">
                      {keywordData.matched.map((kw, i) => (
                        <span key={i} className="badge badge-success">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {keywordData.missing?.length > 0 && (
                  <div className="keyword-group">
                    <h3 className="keyword-group-title">
                      <XCircle size={16} className="icon-error" />
                      Missing Keywords ({keywordData.missing.length})
                    </h3>
                    <div className="keyword-tags">
                      {keywordData.missing.map((kw, i) => (
                        <span key={i} className="badge badge-error">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {keywordData.score != null && (
                  <div className="keyword-score">
                    <strong>Match Rate:</strong> {keywordData.score}%
                  </div>
                )}
              </div>
            </div>
          )
        )}

        {activeTab === 'interview' && (
          isTabLocked('pro', userPlan) ? (
            <LockedTabContent requiredPlan="pro" />
          ) : (
            <div className="result-panel">
              <div className="result-panel-header">
                <h2>Interview Questions</h2>
              </div>
              <div className="result-panel-body">
                <ol className="interview-list">
                  {interviewQuestions.map((q, i) => (
                    <li key={i} className="interview-item">
                      <div className="interview-question">
                        <MessageSquare size={16} />
                        <span>
                          {typeof q === 'string' ? q : q.question || ''}
                        </span>
                      </div>
                      {typeof q === 'object' && q.hint && (
                        <div className="interview-hint">
                          <strong>Hint:</strong> {q.hint}
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )
        )}

        {activeTab === 'gap' && project.skillGap && (
          isTabLocked('pro', userPlan) ? (
            <LockedTabContent requiredPlan="pro" />
          ) : (
            <div className="result-panel">
              <div className="result-panel-header">
                <h2>Skill Gap Analysis</h2>
              </div>
              <div className="result-panel-body">
                <pre className="result-text">{project.skillGap}</pre>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
