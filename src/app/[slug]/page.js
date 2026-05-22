import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ShieldCheck, Zap, ArrowRight, Target, Check, AlertTriangle, HelpCircle, Star, Search, Sparkles, BookOpen } from 'lucide-react';
import config from '../(app)/seo/seo-config.json';

export async function generateStaticParams() {
  return config.pages.map((p) => ({
    slug: p.slug,
  }));
}

export async function generateMetadata({ params }) {
  const page = config.pages.find((p) => p.slug === params.slug);
  if (!page) return {};
  return {
    title: `${page.title} | ParserProof`,
    description: page.description,
    keywords: [
      page.keyword,
      "ATS resume check",
      "free resume templates",
      "fresher resume format",
      "ParserProof",
    ],
    openGraph: {
      title: page.title,
      description: page.description,
      url: `https://www.parserproof.com/${page.slug}`,
      images: [
        {
          url: `/og-image.png`,
          width: 1200,
          height: 630,
          alt: page.h1,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: page.title,
      description: page.description,
      images: [`/og-image.png`],
    },
  };
}

export default function DynamicSeoPage({ params }) {
  const page = config.pages.find((p) => p.slug === params.slug);
  if (!page) {
    notFound();
  }

  const ctaUrl = page.slug === 'cover-letter-generator' ? '/signup?cta=cover-letter' : `/signup?cta=ats-check&role=${page.slug}`;
  const isGenerator = page.slug === 'cover-letter-generator';

  // Get other pages for internal linking
  const otherPages = config.pages.filter((p) => p.slug !== page.slug);

  return (
    <>
      {/* Promo Alert Banner */}
      <div className="promo-banner">
        <div className="promo-banner-inner">
          <span className="promo-tag">🇮🇳 NO SUBSCRIPTION TRAPS</span>
          <p className="promo-text">
            Designed specifically for Indian freshers & professionals. Get comprehensive ATS optimizations for just <strong>₹199</strong>.
          </p>
          <Link href="/signup" className="promo-btn">
            Get Started Free <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Mini Nav */}
      <nav className="landing-nav" style={{ position: 'relative', marginBottom: 'var(--space-12)' }}>
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

      {/* Search-Intent Hero Section */}
      <section className="hero" style={{ padding: 'var(--space-12) 0 var(--space-16)', textAlign: 'center' }}>
        <div className="hero-content" style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-accent)', fontSize: 'var(--font-size-sm)', fontWeight: 700, marginBottom: 'var(--space-4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Target size={16} />
            <span>ATS Compliance Optimization</span>
          </div>
          <h1 className="hero-title" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.8rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: 'var(--space-6)', letterSpacing: '-0.02em' }}>
            {page.h1} <span className="text-gradient">Optimization Portal</span>
          </h1>
          <p className="hero-description" style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-8)', maxWidth: '750px', margin: '0 auto var(--space-8)' }}>
            {page.description} Over 75% of corporate applications are filtered out by automated Applicant Tracking Systems. Optimize yours to stand out instantly to top recruiters.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
            <Link href={ctaUrl} className="btn btn-primary btn-lg">
              {isGenerator ? 'Generate Cover Letter Free' : 'Check My ATS Score Free'} <ArrowRight size={18} />
            </Link>
            <Link href="/" className="btn btn-secondary btn-lg">
              Explore ATS Rules
            </Link>
          </div>
        </div>
      </section>

      {/* Trust & Privacy Bar */}
      <div className="trust-bar" style={{ marginBottom: 'var(--space-16)' }}>
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
          <span>Tested against Workday, Greenhouse & Taleo</span>
        </div>
      </div>

      <main className="page-content" style={{ maxWidth: '960px', margin: '0 auto', padding: '0 var(--space-6) var(--space-20)' }}>
        {/* Core Layout Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--space-12)', alignItems: 'start' }}>
          
          {/* Main Informative Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)' }}>
            
            {/* Value Section: Role-Specific Tips */}
            {page.tips && page.tips.length > 0 && (
              <section>
                <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, marginBottom: 'var(--space-6)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)' }}>
                  Recruiter-Approved Tips for {page.h1}
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  {page.tips.map((tip, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                      <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--color-success)', padding: 'var(--space-1)', borderRadius: '50%', flexShrink: 0, marginTop: '2px' }}>
                        <Check size={16} />
                      </div>
                      <div>
                        <h4 style={{ fontWeight: 700, fontSize: 'var(--font-size-base)', marginBottom: 'var(--space-1)', color: 'var(--color-text-primary)' }}>
                          Strategy {idx + 1}
                        </h4>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', lineHeight: 1.6 }}>
                          {tip}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Formatting Warning */}
            <div style={{ padding: 'var(--space-6)', background: 'var(--gradient-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 800, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <AlertTriangle style={{ color: 'var(--color-warning)' }} size={20} />
                Critical Formatting Trap: Complex Templates
              </h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', lineHeight: 1.6 }}>
                Graphics, progress bars, side-by-side tables, or multicolumn templates from Canva might look elegant to the human eye, but they scramble modern ATS scanners. Dates align incorrectly, text segments overlap, and your application gets automatically filtered out. Stick to a clean, single-column design.
              </p>
            </div>

            {/* Why ParserProof Section */}
            <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)' }}>
                Why Optimize {page.h1} with ParserProof?
              </h2>
              <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
                ParserProof isn't just another generic AI writer that prints superficial corporate slogans. We simulate real enterprise screening algorithms (such as Taleo, Greenhouse, and Workday) to evaluate your resume structure, keyword density, and quantitative accomplishments.
              </p>
              <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
                Our <strong>STAR Experience Rewriter</strong> systematically transforms your academic achievements, projects, or work history into rigorous, high-impact bullet points utilizing Google's XYZ formula: <em>"Accomplished X, measured by Y, by doing Z."</em>
              </p>
            </section>

            {/* FAQs */}
            {page.faqs && page.faqs.length > 0 && (
              <section>
                <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, marginBottom: 'var(--space-6)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)' }}>
                  Frequently Asked Questions
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  {page.faqs.map((faq, idx) => (
                    <div key={idx} style={{ padding: 'var(--space-5)', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
                      <h4 style={{ fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 'var(--space-2)', fontSize: 'var(--font-size-base)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <HelpCircle size={16} style={{ color: 'var(--color-accent)' }} />
                        {faq.q}
                      </h4>
                      <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', lineHeight: 1.6 }}>
                        {faq.a}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>

          {/* Sidebar Navigation & CTA */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
            
            {/* Quick Conversion Card */}
            <div style={{ padding: 'var(--space-6)', background: 'var(--gradient-card)', border: '2px solid rgba(99, 102, 241, 0.15)', borderRadius: 'var(--radius-2xl)', textAlign: 'center', boxShadow: 'var(--shadow-lg)' }}>
              <div style={{ display: 'inline-flex', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--color-accent)', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-4)' }}>
                <Sparkles size={24} />
              </div>
              <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>
                {isGenerator ? 'Write Cover Letter' : 'Get Recruiter-Ready'}
              </h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)', lineHeight: 1.5, marginBottom: 'var(--space-5)' }}>
                Upload your resume, analyze keyword gaps, and optimize your application packages using elite recruitment standards.
              </p>
              <Link href={ctaUrl} className="btn btn-primary" style={{ width: '100%', display: 'block', padding: 'var(--space-3)' }}>
                Start Free Audit
              </Link>
            </div>

            {/* Programmatic Internal Links */}
            <div style={{ padding: 'var(--space-6)', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)' }}>
              <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <BookOpen size={16} />
                Other SEO Guides
              </h4>
              <ul style={{ listStyleType: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {otherPages.map((op) => (
                  <li key={op.slug}>
                    <Link href={`/${op.slug}`} className="sidebar-nav-item" style={{ fontSize: 'var(--font-size-xs)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
                      <span>{op.keyword}</span>
                      <ArrowRight size={12} style={{ opacity: 0.6 }} />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

          </aside>

        </div>
      </main>

      {/* Landing Footer */}
      <footer className="landing-footer" style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-12)', background: 'var(--color-bg-secondary)' }}>
        <div className="landing-footer-inner" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 var(--space-6) var(--space-8)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-8)', marginBottom: 'var(--space-8)' }}>
            <div>
              <Link href="/" className="landing-logo" style={{ marginBottom: 'var(--space-3)' }}>
                <span className="landing-logo-icon">
                  <Zap size={16} />
                </span>
                ParserProof
              </Link>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', maxWidth: '300px', lineHeight: 1.5 }}>
                An elite Applicant Tracking System (ATS) optimization and verification platform designed specifically for job seekers to elevate conversion success.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-12)' }}>
              <div>
                <h5 style={{ fontWeight: 800, fontSize: 'var(--font-size-xs)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-3)', textTransform: 'uppercase' }}>Resources</h5>
                <ul style={{ listStyleType: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <li><Link href="/ats-resume-guide" style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)' }}>ATS Guide</Link></li>
                  <li><Link href="/fresher-resume-mistakes" style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)' }}>Resume Mistakes</Link></li>
                </ul>
              </div>
              <div>
                <h5 style={{ fontWeight: 800, fontSize: 'var(--font-size-xs)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-3)', textTransform: 'uppercase' }}>Legal</h5>
                <ul style={{ listStyleType: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <li><Link href="/privacy" style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)' }}>Privacy Policy</Link></li>
                  <li><Link href="/terms" style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)' }}>Terms of Service</Link></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="footer-bottom" style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
              &copy; {new Date().getFullYear()} ParserProof. Secure ATS checker.
            </span>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
              Designed with absolute data privacy.
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}
