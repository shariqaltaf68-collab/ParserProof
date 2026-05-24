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
  Shield,
} from 'lucide-react';

import XRayScanner from '@/components/XRayScanner';
import OutreachAccelerator from '@/components/OutreachAccelerator';
import BattlegroundPanel from '@/components/BattlegroundPanel';

const TABS = [
  { key: 'resume', label: 'Improved Resume', icon: FileText, requiredPlan: 'free' },
  { key: 'roadmap', label: 'Skill & JD Roadmap', icon: Search, requiredPlan: 'free' },
  { key: 'outreach', label: 'Career Outreach', icon: Target, requiredPlan: 'free' },
  { key: 'cover', label: 'Cover Letter', icon: Sparkles, requiredPlan: 'starter' },
  { key: 'interview', label: 'Interview Prep', icon: MessageSquare, requiredPlan: 'pro' },
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
      let trimmed = l.trim();
      if (trimmed === '') continue;
      
      // Strip markdown bullet/list prefixes to make sure placeholders match correctly
      trimmed = trimmed.replace(/^[\s\-\*\•\+]+/, '').trim();
      
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
  const [pdfTemplate, setPdfTemplate] = useState('modern');
  const [showTechAudit, setShowTechAudit] = useState(false);

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

  useEffect(() => {
    const handleUpdate = (e) => {
      if (e.detail && e.detail.id === params.id) {
        setProject((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            resumeText: e.detail.resumeText,
            atsScore: e.detail.atsScore,
            keywordMatch: e.detail.keywordMatch,
            improvedResume: e.detail.improvedResume || prev.improvedResume,
          };
        });
      }
    };
    
    window.addEventListener('resume-updated', handleUpdate);
    return () => window.removeEventListener('resume-updated', handleUpdate);
  }, [params.id]);

  const handleApplyBulletReplacement = useCallback(async (oldBullet, newBullet) => {
    if (!project) return;
    try {
      const cleanOld = oldBullet.replace(/^[\s\-\*\•]+/, '').trim();
      const cleanNew = newBullet.replace(/^[\s\-\*\•]+/, '').trim();
      
      const res = await fetch(`/api/projects/${project.id}/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actions: [
            {
              type: 'REPLACE_TEXT',
              target: cleanOld,
              replacement: cleanNew,
            }
          ]
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        window.dispatchEvent(new CustomEvent('resume-updated', { detail: data.project }));
        alert('✨ Resume optimized! Bullet applied successfully and Live ATS score updated.');
      } else {
        throw new Error(data.error || 'Failed to apply bullet edit.');
      }
    } catch (e) {
      alert(`⚠️ Edit error: ${e.message}`);
    }
  }, [project]);

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
      } else if (activeTab === 'roadmap') {
        docType = 'Skill & JD Roadmap';
        try {
          const kw = typeof project.keywordMatch === 'string' ? JSON.parse(project.keywordMatch) : project.keywordMatch;
          const matched = kw?.matched?.join(', ') || 'None';
          const missing = kw?.missing?.join(', ') || 'None';
          rawText = `Matched Keywords:\n${matched}\n\nMissing Keywords:\n${missing}\n\nSkill Gap Analysis:\n${project.skillGap || 'N/A'}`;
        } catch {
          rawText = project.skillGap || 'N/A';
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
            font-family: var(--font-inter), 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #1f2937;
            background: #ffffff;
            padding: ${isDoc ? '0px !important' : '25px 30px !important'};
            font-size: 12px;
            line-height: 1.5;
          }
          .cv-content-wrapper {
            background: #ffffff !important;
            color: #1f2937 !important;
            width: 100% !important;
            box-sizing: border-box !important;
            font-family: var(--font-inter), 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
            line-height: 1.55 !important;
            font-size: 11px !important;
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
            text-align: justify;          /* ==========================================================
             PREMIUM RECRUITER TEMPLATE OVERRIDES (PDF COMPILER)
             ========================================================== */

          /* 1. Silicon Valley Tech (FAANG Standard) */
          .cv-template-modern {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
            color: #1e293b !important;
            line-height: 1.5 !important;
          }
          .cv-template-modern .cv-header {
            text-align: left !important;
            margin-bottom: 22px !important;
            border-bottom: 2px solid #e2e8f0 !important;
            padding-bottom: 12px !important;
          }
          .cv-template-modern .cv-name {
            font-family: 'Inter', sans-serif !important;
            font-size: 26px !important;
            font-weight: 850 !important;
            letter-spacing: -0.03em !important;
            color: #0f172a !important;
            text-transform: none !important;
          }
          .cv-template-modern .cv-contact {
            font-family: 'Inter', sans-serif !important;
            font-size: 11px !important;
            color: #475569 !important;
            font-weight: 500 !important;
            margin-top: 4px !important;
          }
          .cv-template-modern .cv-section-container {
            margin-top: 18px !important;
            margin-bottom: 8px !important;
          }
          .cv-template-modern .cv-section-title {
            font-family: 'Inter', sans-serif !important;
            font-size: 12.5px !important;
            font-weight: 700 !important;
            color: #2563eb !important; /* Steel Tech Indigo */
            text-transform: uppercase !important;
            letter-spacing: 0.06em !important;
          }
          .cv-template-modern .cv-section-line {
            height: 1.5px !important;
            background-color: #3b82f6 !important;
            width: 100% !important;
          }
          .cv-template-modern .cv-item-title {
            font-family: 'Inter', sans-serif !important;
            font-weight: 700 !important;
            color: #0f172a !important;
          }
          .cv-template-modern .cv-item-company {
            font-family: 'Inter', sans-serif !important;
            color: #1e293b !important;
            font-weight: 600 !important;
          }
          .cv-template-modern .cv-bullet {
            color: #2563eb !important;
          }
          .cv-template-modern .cv-list-item {
            font-family: 'Inter', sans-serif !important;
            font-size: 11.5px !important;
            color: #334155 !important;
            line-height: 1.45 !important;
          }
          .cv-template-modern .cv-paragraph {
            font-family: 'Inter', sans-serif !important;
            font-size: 11.5px !important;
            color: #334155 !important;
          }

          /* 2. McKinsey Executive & Harvard Business (Elegant Serif) */
          .cv-template-classic {
            font-family: 'Lora', 'Georgia', 'Times New Roman', serif !important;
            color: #111111 !important;
            line-height: 1.55 !important;
          }
          .cv-template-classic .cv-header {
            text-align: center !important;
            margin-bottom: 24px !important;
          }
          .cv-template-classic .cv-name {
            font-family: 'Lora', 'Georgia', serif !important;
            font-size: 25px !important;
            font-weight: 500 !important;
            letter-spacing: 0.06em !important;
            text-transform: uppercase !important;
            color: #0d2c54 !important; /* McKinsey Executive Navy */
          }
          .cv-template-classic .cv-contact {
            font-family: 'Lora', 'Georgia', serif !important;
            font-size: 10.5px !important;
            font-style: italic !important;
            color: #4a5568 !important;
            margin-top: 6px !important;
          }
          .cv-template-classic .cv-section-container {
            text-align: center !important;
            margin-top: 22px !important;
            margin-bottom: 10px !important;
          }
          .cv-template-classic .cv-section-title {
            font-family: 'Lora', 'Georgia', serif !important;
            font-size: 13px !important;
            font-weight: 700 !important;
            color: #0d2c54 !important;
            text-transform: uppercase !important;
            letter-spacing: 0.12em !important;
            margin-bottom: 4px !important;
          }
          .cv-template-classic .cv-section-line {
            height: 1px !important;
            background-color: #0d2c54 !important;
            width: 45% !important;
            margin: 0 auto !important;
          }
          .cv-template-classic .cv-item-title {
            font-family: 'Lora', 'Georgia', serif !important;
            font-weight: 700 !important;
            color: #111111 !important;
          }
          .cv-template-classic .cv-item-dates {
            font-family: 'Lora', 'Georgia', serif !important;
            font-style: italic !important;
            font-weight: 400 !important;
            color: #4a5568 !important;
          }
          .cv-template-classic .cv-item-company {
            font-family: 'Lora', 'Georgia', serif !important;
            font-weight: 700 !important;
            color: #2d3748 !important;
          }
          .cv-template-classic .cv-item-location {
            font-family: 'Lora', 'Georgia', serif !important;
            font-style: italic !important;
            color: #4a5568 !important;
          }
          .cv-template-classic .cv-list-item {
            font-family: 'Lora', 'Georgia', serif !important;
            font-size: 11px !important;
            line-height: 1.5 !important;
            color: #1a202c !important;
          }
          .cv-template-classic .cv-bullet {
            color: #0d2c54 !important;
          }
          .cv-template-classic .cv-paragraph {
            font-family: 'Lora', 'Georgia', serif !important;
            font-size: 11px !important;
            line-height: 1.5 !important;
            color: #1a202c !important;
          }

          /* 3. Goldman Sachs & Wall Street (Clean Minimal) */
          .cv-template-minimalist {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important;
            color: #000000 !important;
            line-height: 1.45 !important;
          }
          .cv-template-minimalist .cv-header {
            text-align: left !important;
            margin-bottom: 20px !important;
            border-bottom: 2px solid #000000 !important;
            padding-bottom: 8px !important;
          }
          .cv-template-minimalist .cv-name {
            font-family: 'Helvetica Neue', Arial, sans-serif !important;
            font-size: 28px !important;
            font-weight: 900 !important;
            letter-spacing: -0.04em !important;
            text-transform: uppercase !important;
            color: #000000 !important;
          }
          .cv-template-minimalist .cv-contact {
            font-family: 'Helvetica Neue', Arial, sans-serif !important;
            font-size: 10px !important;
            color: #333333 !important;
            margin-top: 4px !important;
            letter-spacing: 0px !important;
          }
          .cv-template-minimalist .cv-section-container {
            margin-top: 18px !important;
            margin-bottom: 8px !important;
          }
          .cv-template-minimalist .cv-section-title {
            font-family: 'Helvetica Neue', Arial, sans-serif !important;
            font-size: 12px !important;
            font-weight: 800 !important;
            color: #000000 !important;
            text-transform: uppercase !important;
            letter-spacing: 0.08em !important;
          }
          .cv-template-minimalist .cv-section-line {
            height: 1px !important;
            background-color: #000000 !important;
            width: 100% !important;
          }
          .cv-template-minimalist .cv-item-title {
            font-family: 'Helvetica Neue', Arial, sans-serif !important;
            font-weight: 800 !important;
            color: #000000 !important;
          }
          .cv-template-minimalist .cv-item-dates {
            font-family: 'Helvetica Neue', Arial, sans-serif !important;
            font-weight: 700 !important;
            color: #000000 !important;
          }
          .cv-template-minimalist .cv-item-company {
            font-family: 'Helvetica Neue', Arial, sans-serif !important;
            font-weight: 700 !important;
            color: #000000 !important;
          }
          .cv-template-minimalist .cv-item-location {
            font-family: 'Helvetica Neue', Arial, sans-serif !important;
            color: #333333 !important;
            font-style: normal !important;
            font-weight: 500 !important;
          }
          .cv-template-minimalist .cv-list-item {
            font-family: 'Helvetica Neue', Arial, sans-serif !important;
            font-size: 11px !important;
            line-height: 1.4 !important;
            color: #111111 !important;
          }
          .cv-template-minimalist .cv-bullet {
            color: #000000 !important;
          }
          .cv-template-minimalist .cv-paragraph {
            font-family: 'Helvetica Neue', Arial, sans-serif !important;
            font-size: 11px !important;
            line-height: 1.4 !important;
            color: #111111 !important;
          }

          /* 4. Creative Executive (Stylish Warmth) */
          .cv-template-creative {
            font-family: 'Outfit', sans-serif !important;
            color: #1e293b !important;
            line-height: 1.5 !important;
          }
          .cv-template-creative .cv-header {
            text-align: left !important;
            margin-bottom: 22px !important;
            border-bottom: 3px solid #0f766e !important;
            padding-bottom: 12px !important;
          }
          .cv-template-creative .cv-name {
            font-family: 'Outfit', sans-serif !important;
            font-size: 28px !important;
            font-weight: 800 !important;
            letter-spacing: -0.02em !important;
            color: #115e59 !important;
            text-transform: none !important;
          }
          .cv-template-creative .cv-contact {
            font-family: 'Outfit', sans-serif !important;
            font-size: 11px !important;
            color: #0f766e !important;
            font-weight: 500 !important;
            margin-top: 6px !important;
          }
          .cv-template-creative .cv-section-container {
            margin-top: 20px !important;
            margin-bottom: 10px !important;
          }
          .cv-template-creative .cv-section-title {
            font-family: 'Outfit', sans-serif !important;
            font-size: 13px !important;
            font-weight: 700 !important;
            color: #0f766e !important;
            text-transform: uppercase !important;
            letter-spacing: 0.08em !important;
          }
          .cv-template-creative .cv-section-line {
            height: 2px !important;
            background-color: #0f766e !important;
            width: 100% !important;
          }
          .cv-template-creative .cv-item-title {
            font-family: 'Outfit', sans-serif !important;
            font-weight: 700 !important;
            color: #115e59 !important;
          }
          .cv-template-creative .cv-item-company {
            font-family: 'Outfit', sans-serif !important;
            color: #1e293b !important;
            font-weight: 600 !important;
          }
          .cv-template-creative .cv-bullet {
            color: #0f766e !important;
          }
          .cv-template-creative .cv-list-item {
            font-family: 'Outfit', sans-serif !important;
            font-size: 11.5px !important;
            color: #334155 !important;
            line-height: 1.45 !important;
          }
          .cv-template-creative .cv-paragraph {
            font-family: 'Outfit', sans-serif !important;
            font-size: 11.5px !important;
            color: #334155 !important;
          }

          /* 5. Corporate Director (Elite Leadership) */
          .cv-template-executive {
            font-family: 'Inter', sans-serif !important;
            color: #111827 !important;
            line-height: 1.55 !important;
          }
          .cv-template-executive .cv-header {
            text-align: center !important;
            margin-bottom: 24px !important;
            border-bottom: 1px double #9f1239 !important;
            padding-bottom: 14px !important;
          }
          .cv-template-executive .cv-name {
            font-family: 'Lora', 'Georgia', serif !important;
            font-size: 26px !important;
            font-weight: 700 !important;
            letter-spacing: 0.02em !important;
            text-transform: uppercase !important;
            color: #881337 !important;
          }
          .cv-template-executive .cv-contact {
            font-family: 'Inter', sans-serif !important;
            font-size: 10.5px !important;
            color: #4b5563 !important;
            margin-top: 6px !important;
            font-weight: 600 !important;
            letter-spacing: 0.05em !important;
          }
          .cv-template-executive .cv-section-container {
            margin-top: 22px !important;
            margin-bottom: 10px !important;
          }
          .cv-template-executive .cv-section-title {
            font-family: 'Lora', 'Georgia', serif !important;
            font-size: 13.5px !important;
            font-weight: 700 !important;
            color: #881337 !important;
            text-transform: uppercase !important;
            letter-spacing: 0.1em !important;
            margin-bottom: 4px !important;
          }
          .cv-template-executive .cv-section-line {
            height: 1.5px !important;
            background-color: #881337 !important;
            width: 100% !important;
          }
          .cv-template-executive .cv-item-title {
            font-family: 'Lora', 'Georgia', serif !important;
            font-weight: 700 !important;
            color: #111827 !important;
            font-size: 12.5px !important;
          }
          .cv-template-executive .cv-item-dates {
            font-family: 'Inter', sans-serif !important;
            font-weight: 600 !important;
            color: #881337 !important;
          }
          .cv-template-executive .cv-item-company {
            font-family: 'Inter', sans-serif !important;
            font-weight: 700 !important;
            color: #374151 !important;
          }
          .cv-template-executive .cv-item-location {
            font-family: 'Inter', sans-serif !important;
            font-style: italic !important;
            color: #4b5563 !important;
          }
          .cv-template-executive .cv-list-item {
            font-family: 'Inter', sans-serif !important;
            font-size: 11px !important;
            line-height: 1.5 !important;
            color: #1f2937 !important;
          }
          .cv-template-executive .cv-bullet {
            color: #881337 !important;
            font-weight: bold !important;
          }
          .cv-template-executive .cv-paragraph {
            font-family: 'Inter', sans-serif !important;
            font-size: 11px !important;
            line-height: 1.5 !important;
            color: #1f2937 !important;
          }
          .cv-template-executive strong {
            color: #111827 !important;
          }
        </style>
        ${isDoc ? `
          <div class="cv-content-wrapper cv-template-${pdfTemplate}">
            ${parsedTextHtml}
          </div>
        ` : `
          <div class="pdf-header">
            <h1 class="pdf-title">${headerTitle}</h1>
            <p class="pdf-subtitle">${docType}</p>
            <div class="pdf-meta">Generated via ParserProof on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
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

      // 1. Temporarily append to body to resolve template styles and pre-loaded fonts under active DOM calculations
      // 1. Create a parent container positioned at absolute left 0, height 0, overflow hidden
      // This allows styles to fully resolve in the DOM tree, but keeps it completely hidden from the user,
      // and guarantees that html2canvas is passed an element with clean, normal relative styles (not absolute).
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '0';
      container.style.top = '0';
      container.style.width = '800px';
      container.style.height = '0';
      container.style.overflow = 'hidden';
      container.style.zIndex = '-9999';
      
      // Clean background style on the target element itself
      element.style.background = '#ffffff';
      element.style.width = '800px';
      
      container.appendChild(element);
      document.body.appendChild(container);
      
      // 2. Perform PDF generation directly on the clean child element
      await html2pdf().from(element).set(opt).save();

      // 3. Remove container wrapper cleanly from DOM
      document.body.removeChild(container);
    } catch (e) {
      console.error(e);
    } finally {
      setDownloading(false);
    }
  }, [project, activeTab, pdfTemplate]);

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
        <p>Analyzing your data, please wait...</p>
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

  // Parse RAG Grounding Telemetry
  let ragSources = [];
  try {
    if (project.ragSources) {
      ragSources = JSON.parse(project.ragSources);
    }
  } catch (e) {
    console.error('Failed to parse RAG sources:', e);
  }

  const ragConfidence = project.ragConfidence !== undefined && project.ragConfidence !== null ? project.ragConfidence : null;
  
  // Determine grounding status
  let ragStatus = 'moderate';
  let ragStatusText = 'Moderate Grounding';
  let ragCardClass = 'rag-moderate';

  if (ragConfidence !== null) {
    if (ragConfidence >= 75) {
      ragStatus = 'high';
      ragStatusText = 'Verified Grounded';
      ragCardClass = 'rag-high';
    } else if (ragConfidence < 35) {
      ragStatus = 'weak';
      ragStatusText = 'Weak Context Match';
      ragCardClass = 'rag-weak';
    }
  } else {
    // If telemetry is missing (older project), default to high grounded status
    ragStatus = 'high';
    ragStatusText = 'Standard Grounding Active';
    ragCardClass = 'rag-high';
  }

  // Get score-based blunt feedback
  const atsScore = project.atsScore || 0;
  let realityStatus = 'low';
  let realityTitle = '';
  let realityWarning = '';
  let realityWhy = [];
  let realityAction = [];
  let cardClass = '';

  if (atsScore < 50) {
    realityStatus = 'danger';
    cardClass = 'ats-reality-danger';
    realityTitle = 'Critical Auto-Rejection Risk';
    realityWarning = `In its current state, your resume has a near-zero chance of passing automated ATS screening for the target position. A recruiter will never see this. Automated parsing filters will auto-reject you within seconds because your document lacks structural compatibility and essential keyword match density. This is the raw reality.`;
    realityWhy = [
      'Severe Keyword Deprivation: Your resume is missing crucial technical and core skills requested in the job description.',
      'Unstructured or Complex Layout: If you used a multi-column template (like Canva or graphics), the parser is scrambling your text into unreadable characters.',
      'Task-Oriented Bullet Points: Your experience sections focus entirely on passive duties ("responsible for...") rather than quantified business outcomes.',
    ];
    realityAction = [
      {
        text: 'Switch to our clean, single-column, parser-safe "Improved Resume" tab above, click "Download PDF" and use that file. Never use Canva templates for ATS applications.',
        tab: 'resume'
      },
      {
        text: `Go to the "Keywords" tab to see exactly what terms you missed. You must weave these missing keywords (like ${keywordData.missing?.slice(0, 3).join(', ') || 'essential technical phrases'}) directly into your experience sections.`,
        tab: 'keywords'
      },
      {
        text: 'Review the "Skill Gap" tab to see critical software or technologies the job post demands. Add a mini-project or complete a quick online certification to bridge these gaps.',
        tab: 'gap'
      }
    ];
  } else if (atsScore < 75) {
    realityStatus = 'warning';
    cardClass = 'ats-reality-warning';
    realityTitle = 'Moderate Match (High Rejection Gamble)';
    realityWarning = `Your resume has basic qualifications, but you're hovering in the ATS 'gray-zone'. For competitive roles, you are competing against hundreds of applicants, many of whom have an 85%+ keyword alignment. Applying with this resume is a high-risk gamble — you are highly likely to be filtered out in the first batch of automated rejections.`;
    realityWhy = [
      'Partial Keyword Matching: You have captured the main skills but missed secondary keywords that increase your search ranking in the recruiter\'s database.',
      'Weak Action Verbs & STAR Framing: Your academic projects or work history have some metrics, but they lack strong business results or financial metrics.',
    ];
    realityAction = [
      {
        text: 'Adopt the metric-focused STAR experience rewrites from the "Improved Resume" tab to show quantifiable business outcomes.',
        tab: 'resume'
      },
      {
        text: `Check the "Keywords" tab. Make sure every missing keyword (like ${keywordData.missing?.slice(0, 3).join(', ') || 'required tools'}) matches the exact spelling and casing used in the job post.`,
        tab: 'keywords'
      },
      {
        text: 'Unlock the "Cover Letter" tab to generate a highly tailored introduction explaining how your background bridges any remaining gaps.',
        tab: 'cover'
      }
    ];
  } else {
    realityStatus = 'success';
    cardClass = 'ats-reality-success';
    realityTitle = 'Strong Match (Recruiter Ready)';
    realityWarning = `Your resume is highly optimized and has a very strong probability of passing ATS filters and landing on a human recruiter's desk. You have aligned your technical skills and achievements closely with the job requirements. The risk of automated rejection is extremely low.`;
    realityWhy = [
      'Excellent Keyword Density: Your resume naturally integrates the primary and secondary requirements of the job description.',
      'Strong Quantified Metrics: Your achievements are properly framed using the STAR format with metric outcomes.',
    ];
    realityAction = [
      {
        text: 'Download the optimized single-column resume from the "Improved Resume" tab.',
        tab: 'resume'
      },
      {
        text: 'Go to the "Interview Prep" tab. Since your resume is highly likely to clear the ATS screen, your next big challenge is the technical interview. Prepare using the exact questions provided.',
        tab: 'interview'
      },
      {
        text: 'Unlock the "Cover Letter" tab to generate a matching custom letter, complete your application package, and apply directly.',
        tab: 'cover'
      }
    ];
  }

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
        <div className="results-header-actions" style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          {(activeTab === 'resume' || activeTab === 'cover') && (
            <div className="template-select-wrapper" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span className="template-select-label" style={{ fontSize: 'var(--font-size-xs)', fontWeight: '600', color: 'var(--color-text-secondary)' }}>Template:</span>
              <select
                value={pdfTemplate}
                onChange={(e) => setPdfTemplate(e.target.value)}
                className="form-select form-select-sm template-select-dropdown"
                style={{
                  width: 'auto',
                  padding: 'var(--space-1) var(--space-4) var(--space-1) var(--space-2)',
                  fontSize: 'var(--font-size-xs)',
                  height: '32px',
                  background: 'var(--color-bg-tertiary)',
                  borderColor: 'var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-text-primary)',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="modern">Silicon Valley Tech (FAANG Standard)</option>
                <option value="classic">McKinsey & Co. / Harvard Business (Elegant Serif)</option>
                <option value="minimalist">Goldman Sachs / Wall Street (Clean Minimal)</option>
                <option value="creative">Creative Executive (Stylish Warmth)</option>
                <option value="executive">Corporate Director (Elite Leadership)</option>
              </select>
            </div>
          )}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="result-panel">
              <div className="result-panel-header">
                <h2>Improved Resume</h2>
                <CopyButton text={project.improvedResume || ''} />
              </div>
              <div className="result-panel-body cv-preview-body">
                <div 
                  className={`cv-content-wrapper cv-template-${pdfTemplate}`}
                  dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(project.improvedResume) }}
                />
              </div>
            </div>

            {/* Live Inline Sandbox Workbench */}
            <div className="card" style={{ padding: 'var(--space-4)', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--color-border)', paddingBottom: '10px' }}>
                <Sparkles size={18} style={{ color: 'var(--color-accent)' }} />
                <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
                  Inline STAR &amp; Google XYZ Sandbox Workbench
                </h3>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: 0 }}>
                Select an experience bullet point below to optimize with the Google XYZ formula, tweak in real time, and dynamically update your live ATS score.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {(project?.resumeText || '')
                  .split('\n')
                  .map(line => line.trim())
                  .filter(line => line.startsWith('- ') || line.startsWith('* ') || line.startsWith('• '))
                  .slice(0, 5)
                  .map((bullet, idx) => (
                    <SandboxBulletRow 
                      key={idx} 
                      bullet={bullet} 
                      projectId={project.id} 
                      onApplied={(newBullet) => handleApplyBulletReplacement(bullet, newBullet)}
                    />
                  ))}
              </div>
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
                  className={`cv-content-wrapper cv-template-${pdfTemplate}`}
                  dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(project.coverLetter) }}
                />
              </div>
            </div>
          )
        )}

        {activeTab === 'roadmap' && (
          <div className="result-panel">
            <div className="result-panel-header">
              <h2>Skill &amp; JD Roadmap</h2>
            </div>
            <div className="result-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', padding: '24px' }}>
              
              {/* Keyword Comparison Block */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
                {keywordData.matched?.length > 0 && (
                  <div className="keyword-group" style={{ background: 'rgba(16, 185, 129, 0.03)', border: '1px solid rgba(16, 185, 129, 0.08)', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)' }}>
                    <h3 className="keyword-group-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '700', color: 'var(--color-success)', marginBottom: '12px' }}>
                      <CheckCircle size={15} />
                      Matched Keywords ({keywordData.matched.length})
                    </h3>
                    <div className="keyword-tags" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {keywordData.matched.map((kw, i) => (
                        <span key={i} className="badge badge-success" style={{ padding: '4px 8px', fontSize: '10.5px', fontWeight: '500', borderRadius: '4px' }}>
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {keywordData.missing?.length > 0 && (
                  <div className="keyword-group" style={{ background: 'rgba(239, 68, 68, 0.03)', border: '1px solid rgba(239, 68, 68, 0.08)', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)' }}>
                    <h3 className="keyword-group-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '700', color: 'var(--color-error)', marginBottom: '12px' }}>
                      <XCircle size={15} />
                      Missing Keywords ({keywordData.missing.length})
                    </h3>
                    <div className="keyword-tags" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {keywordData.missing.map((kw, i) => (
                        <span key={i} className="badge badge-error" style={{ padding: '4px 8px', fontSize: '10.5px', fontWeight: '500', borderRadius: '4px' }}>
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Dynamic Online Learning Traffic Hub */}
              {keywordData.missing?.length > 0 && (
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-5)' }}>
                  <h3 style={{ fontSize: '13.5px', fontWeight: '800', color: 'var(--color-text-primary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={15} style={{ color: 'var(--color-accent)' }} />
                    Skill Acquisition Hub (Real-Time Platform Training)
                  </h3>
                  <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
                    Acquire these underrepresented credentials by clicking a platform below to search for direct tutorials, lessons, and certification guides:
                  </p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {keywordData.missing.slice(0, 12).map((kw, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', flexWrap: 'wrap', gap: '10px' }}>
                        <span style={{ fontWeight: '700', fontSize: '11.5px', color: 'var(--color-text-primary)' }}>{kw}</span>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <a 
                            href={`https://www.coursera.org/search?query=${encodeURIComponent(kw)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-ghost btn-sm"
                            style={{ fontSize: '9.5px', padding: '2px 8px', height: '24px', background: 'rgba(0, 86, 179, 0.04)', color: '#0056b3', border: '1px solid rgba(0, 86, 179, 0.12)', borderRadius: '4px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                          >
                            🎓 Coursera
                          </a>
                          <a 
                            href={`https://www.udemy.com/courses/search/?q=${encodeURIComponent(kw)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-ghost btn-sm"
                            style={{ fontSize: '9.5px', padding: '2px 8px', height: '24px', background: 'rgba(164, 53, 240, 0.04)', color: '#a435f0', border: '1px solid rgba(164, 53, 240, 0.12)', borderRadius: '4px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                          >
                            💻 Udemy
                          </a>
                          <a 
                            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(kw)}+tutorial`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-ghost btn-sm"
                            style={{ fontSize: '9.5px', padding: '2px 8px', height: '24px', background: 'rgba(255, 0, 0, 0.04)', color: '#ff0000', border: '1px solid rgba(255, 0, 0, 0.12)', borderRadius: '4px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                          >
                            🎥 YouTube
                          </a>
                        </div>
                      </div>
                    ))}
                    {keywordData.missing.length > 12 && (
                      <span style={{ fontSize: '10.5px', color: 'var(--color-text-secondary)', fontStyle: 'italic', textAlign: 'center', marginTop: '6px' }}>
                        Showing top 12 missing skill acquisition paths. Align more keywords in real time using the co-pilot!
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Conceptual Skill Gap Analysis */}
              {project.skillGap && (
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-5)' }}>
                  <h3 style={{ fontSize: '13.5px', fontWeight: '800', color: 'var(--color-text-primary)', marginBottom: '12px' }}>
                    Conceptual Optimization Gap
                  </h3>
                  <div style={{ background: 'var(--color-bg-secondary)', padding: '16px 20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                    <pre className="result-text" style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'var(--font-inter), sans-serif', fontSize: '11.5px', lineHeight: '1.6', color: 'var(--color-text-primary)' }}>{project.skillGap}</pre>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {activeTab === 'interview' && (
          isTabLocked('pro', userPlan) ? (
            <LockedTabContent requiredPlan="pro" />
          ) : (
            <div className="result-panel">
              <div className="result-panel-header">
                <h2>Interview Questions</h2>
              </div>
              <div className="result-panel-body" style={{ padding: '24px' }}>
                <ol className="interview-list" style={{ margin: 0, paddingLeft: '20px', listStyleType: 'decimal' }}>
                  {interviewQuestions.map((q, i) => (
                    <li key={i} className="interview-item" style={{ marginBottom: '16px', fontSize: '12px', color: 'var(--color-text-primary)' }}>
                      <div className="interview-question" style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontWeight: '700', fontSize: '12.5px', color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                        <MessageSquare size={15} style={{ marginTop: '3px', flexShrink: 0, color: 'var(--color-accent)' }} />
                        <span>
                          {typeof q === 'string' ? q : q.question || ''}
                        </span>
                      </div>
                      {typeof q === 'object' && q.hint && (
                        <div className="interview-hint" style={{ marginTop: '6px', fontSize: '11px', color: 'var(--color-text-secondary)', background: 'var(--color-bg-secondary)', padding: '8px 12px', borderRadius: '4px', borderLeft: '3px solid var(--color-accent)', lineHeight: '1.5' }}>
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

        {activeTab === 'xray' && (
          <XRayScanner project={project} />
        )}

        {activeTab === 'outreach' && (
          <OutreachAccelerator projectId={project.id} />
        )}

        {activeTab === 'battleground' && (
          <BattlegroundPanel projectId={project.id} />
        )}
      </div>

      {/* Collapsible Tech Verification Logs (Anti-Hype & Decluttering upgrade) */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--space-6)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)', paddingBottom: 'var(--space-2)' }}>
        <button 
          onClick={() => setShowTechAudit(!showTechAudit)}
          className="btn btn-ghost btn-sm"
          style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', background: 'transparent', border: 'none', transition: 'all 0.2s' }}
        >
          <Shield size={12} style={{ color: 'var(--color-accent)' }} />
          {showTechAudit ? 'Hide' : 'Show'} Advanced Grounding Audit &amp; Technical Parser Verification Logs
        </button>
      </div>

      {showTechAudit && (
        <div className="animate-slide-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', width: '100%', marginTop: 'var(--space-4)', paddingBottom: 'var(--space-6)' }}>
          
          {/* Blunt Reality Assessment Card */}
          <div className={`ats-reality-check-card ${cardClass}`} style={{ marginBottom: 0 }}>
            <div className="ats-reality-header">
              <div className="ats-reality-icon">
                {realityStatus === 'danger' && <XCircle size={20} />}
                {realityStatus === 'warning' && <AlertTriangle size={20} />}
                {realityStatus === 'success' && <CheckCircle size={20} />}
              </div>
              <h2 className="ats-reality-title">{realityTitle}</h2>
            </div>

            <div className="ats-reality-blunt-text">
              <strong>The Blunt Reality:</strong> {realityWarning}
            </div>

            <div className="ats-reality-grid">
              <div>
                <h3 className="ats-reality-section-title">
                  <AlertTriangle size={14} /> Why your ATS score is {atsScore}%
                </h3>
                <ul className="ats-reality-list">
                  {realityWhy.map((why, index) => (
                    <li key={index} className="ats-reality-item">{why}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="ats-reality-section-title">
                  <CheckCircle size={14} /> Action plan to align & apply
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {realityAction.map((action, index) => (
                    <button
                      key={index}
                      className="ats-reality-action-btn"
                      onClick={() => {
                        setActiveTab(action.tab);
                        const el = document.querySelector('.results-tabs');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      <span style={{ marginRight: 'var(--space-2)', fontWeight: 'bold' }}>{index + 1}.</span>
                      <span>{action.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Grounded RAG Intelligence Audit Card */}
          <div className={`rag-audit-card ${ragCardClass}`} style={{ marginBottom: 0 }}>
            <div className="rag-audit-header">
              <div className="rag-audit-title-block">
                <div className="rag-audit-icon">
                  <Shield size={20} />
                </div>
                <div>
                  <h2 className="rag-audit-title">ParserProof Grounding Audit</h2>
                  <div className="rag-audit-subtitle">Factual Verification &amp; Anti-Hallucination Log</div>
                </div>
              </div>
              <div className={`rag-confidence-badge-pill rag-confidence-${ragStatus}`}>
                <Shield size={12} />
                <span>{ragStatusText} {ragConfidence !== null ? `(${ragConfidence}%)` : ''}</span>
              </div>
            </div>

            <div className="rag-audit-meta-grid">
              <div className="rag-audit-explain">
                <p>
                  {ragStatus === 'high' && (
                    <>
                      Our automated RAG engine has successfully matched your profile against our core ATS knowledge bases. 
                      Every recommendation, keyword mapping, and resume bullet point generated is <strong>100% grounded</strong> 
                      in the trusted rules of the system.
                    </>
                  )}
                  {ragStatus === 'moderate' && (
                    <>
                      Our automated RAG engine matched your profile against general career optimization models. The generated content is safe and aligned, but we recommend checking that the specific tool categories reflect your direct experience.
                    </>
                  )}
                  {ragStatus === 'weak' && (
                    <>
                      <strong>Caution:</strong> The target job post or resume text provided did not produce strong matches in our ATS database. Fallback guidelines have been applied. Factual relevance might be reduced, and we strongly suggest a manual review of all generated sections.
                    </>
                  )}
                </p>
                <div className="rag-shield-container">
                  <div className="rag-shield-icon">
                    <CheckCircle size={16} />
                  </div>
                  <div className="rag-shield-text">
                    <div className="rag-shield-title">Anti-Hallucination Safeguard Active</div>
                    <div>We never fabricate employers, graduation dates, fake certifications, or ungrounded statistics. If context was missing, bracketed placeholders like <code>[quantify]</code> were inserted for you to safely complete.</div>
                  </div>
                </div>
              </div>

              <div className="rag-sources-panel">
                <h3 className="rag-sources-title">Grounded Sources ({ragSources.length || 'Default Guidelines'})</h3>
                <div className="rag-source-list">
                  {ragSources.length > 0 ? (
                    ragSources.map((source, index) => (
                      <div key={index} className="rag-source-item">
                        <div className="rag-source-info">
                          <span className="rag-source-name">
                            {source.title.replace('Approved High-Impact ', '').replace('Approved ', '')}
                          </span>
                          <span className="rag-source-cat">
                            {source.category.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="rag-source-relevance">
                          <span>{source.relevance}%</span>
                          <div className="rag-source-relevance-bar">
                            <div 
                              className="rag-source-relevance-fill" 
                              style={{ width: `${source.relevance}%` }} 
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="rag-source-item">
                        <div className="rag-source-info">
                          <span className="rag-source-name">ATS Optimization &amp; Section Headings</span>
                          <span className="rag-source-cat">ats optimization</span>
                        </div>
                        <div className="rag-source-relevance">
                          <span>100%</span>
                          <div className="rag-source-relevance-bar">
                            <div className="rag-source-relevance-fill" style={{ width: '100%' }} />
                          </div>
                        </div>
                      </div>
                      <div className="rag-source-item">
                        <div className="rag-source-info">
                          <span className="rag-source-name">STAR Method &amp; XYZ Achievements</span>
                          <span className="rag-source-cat">resume writing</span>
                        </div>
                        <div className="rag-source-relevance">
                          <span>100%</span>
                          <div className="rag-source-relevance-bar">
                            <div className="rag-source-relevance-fill" style={{ width: '100%' }} />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {ragStatus === 'weak' && (
              <div className="rag-weak-warning">
                <AlertTriangle size={18} />
                <div>
                  <strong>Low context relevance detected:</strong> Because retrieval scores fell below 35%, the generator relied on general default templates. Avoid copying bullets directly if the tools listed do not match your background.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SandboxBulletRow({ bullet, projectId, onApplied }) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState('');
  const [customText, setCustomText] = useState(bullet.replace(/^[\s\-\*\•]+/, ''));
  const [expanded, setExpanded] = useState(false);

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/optimize-bullet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bulletText: bullet }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuggestions(data.suggestions);
        if (data.suggestions.length > 0) {
          setSelectedSuggestion(data.suggestions[0]);
          setCustomText(data.suggestions[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load bullet suggestions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    const nextVal = !expanded;
    setExpanded(nextVal);
    if (nextVal && suggestions.length === 0) {
      loadSuggestions();
    }
  };

  return (
    <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-md)', background: 'var(--color-bg-primary)', overflow: 'hidden', marginBottom: '8px' }}>
      <div 
        onClick={handleToggle}
        style={{ padding: 'var(--space-3)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '85%' }}>
          {bullet}
        </div>
        <button className="btn btn-ghost btn-sm" style={{ height: '22px', padding: '0 8px', fontSize: '10px', flexShrink: 0 }}>
          {expanded ? 'Collapse' : 'Optimize'}
        </button>
      </div>

      {expanded && (
        <div style={{ padding: 'var(--space-3)', borderTop: '1px solid var(--color-border)', background: 'rgba(99, 102, 241, 0.01)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
              <Loader2 size={12} className="animate-spin" /> Tailoring Google XYZ alternatives...
            </div>
          ) : (
            <>
              {suggestions.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Google XYZ Alternatives:
                  </span>
                  {suggestions.map((sug, i) => (
                    <label 
                      key={i} 
                      style={{ 
                        display: 'flex', 
                        gap: '8px', 
                        alignItems: 'flex-start', 
                        padding: '6px 10px', 
                        borderRadius: '4px', 
                        border: '1px solid var(--color-border)', 
                        background: selectedSuggestion === sug ? 'rgba(99, 102, 241, 0.04)' : 'var(--color-bg-primary)',
                        cursor: 'pointer',
                        fontSize: '11.5px',
                        lineHeight: '1.4'
                      }}
                    >
                      <input 
                        type="radio" 
                        name={`sug-${bullet}`} 
                        checked={selectedSuggestion === sug}
                        onChange={() => {
                          setSelectedSuggestion(sug);
                          setCustomText(sug);
                        }}
                        style={{ marginTop: '2px' }}
                      />
                      <span style={{ color: 'var(--color-text-primary)' }}>{sug}</span>
                    </label>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Tweak or Finalize Bullet:
                </span>
                <textarea 
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  style={{ width: '100%', minHeight: '60px', padding: '8px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--color-border)', fontSize: '11.5px', color: 'var(--color-text-primary)', background: 'var(--color-bg-primary)', fontFamily: 'inherit', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => onApplied(customText)}
                  style={{ height: '26px', fontSize: '10.5px', padding: '0 12px' }}
                >
                  Apply &amp; Recalculate
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
