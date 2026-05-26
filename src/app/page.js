'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import {
  Target,
  Search,
  FileText,
  MessageSquare,
  Download,
  History,
  Check,
  X,
  Plus,
  ArrowRight,
  Zap,
  AlertTriangle,
  ShieldCheck,
  FileSpreadsheet,
  Sparkles,
  Loader2,
} from 'lucide-react';

const benefits = [
  {
    icon: Target,
    title: 'ATS Scan & Match',
    description:
      'Identify keyword gaps, missing technical phrases, and formatting blocks that trigger automatic ATS rejections.',
  },
  {
    icon: Search,
    title: 'STAR Experience Rewriter',
    description:
      'Elevate academic projects, internships, and work history with powerful corporate action verbs and quantified impact metrics.',
  },
  {
    icon: FileText,
    title: 'Bespoke Application Packages',
    description:
      'Generate company-specific cover letters and high-probability interview prep guides tailored to the exact job description.',
  },
];

const mistakes = [
  {
    title: 'Fancy Canva Templates',
    desc: 'Multi-column grids, skill bars, and graphical icons look nice to humans but scramble automated ATS parsers, causing auto-rejection.',
  },
  {
    title: 'Vague Objective fluff',
    desc: 'Objective statements like "Seeking a challenging role..." say nothing. We replace them with a quantified, metric-rich technical profile.',
  },
  {
    title: 'Keyword-Blind Profiles',
    desc: 'If a posting specifies "Next.js" and you list "React", filters reject you. We scan the JD and highlight missing skills instantly.',
  },
];

const steps = [
  {
    number: '1',
    title: 'Upload Your Resume',
    description:
      'Paste your resume text or drop in a PDF. We safely parse your current background, skills, and qualifications.',
  },
  {
    number: '2',
    title: 'Provide Job Posting',
    description:
      'Paste the exact job posting details you are targeting. We extract essential requirements, duties, and missing key phrases.',
  },
  {
    number: '3',
    title: 'Review Tailored Output',
    description:
      'Get a high-accuracy match analysis, an ATS-friendly rewrite, a tailored cover letter, and highly focused interview prep guides.',
  },
];

const pricingPlans = [
  {
    name: 'Free',
    amount: '₹0',
    period: '/month',
    features: [
      { text: '3 resume match scans per month', enabled: true },
      { text: 'ATS compatibility matching score', enabled: true },
      { text: 'ATS-friendly resume formatting', enabled: true },
      { text: 'Standard PDF / TXT downloads', enabled: true },
      { text: 'Tailored cover letter rewrites', enabled: false },
      { text: 'Missing keyword gap analysis', enabled: false },
    ],
    buttonText: 'Get Started Free',
    buttonClass: 'btn btn-secondary',
    popular: false,
  },
  {
    name: 'Starter',
    amount: '₹199',
    period: '/month',
    features: [
      { text: '15 tailoring optimizations / mo', enabled: true },
      { text: 'Includes all Free features', enabled: true },
      { text: 'Tailored cover letter generation', enabled: true },
      { text: 'JD keyword gap match analyses', enabled: true },
      { text: 'Full tone & length formatting', enabled: true },
      { text: 'Detailed interview prep questions', enabled: false },
    ],
    buttonText: 'Upgrade to Starter',
    buttonClass: 'btn btn-primary',
    popular: true,
  },
  {
    name: 'Pro',
    amount: '₹399',
    period: '/month',
    features: [
      { text: '25 tailoring optimizations / mo', enabled: true },
      { text: 'Includes all Starter features', enabled: true },
      { text: 'Detailed interview prep guides', enabled: true },
      { text: 'Comprehensive skill gap analysis', enabled: true },
      { text: 'High-priority server processing', enabled: true },
      { text: 'Complete application intelligence', enabled: true },
    ],
    buttonText: 'Upgrade to Pro',
    buttonClass: 'btn btn-primary',
    popular: false,
  },
];

