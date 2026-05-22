import Link from 'next/link';
import { ShieldCheck, Zap, ArrowRight, Target, Check, AlertTriangle } from 'lucide-react';

export const metadata = {
  title: 'ATS Resume Guide for Freshers: What It Is & How to Beat It | ResumePilot',
  description:
    'Complete guide on Applicant Tracking Systems (ATS) for Indian college graduates. Learn how parser tools read resumes, common formatting traps to avoid, and how to structure your experience to get selected.',
  keywords: [
    'ATS resume guide',
    'fresher resume format',
    'resume parser keywords',
    'how to beat ATS',
    'Indian fresher placement resume',
  ],
};

export default function AtsResumeGuidePage() {
  return (
    <>
      {/* Mini Nav */}
      <nav className="landing-nav" style={{ position: 'relative', marginBottom: 'var(--space-10)' }}>
        <div className="landing-nav-inner">
          <Link href="/" className="landing-logo">
            <span className="landing-logo-icon">
              <Zap size={18} />
            </span>
            ResumePilot
          </Link>
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

      <main className="page-content" style={{ maxWidth: '800px', margin: '0 auto', padding: '0 var(--space-6) var(--space-20)' }}>
        <article>
          <header style={{ marginBottom: 'var(--space-10)' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-accent)', fontSize: 'var(--font-size-sm)', fontWeight: 700, marginBottom: 'var(--space-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <Target size={16} />
              Ultimate Placement Resource
            </div>
            <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: 'var(--space-4)', letterSpacing: '-0.02em' }}>
              ATS Resume Guide for Freshers: What It Is & How to Beat It
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-lg)', lineHeight: 1.6 }}>
              A practical, fluff-free guide explaining the exact mechanics of Applicant Tracking Systems and how to write a resume that gets seen by real recruiters.
            </p>
          </header>

          <section style={{ marginBottom: 'var(--space-8)' }}>
            <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)' }}>
              1. What is an Applicant Tracking System (ATS)?
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)', lineHeight: 1.7 }}>
              An Applicant Tracking System (ATS) is a software application used by modern companies (like TCS, Infosys, Google, Deloitte, and startups) to recruit, screen, and track job applicants.
            </p>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)', lineHeight: 1.7 }}>
              Instead of reading every single application, hiring managers rely on the ATS to parse (extract) text from submitted documents, rank profiles based on keyword matches, and filter out unqualified candidates automatically. If your resume score falls below a certain threshold, it is automatically rejected.
            </p>
          </section>

          <section style={{ marginBottom: 'var(--space-8)' }}>
            <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)' }}>
              2. How ATS Parsers Actually Scan Your Resume
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)', lineHeight: 1.7 }}>
              Most modern parsers convert your PDF or Word document into raw text strings. Once converted, the software looks for specific structural triggers:
            </p>
            <ul style={{ color: 'var(--color-text-secondary)', listStyleType: 'disc', paddingLeft: 'var(--space-6)', marginBottom: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <li><strong>Section Labels:</strong> It searches for standard headers like "Work Experience", "Education", "Skills", and "Projects". If you name a section "Things I enjoy", the parser won't know where to categorize it.</li>
              <li><strong>Keywords:</strong> It scans for specific skills mentioned in the job description (e.g. "React.js", "SQL", "financial analysis"). Word proximity and frequency are also calculated to score your alignment.</li>
              <li><strong>Date Parsing:</strong> It attempts to calculate your length of experience by reading dates next to job titles. It looks for formats like "MM/YYYY - MM/YYYY" or "Year - Year".</li>
            </ul>
          </section>

          <div style={{ padding: 'var(--space-6)', background: 'var(--gradient-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', marginBottom: 'var(--space-8)' }}>
            <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 800, marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <AlertTriangle style={{ color: 'var(--color-warning)' }} size={20} />
              Critical Formatting Trap: Grid Templates & Canva
            </h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', lineHeight: 1.6 }}>
              Graphic templates that place text inside complex HTML sidebars or side-by-side grids fail parser scanning. The text is often read in a randomized order, causing dates to align with wrong roles and sentences to get cut off. Stick strictly to a single-column, clean layout.
            </p>
          </div>

          <section style={{ marginBottom: 'var(--space-8)' }}>
            <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)' }}>
              3. Practical Steps to Optimize Your Resume
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                <div style={{ background: 'var(--color-success-light)', color: 'var(--color-success)', padding: 'var(--space-1)', borderRadius: '50%' }}>
                  <Check size={16} />
                </div>
                <div>
                  <h4 style={{ fontWeight: 700, fontSize: 'var(--font-size-base)', marginBottom: 'var(--space-1)' }}>Quantify Your Bullet Points</h4>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>Instead of saying "made web application," write "Designed and deployed a responsive web application using React, reducing backend latency by 35%." Quantifying your work signals real commercial utility.</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                <div style={{ background: 'var(--color-success-light)', color: 'var(--color-success)', padding: 'var(--space-1)', borderRadius: '50%' }}>
                  <Check size={16} />
                </div>
                <div>
                  <h4 style={{ fontWeight: 700, fontSize: 'var(--font-size-base)', marginBottom: 'var(--space-1)' }}>Integrate Exact JD Terminology</h4>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>If the target job listing repeatedly mentions "data migration," make sure your resume project details explicitly reference "data migration" instead of just "data backup" or "transferring databases."</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                <div style={{ background: 'var(--color-success-light)', color: 'var(--color-success)', padding: 'var(--space-1)', borderRadius: '50%' }}>
                  <Check size={16} />
                </div>
                <div>
                  <h4 style={{ fontWeight: 700, fontSize: 'var(--font-size-base)', marginBottom: 'var(--space-1)' }}>Maintain proper Section Hierarchy</h4>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>Format your headers strictly using standard titles like Summary, Experience, Education, Projects, and Skills. Do not use creative header titles.</p>
                </div>
              </div>
            </div>
          </section>

          <section style={{ textAlign: 'center', marginTop: 'var(--space-12)', padding: 'var(--space-8)', background: 'rgba(99, 102, 241, 0.03)', borderRadius: 'var(--radius-xl)', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
            <h3 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>Ready to Audit Your Match Score?</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-6)', maxWidth: '500px', margin: '0 auto var(--space-6)' }}>
              ResumePilot runs your resume text through our parser simulator and flags exactly which core keywords you are missing compared to your target job profile.
            </p>
            <Link href="/signup" className="btn btn-primary">
              Run Free Match Check <ArrowRight size={16} />
            </Link>
          </section>
        </article>
      </main>

      {/* Footer */}
      <footer className="landing-footer" style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-8)' }}>
        <div className="footer-bottom">
          <span>&copy; {new Date().getFullYear()} ResumePilot. Secure ATS checker.</span>
          <span>Designed with absolute data privacy.</span>
        </div>
      </footer>
    </>
  );
}
