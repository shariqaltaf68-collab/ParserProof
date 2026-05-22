'use client';

import { useState } from 'react';
import Link from 'next/link';
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
} from 'lucide-react';

const benefits = [
  {
    icon: Target,
    title: 'ATS Scan & Match',
    description:
      'We run your resume through industry-standard parser logic to identify keyword gaps and formatting blocks that trigger auto-rejections.',
  },
  {
    icon: Search,
    title: 'Resume Tailoring',
    description:
      'Instantly generate a tailored version of your resume aligned with the exact job description keywords and experience expectations.',
  },
  {
    icon: FileText,
    title: 'Bespoke Cover Letters',
    description:
      'Generate highly focused, company-specific cover letters that directly connect your background to the target role requirements.',
  },
  {
    icon: MessageSquare,
    title: 'Curated Interview Prep',
    description:
      'Get 8 job-specific interview questions with step-by-step response strategies based on your actual history and the job posting.',
  },
  {
    icon: Download,
    title: 'ATS-Friendly Downloads',
    description:
      'Download clean, parser-optimized PDF or plain text files of your tailored documents, ready for any online job application portal.',
  },
  {
    icon: History,
    title: 'Version Control',
    description:
      'Track and organize custom versions of your resume for every single job application without cluttering your local drive.',
  },
];

const mistakes = [
  {
    title: 'Generic Objective Statements',
    desc: 'Using vague fluff like "Seeking a challenging role in a dynamic organization..." tells recruiters nothing. We replace this with a quantified profile summary highlighting core technical competencies.',
  },
  {
    title: 'Zero Quantified Outcomes',
    desc: 'Writing "Responsible for coding web apps" is a major mistake. ResumePilot forces metric inclusion (e.g. "reduced latency by 40%") to show real, measurable engineering impact.',
  },
  {
    title: 'Two-Page Clutter as a Fresher',
    desc: 'Unless you have 5+ years of experience, a fresher resume must strictly fit on one page. Our formatting structure keeps your content concise, dense, and punchy.',
  },
  {
    title: 'Keyword-Blind Descriptions',
    desc: 'If the job description asks for "Next.js" and you only list "React", the ATS will likely filter you out. Our match analysis flags missing keyword terms instantly.',
  },
  {
    title: 'Fancy Graphical Layouts',
    desc: 'Multi-column layouts, graphics, and skill bars look nice to humans but completely break ATS text parsers. We stick strictly to single-column, parser-safe layouts.',
  },
  {
    title: 'Fabricating Experience',
    desc: 'Generic tools write fake jobs. We refuse to do this. We focus on rewriting and framing your ACTUAL college projects, internships, and coursework in professional corporate terminology.',
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
    amount: '₹499',
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
    name: 'Max',
    amount: '₹999',
    period: '/month',
    features: [
      { text: '50 tailoring optimizations / mo', enabled: true },
      { text: 'Includes all Starter features', enabled: true },
      { text: 'Detailed interview prep guides', enabled: true },
      { text: 'Comprehensive skill gap analysis', enabled: true },
      { text: 'High-priority server processing', enabled: true },
      { text: 'Complete application intelligence', enabled: true },
    ],
    buttonText: 'Upgrade to Max',
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
    text: 'My resume was stuck at a 42% match score for SDE roles. ResumePilot helped me see that I was leaving out critical keywords like REST APIs and system integration. I tailered it for Amazon, got an OA link within a week, and eventually landed the SDE-1 offer.',
  },
  {
    name: 'Priya Nair',
    role: 'Associate Consultant',
    company: 'Deloitte India',
    college: 'Loyola College, Chennai, B.Com (Hons)',
    text: 'As a commerce fresher, I kept using high-flown objectives that didn\'t say anything. ResumePilot forced me to change my project bullet points to showcase actual metrics (like handling ₹50K budget for college fest). Deloitte recruiters specifically asked about that on my resume.',
  },
  {
    name: 'Aniket Verma',
    role: 'Data Analyst',
    company: 'Fractal Analytics',
    college: 'Vellore Institute of Technology (VIT), B.Tech ECE',
    text: 'I was applying with a multi-column Canva template. ResumePilot flagged that it was breaking ATS text scanners. I converted to their single-column clean format, optimized my SQL & Python project sections, and started getting calls from data science teams.',
  },
  {
    name: 'Sneha Deshmukh',
    role: 'Graduate Engineer Trainee',
    company: 'Tata Motors',
    college: 'College of Engineering Pune (COEP), B.Tech Mechanical',
    text: 'I struggled to translate my academic FSAE racing project into business terms. ResumePilot polished my bullet points to highlight ANSYS simulations and CAD modeling with real quantified tolerances. I got selected in campus placements immediately.',
  },
];

