import Link from 'next/link';
import { AlertTriangle, Zap, ArrowRight, ShieldCheck, Check } from 'lucide-react';

export const metadata = {
  title: '10 Resume Mistakes Freshers Make That Lead to Rejection | ParserProof',
  description:
    'Are you sending out resume applications and getting zero replies? Here are 10 fatal fresher resume mistakes (Canva formats, empty descriptions, fluff) that get you auto-rejected.',
  keywords: [
    'fresher resume mistakes',
    'why is my resume getting rejected',
    'engineering student resume',
    'off-campus placement guide',
    'ATS score checks for freshers',
  ],
};

const commonMistakesList = [
  {
    num: '1',
    title: 'Using Complex Multi-Column Canva Designs',
    desc: 'While colorful sidebars look great to human eyes, Applicant Tracking Systems (ATS) read text from left to right. Multi-column templates scrambles your details (e.g. reading skills before degree info), leading to parsing failure and immediate sorting into the junk pile.',
  },
  {
    num: '2',
    title: 'Vague Objective Statements (Fluff Copy)',
    desc: 'Opening your resume with "To utilize my skills in a competitive organization..." is a wasted layout opportunity. Replace it with a dense Technical Profile or Professional Summary highlighting 3-4 specific core capabilities (e.g., Python scripts, manual testing, financial sheets).',
  },
  {
    num: '3',
    title: 'Lack of Quantified Metrics in Project Bullet Points',
    desc: 'Recruiters seek commercial focus. Writing "responsible for building databases" doesn\'t convey quality. Upgrade it to: "Constructed relational database using PostgreSQL, improving search query speed by 25% across 1,000 mockup customer records."',
  },
  {
    num: '4',
    title: 'Missing Essential Job Keywords',
    desc: 'If a vacancy asks for "Agile workflow" and "Git version control," writing "software development" isn\'t enough. The ATS algorithm scores matches based on precise lexical alignment. Read target descriptions carefully.',
  },
  {
    num: '5',
    title: 'Making the Resume 2 Pages Long',
    desc: 'As a fresh college graduate, you rarely have enough commercial history to justify a two-page layout. A long document signals lack of prioritization. Keep it strictly to a dense, impactful single page.',
  },
  {
    num: '6',
    title: 'Visual Skill Rating Bars',
    desc: 'Having a graphic bar showing "Java: 4 out of 5 stars" or "Communication: 80%" looks amateurish and is unreadable by robot scanners. It conveys zero objective details. List skills in clear, text-only groups.',
  },
  {
    num: '7',
    title: 'Informal Email Addresses',
    desc: 'Applying with mail IDs like "coolboy47@gmail.com" instantly destroys your credibility. Ensure your contact profile lists a standard professional format (e.g. "firstname.lastname@gmail.com").',
  },
  {
    num: '8',
    title: 'Missing LinkedIn and GitHub Links',
    desc: 'If you are applying for technical SDE, analyst, or design jobs, missing portfolio links is a red flag. Recruiters want to instantly verify your real codebase or professional network profile.',
  },
  {
    num: '9',
    title: 'Fabricating Mock Internships',
    desc: 'Generic AI writers generate fake corporate experience to fill layout gaps. This is risky and will fail background checks. Focus instead on framing your real coursework, minor/major degree projects, and college society activities with high-quality business terminology.',
  },
  {
    num: '10',
    title: 'Grammar Typos & Spacing Irregularities',
    desc: 'A single spelling error suggests poor attention to details. It is the easiest excuse for a recruiter scanning 200 sheets to reject your profile. Proofread twice, and always export as a standard, clear text-searchable PDF.',
  },
];

export default function FresherResumeMistakesPage() {
  return (
    <>
      {/* Mini Nav */}
      <nav className="landing-nav" style={{ position: 'relative', marginBottom: 'var(--space-10)' }}>
        <div className="landing-nav-inner">
          <Link href="/" className="landing-logo">
            <span className="landing-logo-icon">
              <Zap size={18} />
            </span>
            ParserProof
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
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-danger)', fontSize: 'var(--font-size-sm)', fontWeight: 700, marginBottom: 'var(--space-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <AlertTriangle size={16} />
              Off-Campus Job Hunting Tips
            </div>
            <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: 'var(--space-4)', letterSpacing: '-0.02em' }}>
              10 Fatal Resume Mistakes That Get Indian Freshers Rejected
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-lg)', lineHeight: 1.6 }}>
              Are you sending out dozens of applications on Naukri, LinkedIn, or corporate portals and getting zero responses? Read this guide to fix the critical mistakes destroying your conversion rate.
            </p>
          </header>

          <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', marginBottom: 'var(--space-12)' }}>
            {commonMistakesList.map((m) => (
              <div key={m.num} style={{ padding: 'var(--space-6)', background: 'var(--gradient-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)' }}>
                <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyCenter: 'center', width: '28px', height: '28px', background: 'var(--color-danger-light)', color: 'var(--color-danger)', fontSize: 'var(--font-size-xs)', fontWeight: 900, borderRadius: '50%', flexShrink: 0, textAlign: 'center', paddingLeft: '8px' }}>
                    {m.num}
                  </span>
                  {m.title}
                </h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', lineHeight: 1.6, paddingLeft: 'var(--space-8)' }}>
                  {m.desc}
                </p>
              </div>
            ))}
          </section>

          <section style={{ textAlign: 'center', padding: 'var(--space-8)', background: 'rgba(16, 185, 129, 0.03)', borderRadius: 'var(--radius-xl)', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
            <h3 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>Verify Your Resume Layout Instantly</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-6)', maxWidth: '500px', margin: '0 auto var(--space-6)' }}>
              Upload your current resume to see if our parser simulation runs successfully, and scan for missing core technical keywords in under 3 minutes.
            </p>
            <Link href="/signup" className="btn btn-primary">
              Scan Resume Compatibility Free <ArrowRight size={16} />
            </Link>
          </section>
        </article>
      </main>

      {/* Footer */}
      <footer className="landing-footer" style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-8)' }}>
        <div className="footer-bottom">
          <span>&copy; {new Date().getFullYear()} ParserProof. Built for career safety.</span>
          <span>No fabricated data, complete security.</span>
        </div>
      </footer>
    </>
  );
}