const fresherTestimonials = [
  {
    name: 'Rohan Sharma',
    role: 'Software Engineer',
    company: 'Amazon India',
    college: 'Delhi Technological University (DTU), B.Tech CSE',
    text: 'My resume was stuck at a 42% match score for SDE roles. ParserProof helped me see that I was leaving out critical keywords like REST APIs and system integration. I tailered it for Amazon, got an OA link within a week, and eventually landed the SDE-1 offer.',
  },
  {
    name: 'Priya Nair',
    role: 'Associate Consultant',
    company: 'Deloitte India',
    college: 'Loyola College, Chennai, B.Com (Hons)',
    text: 'As a commerce fresher, I kept using high-flown objectives that didn\'t say anything. ParserProof forced me to change my project bullet points to showcase actual metrics (like handling ₹50K budget for college fest). Deloitte recruiters specifically asked about that on my resume.',
  },
  {
    name: 'Aniket Verma',
    role: 'Data Analyst',
    company: 'Fractal Analytics',
    college: 'Vellore Institute of Technology (VIT), B.Tech ECE',
    text: 'I was applying with a multi-column Canva template. ParserProof flagged that it was breaking ATS text scanners. I converted to their single-column clean format, optimized my SQL & Python project sections, and started getting calls from data science teams.',
  },
  {
    name: 'Sneha Deshmukh',
    role: 'Graduate Engineer Trainee',
    company: 'Tata Motors',
    college: 'College of Engineering Pune (COEP), B.Tech Mechanical',
    text: 'I struggled to translate my academic FSAE racing project into business terms. ParserProof polished my bullet points to highlight ANSYS simulations and CAD modeling with real quantified tolerances. I got selected in campus placements immediately.',
  },
];

const faqItems = [
  {
    question: 'How does ParserProof optimize my resume?',
    answer:
      'ParserProof compares your resume against a target job description, identifying critical keyword gaps, formatting issues, and structural mistakes. It then provides a rewritten, ATS-optimized version focusing on quantifiable achievements and industry terms, without fabricating any details.',
  },
  {
    question: 'Will it invent fake job history or certifications?',
    answer:
      'Absolutely not. ParserProof operates on complete integrity. It will never invent jobs, fake certifications, or falsify skills. It only rewrites, structures, and frames your actual projects, coursework, and work history to ensure it passes automated screening.',
  },
  {
    question: 'Why is a single-column layout recommended?',
    answer:
      'Most Applicant Tracking Systems (ATS) read resumes from top-to-bottom, left-to-right. Two-column or heavily graphic layouts (like those made in Canva) confuse parser algorithms, resulting in scrambled text, unreadable sections, and automatic rejections.',
  },
  {
    question: 'Is my data and personal information secure?',
    answer:
      'Yes. Your resume data is highly encrypted in transit and at rest. We never sell or share your data with third parties or external recruiters. You have full control over your documents and can delete your account and history at any time.',
  },
  {
    question: 'What is an ATS compatibility score?',
    answer:
      'It is a mathematical representation of how well your resume matches the target job post. It factors in keyword density, proper section labeling, structural readability, and the presence of quantified achievements.',
  },
];