const faqItems = [
  {
    question: 'How does ResumePilot optimize my resume?',
    answer:
      'ResumePilot compares your resume against a target job description, identifying critical keyword gaps, formatting issues, and structural mistakes. It then provides a rewritten, ATS-optimized version focusing on quantifiable achievements and industry terms, without fabricating any details.',
  },
  {
    question: 'Will it invent fake job history or certifications?',
    answer:
      'Absolutely not. ResumePilot operates on complete integrity. It will never invent jobs, fake certifications, or falsify skills. It only rewrites, structures, and frames your actual projects, coursework, and work history to ensure it passes automated screening.',
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
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <Link href="/" className="landing-logo">
            <span className="landing-logo-icon">
              <Zap size={18} />
            </span>
            ResumePilot
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
            <Link href="/login" className="btn btn-ghost">
              Log In
            </Link>
            <Link href="/signup" className="btn btn-primary">
              Get Started
            </Link>
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
            75% of resumes never reach a human recruiter. ResumePilot checks your resume against ATS filters, fixes critical keyword gaps, and formats your experience for maximum compatibility.
          </p>

          <div className="hero-actions">
            <Link href="/signup" className="btn btn-primary btn-lg">
              Check My ATS Score Free <ArrowRight size={18} />
            </Link>
            <button
              className="btn btn-secondary btn-lg"
              onClick={() => scrollTo('why-ats')}
            >
              Understand Why Resumes Fail
            </button>
          </div>

          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-value">800+</div>
              <div className="hero-stat-label">Indian Freshers Placed</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">+34</div>
              <div className="hero-stat-label">Avg. ATS Match Score Boost</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">&lt; 3 min</div>
              <div className="hero-stat-label">Average Tailoring Speed</div>
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
              ResumePilot focuses strictly on structural parsing, keyword match percentages, and rewriting your real achievements with quantifiable engineering metrics.
            </p>
          </div>
        </div>
      </section>

      {/* Common Fresher Mistakes */}
      <section className="mistakes-section" id="mistakes">
        <h2 className="section-title">
          6 Crucial Resume Mistakes{' '}
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
          See how ResumePilot takes simple fresher project descriptions and elevates them using STAR framing and precise technical keyword inclusion.
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

      {/* Benefits / Features */}
      <section className="benefits" id="benefits">
        <h2 className="section-title">
          Complete Platform built for{' '}
          <span className="text-gradient">Job Seekers</span>
        </h2>
        <p className="section-subtitle">
          ResumePilot gives you the analytical tools to target competitive corporate roles with confidence.
        </p>

        <div className="benefits-grid">
          {benefits.map((benefit, index) => (
            <div key={index} className="benefit-card">
              <div className="benefit-icon">
                <benefit.icon size={22} />
              </div>
              <h3 className="benefit-title">{benefit.title}</h3>
              <p className="benefit-description">{benefit.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Indian Freshers Testimonials */}
      <section className="testimonials-section">
        <h2 className="section-title">
          Success Stories from{' '}
          <span className="text-gradient">Indian Freshers</span>
        </h2>
        <p className="section-subtitle">
          How real engineering and commerce graduates used ResumePilot to optimize their resumes and clear off-campus screening rounds.
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
              ResumePilot
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
          <span>&copy; {new Date().getFullYear()} ResumePilot. All rights reserved.</span>
          <span>Used by freshers at India's top colleges.</span>
        </div>
      </footer>
    </>
  );
}