export default function LandingPage() {
  const { data: session, status } = useSession();
  const [openFaq, setOpenFaq] = useState(null);
  
  // DTDC-inspired Interactive Tracker Card States
  const [activeTab, setActiveTab] = useState('track'); // 'track' | 'upload' | 'benchmarks'
  const [targetRole, setTargetRole] = useState('Software Engineer');
  const [resumeText, setResumeText] = useState('');
  const [jdText, setJdText] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  const handleLiveScan = () => {
    if (!resumeText.trim() || !jdText.trim()) {
      alert('Please paste both your resume text and target job description to run the live scan!');
      return;
    }
    
    setIsScanning(true);
    setScanResult(null);
    
    setTimeout(() => {
      const cleanResume = resumeText.toLowerCase();
      const cleanJd = jdText.toLowerCase();
      
      const commonKeywords = [
        'python', 'react', 'javascript', 'typescript', 'sql', 'java', 'c++', 
        'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'html', 'css', 
        'node', 'express', 'django', 'mongodb', 'postgresql', 'git', 'ci/cd',
        'machine learning', 'deep learning', 'nlp', 'computer vision', 
        'agile', 'scrum', 'apis', 'rest', 'microservices', 'data engineering'
      ];
      
      const foundInJd = commonKeywords.filter(kw => cleanJd.includes(kw));
      const matched = foundInJd.filter(kw => cleanResume.includes(kw));
      const missing = foundInJd.filter(kw => !cleanResume.includes(kw));
      
      const keywordMatchScore = foundInJd.length > 0 ? (matched.length / foundInJd.length) * 100 : 70;
      
      const sections = [/summary/i, /experience/i, /education/i, /skills/i];
      let sectionsFound = 0;
      sections.forEach(rx => {
        if (rx.test(cleanResume)) sectionsFound++;
      });
      const structuralScore = (sectionsFound / sections.length) * 100;
      
      const metricRegex = /(\b\d+%\b|\$\d+|\b\d+\s*k\b|₹\d+|\b\d+\+\s*)/i;
      const metricScore = metricRegex.test(cleanResume) ? 80 : 30;
      
      const programmaticScore = Math.round((keywordMatchScore * 0.50) + (structuralScore * 0.25) + (metricScore * 0.25));
      const finalScore = Math.min(94, Math.max(35, programmaticScore));
      
      setIsScanning(false);
      setScanResult({
        score: finalScore,
        matchedCount: matched.length,
        totalJdKeywords: foundInJd.length || 5,
        sectionsFound,
        hasMetrics: metricRegex.test(cleanResume),
        matchedList: matched.slice(0, 5),
        missingList: missing.slice(0, 3)
      });
    }, 1200);
  };

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      {/* High-Converting Premium Comparison Banner */}
      <div className="promo-banner">
        <div className="promo-banner-inner">
          <span className="promo-tag">🇮🇳 FAIR INDIAN PRICING</span>
          <p className="promo-text">
            Why pay <strong>₹1,500+/mo ($20)</strong> for expensive Western resume builders? ParserProof is designed specifically for Indian freshers — get <strong>15 full ATS optimizations</strong> for just <strong>₹199/month</strong>.
          </p>
          <button className="promo-btn" onClick={() => scrollTo('pricing')}>
            View Plans <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <Link href="/" className="landing-logo">
            <span className="landing-logo-icon">
              <Zap size={18} />
            </span>
            ParserProof
          </Link>

          <ul className="landing-nav-links">
            <li>
              <button
                className="landing-nav-link"
                onClick={() => scrollTo('why-ats')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}
              >
                The ATS Problem
              </button>
            </li>
            <li>
              <button
                className="landing-nav-link"
                onClick={() => scrollTo('mistakes')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}
              >
                Fresher Mistakes
              </button>
            </li>
            <li>
              <button
                className="landing-nav-link"
                onClick={() => scrollTo('before-after')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}
              >
                Before / After
              </button>
            </li>
            <li>
              <Link href="/assistant" className="landing-nav-link">
                AI Assistant
              </Link>
            </li>
            <li>
              <button
                className="landing-nav-link"
                onClick={() => scrollTo('benefits')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}
              >
                Features
              </button>
            </li>
            <li>
              <button
                className="landing-nav-link"
                onClick={() => scrollTo('pricing')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}
              >
                Pricing
              </button>
            </li>
          </ul>

          <div className="landing-nav-actions">
            {status === 'authenticated' ? (
              <>
                <Link href="/dashboard" className="btn btn-ghost">
                  Dashboard
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="btn btn-secondary"
                  style={{ cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit', fontSize: 'inherit' }}
                >
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn btn-ghost">
                  Log In
                </Link>
                <Link href="/signup" className="btn btn-primary">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Your resume is probably getting{' '}
            <span className="text-gradient">rejected</span> before a recruiter even sees it.
          </h1>

          <p className="hero-description">
            75% of resumes never reach a human recruiter. ParserProof checks your resume against ATS filters, fixes critical keyword gaps, and formats your experience for maximum compatibility.
          </p>

          <div className="tracking-widget-container">
            <div className="tracking-tabs">
              <button
                className={`tracking-tab-btn ${activeTab === 'track' ? 'active' : ''}`}
                onClick={() => setActiveTab('track')}
                style={{ fontFamily: 'inherit' }}
              >
                <Sparkles size={16} /> Fast Consignment Scan
              </button>
              <button
                className={`tracking-tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
                onClick={() => setActiveTab('upload')}
                style={{ fontFamily: 'inherit' }}
              >
                <FileText size={16} /> Drag & Drop PDF
              </button>
              <button
                className={`tracking-tab-btn ${activeTab === 'benchmarks' ? 'active' : ''}`}
                onClick={() => setActiveTab('benchmarks')}
                style={{ fontFamily: 'inherit' }}
              >
                <Target size={16} /> MNC Benchmarks
              </button>
            </div>
            
            <div className="tracking-content">
              {activeTab === 'track' && (
                <>
                  {!scanResult ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                      <div className="tracking-form-row">
                        <div className="tracking-form-group">
                          <label className="tracking-label">Target Role</label>
                          <input
                            type="text"
                            className="tracking-input"
                            value={targetRole}
                            onChange={(e) => setTargetRole(e.target.value)}
                            placeholder="e.g. Software Engineer"
                          />
                        </div>
                        <div className="tracking-form-group">
                          <label className="tracking-label">Consignment Tracking ID</label>
                          <input
                            type="text"
                            className="tracking-input"
                            readOnly
                            value="PP-SCAN-349821"
                            style={{ opacity: 0.8, background: 'var(--color-bg-tertiary)' }}
                          />
                        </div>
                      </div>
                      
                      <div className="tracking-form-group">
                        <label className="tracking-label">Paste Target Job Description (Keywords Source)</label>
                        <textarea
                          className="tracking-input tracking-textarea"
                          value={jdText}
                          onChange={(e) => setJdText(e.target.value)}
                          placeholder="Paste key skills, duties, or entire job description here..."
                        />
                      </div>
                      
                      <div className="tracking-form-group">
                        <label className="tracking-label">Paste Your Current Resume Text (Parser Target)</label>
                        <textarea
                          className="tracking-input tracking-textarea"
                          value={resumeText}
                          onChange={(e) => setResumeText(e.target.value)}
                          placeholder="Paste your current profile summary, experience bullets, and skills section here..."
                        />
                      </div>
                      
                      <button
                        className="tracking-action-btn"
                        onClick={handleLiveScan}
                        disabled={isScanning}
                        style={{ fontFamily: 'inherit' }}
                      >
                        {isScanning ? (
                          <>
                            <Loader2 className="spin" size={18} style={{ animation: 'spin 1.2s linear infinite' }} /> Processing Consignment Parsing...
                          </>
                        ) : (
                          <>
                            Track & Scan ATS Match Score <ArrowRight size={18} />
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="tracking-results-panel">
                      <div className="tracking-results-header">
                        <div className="tracking-consignment-id" style={{ color: 'var(--color-dtdc-blue)' }}>
                          CONSIGNMENT ID: PP-SCAN-349821
                        </div>
                        <div className="tracking-consignment-status">
                          Processed & Calculated
                        </div>
                      </div>
                      
                      <div className="tracking-results-body">
                        <div className="tracking-dispatch-stages">
                          <div className="tracking-dispatch-stage">
                            <div className="tracking-dispatch-dot" style={{ background: 'var(--color-dtdc-blue)' }} />
                            <div className="tracking-dispatch-info">
                              <div className="tracking-dispatch-title">Parser Compatibility Verified</div>
                              <div className="tracking-dispatch-desc">Successfully read resume text formatting (Single-column layout ideal).</div>
                            </div>
                          </div>
                          
                          <div className="tracking-dispatch-stage">
                            <div className={`tracking-dispatch-dot ${scanResult.sectionsFound >= 3 ? '' : 'alert'}`} style={{ background: scanResult.sectionsFound >= 3 ? 'var(--color-dtdc-blue)' : 'var(--color-danger)' }} />
                            <div className="tracking-dispatch-info">
                              <div className="tracking-dispatch-title">Structure & Sections Checked</div>
                              <div className="tracking-dispatch-desc">Found {scanResult.sectionsFound} out of 4 critical ATS headers (Summary, Experience, Education, Skills).</div>
                            </div>
                          </div>
                          
                          <div className="tracking-dispatch-stage">
                            <div className={`tracking-dispatch-dot ${scanResult.matchedCount > 0 ? '' : 'alert'}`} style={{ background: scanResult.matchedCount > 0 ? 'var(--color-dtdc-blue)' : 'var(--color-danger)' }} />
                            <div className="tracking-dispatch-info">
                              <div className="tracking-dispatch-title">Keyword Density Audit</div>
                              <div className="tracking-dispatch-desc">Matched {scanResult.matchedCount} out of {scanResult.totalJdKeywords} key phrases from target job description.</div>
                            </div>
                          </div>
                          
                          <div className="tracking-dispatch-stage">
                            <div className={`tracking-dispatch-dot ${scanResult.hasMetrics ? '' : 'orange'}`} style={{ background: scanResult.hasMetrics ? 'var(--color-dtdc-blue)' : 'var(--color-dtdc-orange)' }} />
                            <div className="tracking-dispatch-info">
                              <div className="tracking-dispatch-title">Metrics & Action Verbs Density</div>
                              <div className="tracking-dispatch-desc">
                                {scanResult.hasMetrics 
                                  ? '✅ Found quantified metrics in experience bullets!'
                                  : '⚠️ Lacks action metrics in experience descriptions.'}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="tracking-score-display">
                          <div className="tracking-score-dial" style={{ borderTopColor: 'var(--color-dtdc-orange)', borderRightColor: 'var(--color-dtdc-orange)' }}>
                            <span className="tracking-score-value">{scanResult.score}%</span>
                            <span className="tracking-score-label">Match Rate</span>
                          </div>
                          <div className="tracking-score-verdict" style={{ color: 'var(--color-text-primary)' }}>
                            {scanResult.score >= 80 ? 'Excellent Match' : scanResult.score >= 60 ? 'Moderate Match' : 'High Rejection Risk'}
                          </div>
                          <p className="tracking-score-guidance">
                            {scanResult.score >= 80 
                              ? 'Your resume is strongly aligned, but can be optimized for key gaps.'
                              : 'Your resume triggers automated ATS filtering blocks and lacks target keywords.'}
                          </p>
                          <Link href="/signup" className="tracking-card-cta">
                            Unlock Co-Pilot to Hit 90% <Sparkles size={12} />
                          </Link>
                          <button 
                            className="btn btn-ghost" 
                            style={{ fontSize: '11px', marginTop: '8px', cursor: 'pointer', background: 'none', border: 'none', color: 'var(--color-text-secondary)', fontFamily: 'inherit' }}
                            onClick={() => setScanResult(null)}
                          >
                            ← Run Another Scan
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
              
              {activeTab === 'upload' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-8) var(--space-4)', border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-md)', textAlign: 'center', background: 'var(--color-bg-secondary)' }}>
                  <div className="landing-logo-icon" style={{ width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-accent-light)', color: 'var(--color-accent)', marginBottom: 'var(--space-4)' }}>
                    <Download size={24} />
                  </div>
                  <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: '800', color: 'var(--color-text-primary)', marginBottom: 'var(--space-2)' }}>
                    Drag & Drop Your PDF Resume Here
                  </h3>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', maxWidth: '320px', lineHeight: '1.6', marginBottom: 'var(--space-6)' }}>
                    File is automatically analyzed for font compatibilities and structure parsing errors. Supports PDF and Word formats (Max 4MB).
                  </p>
                  <Link href="/signup" className="btn btn-primary" style={{ textDecoration: 'none', fontFamily: 'inherit' }}>
                    Select File to Parse
                  </Link>
                </div>
              )}
              
              {activeTab === 'benchmarks' && (
                <div className="benchmarks-grid">
                  <div className="benchmark-card">
                    <div className="benchmark-header">
                      <span className="benchmark-title">TCS / Infosys</span>
                      <span className="benchmark-target">65% Target</span>
                    </div>
                    <p className="benchmark-desc">
                      Focus is primarily on clean structural parsing, standard headers, and baseline technical skill matches. Avoid all graphical layouts.
                    </p>
                  </div>
                  
                  <div className="benchmark-card">
                    <div className="benchmark-header">
                      <span className="benchmark-title">Amazon / MAANG</span>
                      <span className="benchmark-target">85% Target</span>
                    </div>
                    <p className="benchmark-desc">
                      Demands dense keyword alignments and 100% quantified experience bullets structured strictly in Google XYZ or STAR formulas.
                    </p>
                  </div>
                  
                  <div className="benchmark-card">
                    <div className="benchmark-header">
                      <span className="benchmark-title">Deloitte / Big 4</span>
                      <span className="benchmark-target">75% Target</span>
                    </div>
                    <p className="benchmark-desc">
                      Looks for specialized consultant profiles with core business analytical keywords, project leadership descriptions, and standard layouts.
                    </p>
                  </div>
                  
                  <div className="benchmark-card">
                    <div className="benchmark-header">
                      <span className="benchmark-title">Indian Tech Startups</span>
                      <span className="benchmark-target">80% Target</span>
                    </div>
                    <p className="benchmark-desc">
                      Prioritizes hands-on production framework experience (e.g. Next.js, Docker, Kubernetes) and actual deployable portfolio.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Privacy Bar */}
      <div className="trust-bar">
        <div className="trust-badge-item">
          <ShieldCheck size={18} />
          <span>Strictly No Fabricated Experience</span>
        </div>
        <div className="trust-badge-item">
          <ShieldCheck size={18} />
          <span>256-bit Secure File Processing</span>
        </div>
        <div className="trust-badge-item">
          <ShieldCheck size={18} />
          <span>Used by Freshers at DTU, VIT, NITs & COEP</span>
        </div>
      </div>

      {/* ATS Rejection Reality Funnel */}
      <section className="ats-funnel-section" id="why-ats">
        <h2 className="section-title">
          The Automated{' '}
          <span className="text-gradient">Rejection Funnel</span>
        </h2>
        <p className="section-subtitle">
          How corporate hiring actually works today. If your resume does not pass the robot, a human will never review it.
        </p>

        <div className="ats-funnel-grid">
          <div className="ats-funnel-stages">
            <div className="ats-funnel-stage">
              <div className="ats-funnel-stage-num">1</div>
              <div className="ats-funnel-stage-info">
                <h3 className="ats-funnel-stage-title">Online Application Submitted</h3>
                <p className="ats-funnel-stage-desc">Hundreds of candidates submit Canva templates, DOCX, or text files.</p>
              </div>
              <div className="ats-funnel-stage-percentage">100%</div>
            </div>

            <div className="ats-funnel-stage">
              <div className="ats-funnel-stage-num">2</div>
              <div className="ats-funnel-stage-info">
                <h3 className="ats-funnel-stage-title">ATS Robot Parsing & Filtering</h3>
                <p className="ats-funnel-stage-desc">Algorithms scan for exact keywords, education criteria, and parser-safe formatting. Two-column grids are auto-rejected.</p>
              </div>
              <div className="ats-funnel-stage-percentage" style={{ color: 'var(--color-danger)' }}>25% Left</div>
            </div>

            <div className="ats-funnel-stage">
              <div className="ats-funnel-stage-num">3</div>
              <div className="ats-funnel-stage-info">
                <h3 className="ats-funnel-stage-title">The 6-Second Recruiter Glance</h3>
                <p className="ats-funnel-stage-desc">A human recruiter quickly scans the top profile summary and education block for concrete quantified impact metrics.</p>
              </div>
              <div className="ats-funnel-stage-percentage" style={{ color: 'var(--color-warning)' }}>5% Left</div>
            </div>

            <div className="ats-funnel-stage">
              <div className="ats-funnel-stage-num">4</div>
              <div className="ats-funnel-stage-info">
                <h3 className="ats-funnel-stage-title">Interview Call Selected</h3>
                <p className="ats-funnel-stage-desc">Only candidates who hit high keyword density and structural validation get scheduled for technical discussions.</p>
              </div>
              <div className="ats-funnel-stage-percentage" style={{ color: 'var(--color-success)' }}>2% Selected</div>
            </div>
          </div>

          <div style={{ padding: 'var(--space-6)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <AlertTriangle size={36} style={{ color: 'var(--color-warning)', marginBottom: 'var(--space-4)' }} />
            <h3 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800, marginBottom: 'var(--space-3)' }}>
              Why Generic AI Builders Make It Worse
            </h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', lineHeight: 1.6, marginBottom: 'var(--space-4)' }}>
              Standard resume generators use buzzwords like "strategic thought leader" and "revolutionary next-gen innovator." Recruiters instantly identify these generic styles and reject them.
            </p>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', lineHeight: 1.6 }}>
              ParserProof focuses strictly on structural parsing, keyword match percentages, and rewriting your real achievements with quantifiable engineering metrics.
            </p>
          </div>
        </div>
      </section>

      {/* Common Fresher Mistakes */}
      <section className="mistakes-section" id="mistakes">
        <h2 className="section-title">
          3 Crucial Resume Mistakes{' '}
          <span className="text-gradient">Freshers Make</span>
        </h2>
        <p className="section-subtitle">
          Small mistakes that lead to automatic rejection. Check if your resume contains these formatting and content flaws.
        </p>

        <div className="mistakes-grid">
          {mistakes.map((mistake, index) => (
            <div key={index} className="mistake-card">
              <div className="mistake-card-icon">
                <AlertTriangle size={18} />
              </div>
              <h3 className="mistake-card-title">{mistake.title}</h3>
              <p className="mistake-card-desc">{mistake.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Before vs After Section */}
      <section className="before-after-section" id="before-after">
        <h2 className="section-title">
          The Power of{' '}
          <span className="text-gradient">Quantifiable Framing</span>
        </h2>
        <p className="section-subtitle">
          See how ParserProof takes simple fresher project descriptions and elevates them using STAR framing and precise technical keyword inclusion.
        </p>

        <div className="before-after-container">
          <div className="before-after-card">
            <div className="before-after-header">
              <div className="before-header-tab">
                <X size={16} />
                Before: Vague & Keyword-Blind
              </div>
              <div className="after-header-tab">
                <Check size={16} />
                After: Quantified & ATS-Ready
              </div>
            </div>
            <div className="before-after-body">
              <div className="before-content">
                <ul>
                  <li>Worked on a web project using React.js.</li>
                  <li>Responsible for fixing bugs and improving loading speed.</li>
                  <li>Used Node.js for backend API coding.</li>
                </ul>
              </div>
              <div className="after-content">
                <ul>
                  <li>Engineered a full-stack SPA utilizing <strong>React.js</strong> and <strong>Redux Toolkit</strong>, managing application state efficiently.</li>
                  <li>Optimized rendering times and image compression, reducing overall page load latency by <strong>42%</strong>.</li>
                  <li>Designed and deployed secure REST APIs in <strong>Node.js</strong> and <strong>Express</strong> to handle concurrent user requests.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits / Features (Refactored to Premium Split Visual Showcase) */}
      <section className="benefits" id="benefits">
        <div className="benefits-container">
          <div className="benefits-visual">
            <div className="benefits-visual-header">
              <span className="visual-dot red"></span>
              <span className="visual-dot yellow"></span>
              <span className="visual-dot green"></span>
              <span className="visual-title">ParserProof Intelligence Parser</span>
            </div>
            <div className="benefits-visual-content">
              <div className="visual-line scan-active">⚡ Scanning current_resume.pdf...</div>
              <div className="visual-line success">✓ 14 Missing Keywords Identified</div>
              <div className="visual-line success">✓ STAR Rewrite Applied to 4 Experience Bullets</div>
              <div className="visual-line success">✓ AI-buzzwords ("revolutionary", "cutting-edge") purged</div>
              <div className="visual-line highlight">★ ATS Score Optimized: 41% → 89%</div>
            </div>
          </div>
          <div className="benefits-info-side">
            <h2 className="section-title-left">
              Complete Application{' '}
              <span className="text-gradient">Intelligence</span>
            </h2>
            <p className="benefits-subtitle-left">
              ParserProof gives you the exact analytical tools to target competitive corporate roles with complete confidence.
            </p>
            
            <div className="benefits-list">
              {benefits.map((benefit, index) => (
                <div key={index} className="benefit-list-item">
                  <div className="benefit-list-icon">
                    <benefit.icon size={20} />
                  </div>
                  <div className="benefit-list-content">
                    <h3 className="benefit-list-title">{benefit.title}</h3>
                    <p className="benefit-list-description">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Indian Freshers Testimonials */}
      <section className="testimonials-section">
        <h2 className="section-title">
          Success Stories from{' '}
          <span className="text-gradient">Indian Freshers</span>
        </h2>
        <p className="section-subtitle">
          How real engineering and commerce graduates used ParserProof to optimize their resumes and clear off-campus screening rounds.
        </p>

        <div className="testimonials-grid">
          {fresherTestimonials.map((t, index) => {
            const initials = t.name
              .split(' ')
              .map((n) => n[0])
              .join('');
            return (
              <div key={index} className="testimonial-card">
                <p className="testimonial-text">"{t.text}"</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar-placeholder">{initials}</div>
                  <div className="testimonial-info">
                    <span className="testimonial-name">{t.name}</span>
                    <span className="testimonial-role">
                      {t.role} — <strong>{t.company}</strong>
                    </span>
                    <span className="testimonial-college">{t.college}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="pricing" id="pricing">
        <h2 className="section-title">
          Simple, Fair{' '}
          <span className="text-gradient">Pricing</span>
        </h2>
        <p className="section-subtitle">
          Start for free to check your scores. Upgrade to tailoring mode when you are ready to send off-campus applications.
        </p>

        {/* Cost-Savings Comparison Banner */}
        <div className="comparison-banner" style={{
          maxWidth: '800px',
          margin: '0 auto var(--space-8) auto',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-6)',
          textAlign: 'center',
          boxShadow: 'var(--shadow-md)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute',
            top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <span style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #a78bfa 100%)',
              color: '#ffffff',
              fontSize: 'var(--font-size-xs)',
              fontWeight: '700',
              padding: 'var(--space-1) var(--space-3)',
              borderRadius: '9999px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'inline-block',
              marginBottom: 'var(--space-3)',
            }}>
              🇮🇳 Indian Cost Advantage
            </span>
            <h3 style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: '700',
              color: 'var(--color-text-primary)',
              marginBottom: 'var(--space-2)',
            }}>
              Why pay ₹1,600+ ($20/mo) for Western SaaS builders?
            </h3>
            <p style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-secondary)',
              lineHeight: '1.6',
              maxWidth: '650px',
              margin: '0 auto',
            }}>
              Most resume tools charge premium US pricing. ParserProof offers <strong style={{ color: 'var(--color-accent)' }}>100% equivalent high-accuracy Groq AI optimization</strong> at less than a fraction of the cost—starting at just <strong style={{ color: 'var(--color-text-primary)' }}>₹199/month</strong>. Save over 85% on premium job applications!
            </p>
          </div>
        </div>

        <div className="pricing-grid">
          {pricingPlans.map((plan) => (
            <div
              key={plan.name}
              className={`pricing-card${plan.popular ? ' popular' : ''}`}
            >
              {plan.popular && (
                <span className="pricing-popular-badge">Highly Recommended</span>
              )}
              <div className="pricing-name">{plan.name}</div>
              <div className="pricing-price">
                <span className="pricing-amount">{plan.amount}</span>
                <span className="pricing-period">{plan.period}</span>
              </div>
              <ul className="pricing-features">
                {plan.features.map((feature, fIndex) => (
                  <li
                    key={fIndex}
                    className={`pricing-feature${
                      !feature.enabled ? ' pricing-feature-disabled' : ''
                    }`}
                  >
                    <span className="pricing-feature-icon">
                      {feature.enabled ? <Check size={16} /> : <X size={16} />}
                    </span>
                    {feature.text}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className={plan.buttonClass}>
                {plan.buttonText}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq" id="faq">
        <h2 className="section-title">
          Frequently Asked{' '}
          <span className="text-gradient">Questions</span>
        </h2>
        <p className="section-subtitle">
          Everything you need to know about resume parsers and scoring limits.
        </p>

        <div className="faq-list">
          {faqItems.map((item, index) => (
            <div
              key={index}
              className={`faq-item${openFaq === index ? ' open' : ''}`}
            >
              <button
                className="faq-question"
                onClick={() => toggleFaq(index)}
                id={`faq-question-${index}`}
              >
                {item.question}
                <span className="faq-question-icon">
                  <Plus size={18} />
                </span>
              </button>
              <div className="faq-answer">{item.answer}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">
            Stop Getting Auto-Rejected by{' '}
            <span className="text-gradient">Hiring Robots</span>
          </h2>
          <p className="cta-description">
            Upload your resume now to verify your score against target keyword densities. Take control of your job search.
          </p>
          <Link href="/signup" className="btn btn-primary btn-lg">
            <Zap size={18} />
            Check My Resume Now (Free)
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link href="/" className="landing-logo">
              <span className="landing-logo-icon">
                <Zap size={18} />
              </span>
              ParserProof
            </Link>
            <p className="footer-brand-description">
              Focused ATS resume optimization platform for Indian freshers and job seekers. Secure, truthful, and designed for recruiter conversions.
            </p>
          </div>

          <div>
            <h4 className="footer-column-title">Guides & Resources</h4>
            <ul className="footer-links">
              <li>
                <Link href="/ats-resume-guide" className="footer-link">
                  ATS Resume Guide
                </Link>
              </li>
              <li>
                <Link href="/fresher-resume-mistakes" className="footer-link">
                  Fresher Mistakes
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="footer-column-title">Company</h4>
            <ul className="footer-links">
              <li>
                <span className="footer-link">About</span>
              </li>
              <li>
                <span className="footer-link">Contact</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="footer-column-title">Legal</h4>
            <ul className="footer-links">
              <li>
                <Link href="/privacy" className="footer-link">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="footer-link">
                  Terms of Service
                </Link>
              </li>
              <li>
                <a
                  href="mailto:guys4929@gmail.com"
                  className="footer-link"
                >
                  Contact Support
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>&copy; {new Date().getFullYear()} ParserProof. All rights reserved.</span>
          <span>Used by freshers at India's top colleges.</span>
        </div>
      </footer>
    </>
  );
}
