'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
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
} from 'lucide-react';

const benefits = [
  {
    icon: Target,
    title: 'ATS Optimization',
    description:
      'Beat applicant tracking systems with keyword-optimized formatting and content that gets your resume past the filters.',
  },
  {
    icon: Search,
    title: 'Keyword Matching',
    description:
      'See exactly which keywords match and which are missing from your resume compared to the job description.',
  },
  {
    icon: FileText,
    title: 'Cover Letters',
    description:
      'Generate tailored cover letters that reference the specific role and company you are applying to.',
  },
  {
    icon: MessageSquare,
    title: 'Interview Prep',
    description:
      'Get likely interview questions with answer hints based on your background and the job requirements.',
  },
  {
    icon: Download,
    title: 'PDF Export',
    description:
      'Download polished, ready-to-send PDFs of your optimized resume and tailored cover letter.',
  },
  {
    icon: History,
    title: 'Version History',
    description:
      'Save and compare different versions of your resume for different job applications.',
  },
];

const steps = [
  {
    number: '1',
    title: 'Upload Your Resume',
    description:
      'Paste your resume text or upload a PDF. We extract and analyze your experience, skills, and qualifications.',
  },
  {
    number: '2',
    title: 'Add Job Description',
    description:
      'Paste the job posting you are targeting. Our AI identifies key requirements, keywords, and qualifications.',
  },
  {
    number: '3',
    title: 'Get Results',
    description:
      'Receive your ATS-optimized resume, tailored cover letter, keyword analysis, and interview questions.',
  },
];

const pricingPlans = [
  {
    name: 'Free',
    amount: '₹0',
    period: '/month',
    features: [
      { text: '3 generations per month', enabled: true },
      { text: 'ATS-optimized resume rewrite', enabled: true },
      { text: 'ATS compatibility score', enabled: true },
      { text: 'PDF & TXT export', enabled: true },
      { text: 'Tailored cover letter', enabled: false },
      { text: 'JD keyword match analysis', enabled: false },
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
      { text: '15 generations per month', enabled: true },
      { text: 'Everything in Free', enabled: true },
      { text: 'Tailored cover letter', enabled: true },
      { text: 'JD keyword match analysis', enabled: true },
      { text: 'All tone options', enabled: true },
      { text: 'Interview prep questions', enabled: false },
    ],
    buttonText: 'Upgrade to Starter',
    buttonClass: 'btn btn-primary',
    popular: true,
  },
  {
    name: 'Pro',
    amount: '₹999',
    period: '/month',
    features: [
      { text: '50 generations per month', enabled: true },
      { text: 'Everything in Starter', enabled: true },
      { text: 'Interview prep questions', enabled: true },
      { text: 'Skill gap analysis', enabled: true },
      { text: 'Priority AI processing', enabled: true },
      { text: 'Full application intelligence', enabled: true },
    ],
    buttonText: 'Upgrade to Pro',
    buttonClass: 'btn btn-primary',
    popular: false,
  },
];

const faqItems = [
  {
    question: 'How does ResumePilot improve my resume?',
    answer:
      'ResumePilot uses AI to analyze your resume against a specific job description. It identifies matching keywords, rewrites your bullet points with stronger action verbs and clearer impact statements, optimizes formatting for ATS compatibility, and ensures your most relevant experience is highlighted. It only works with the content you provide — nothing is fabricated.',
  },
  {
    question: 'Will it add fake experience to my resume?',
    answer:
      'Absolutely not. ResumePilot is built on a core principle of truthfulness. Our AI will never invent, fabricate, or add any experience, skills, certifications, or job history that you did not provide. It only rewrites and restructures what you give it to make your existing experience shine.',
  },
  {
    question: 'What file formats are supported?',
    answer:
      'You can upload your resume as a PDF or paste it directly as text. We extract the content and analyze it regardless of the input method. For best results, we recommend pasting your resume text directly.',
  },
  {
    question: 'Is my data secure?',
    answer:
      'Yes. Your data is encrypted in transit and at rest. We never share your resume data with third parties. Your resume content is only used to generate your tailored results. You can delete your account and all associated data at any time from your Settings page.',
  },
  {
    question: 'What is an ATS score?',
    answer:
      'An ATS (Applicant Tracking System) score measures how well your resume is optimized for the automated screening software that most companies use. A higher score means your resume is more likely to pass through these filters and reach a human recruiter. Our score factors in keyword matching, formatting, section headers, and content relevance.',
  },
  {
    question: 'Can I cancel anytime?',
    answer:
      'Yes. There are no contracts or commitments. You can cancel your subscription at any time and continue using the free tier. Your saved projects will remain accessible.',
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
              <Sparkles size={18} />
            </span>
            ResumePilot
          </Link>

          <ul className="landing-nav-links">
            <li>
              <button className="landing-nav-link" onClick={() => scrollTo('benefits')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}>
                Features
              </button>
            </li>
            <li>
              <button className="landing-nav-link" onClick={() => scrollTo('how-it-works')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}>
                How It Works
              </button>
            </li>
            <li>
              <button className="landing-nav-link" onClick={() => scrollTo('pricing')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}>
                Pricing
              </button>
            </li>
            <li>
              <button className="landing-nav-link" onClick={() => scrollTo('faq')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}>
                FAQ
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

      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={16} />
            AI-Powered Resume Optimization
          </div>

          <h1 className="hero-title">
            Land Your Dream Job with{' '}
            <span className="text-gradient">AI-Powered Resumes</span>
          </h1>

          <p className="hero-description">
            Upload your resume, paste any job description, and get an
            ATS-optimized resume, tailored cover letter, and interview prep —
            all in minutes.
          </p>

          <div className="hero-actions">
            <Link href="/signup" className="btn btn-primary btn-lg">
              Start Free <ArrowRight size={18} />
            </Link>
            <button
              className="btn btn-secondary btn-lg"
              onClick={() => scrollTo('how-it-works')}
            >
              See How It Works
            </button>
          </div>

          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-value">10,000+</div>
              <div className="hero-stat-label">Resumes Optimized</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">85%</div>
              <div className="hero-stat-label">Avg. ATS Score Boost</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">3 min</div>
              <div className="hero-stat-label">Average Generation Time</div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="benefits" id="benefits">
        <h2 className="section-title">
          Everything You Need to{' '}
          <span className="text-gradient">Stand Out</span>
        </h2>
        <p className="section-subtitle">
          ResumePilot gives you the tools to optimize every part of your job
          application, from resume to interview.
        </p>

        <div className="benefits-grid">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="benefit-card">
              <div className="benefit-icon">
                <benefit.icon size={24} />
              </div>
              <h3 className="benefit-title">{benefit.title}</h3>
              <p className="benefit-description">{benefit.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works" id="how-it-works">
        <h2 className="section-title">
          How <span className="text-gradient">It Works</span>
        </h2>
        <p className="section-subtitle">
          Three simple steps to transform your resume and boost your chances.
        </p>

        <div className="steps">
          {steps.map((step) => (
            <div key={step.number} className="step">
              <div className="step-number">{step.number}</div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-description">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="pricing" id="pricing">
        <h2 className="section-title">
          Simple, Transparent{' '}
          <span className="text-gradient">Pricing</span>
        </h2>
        <p className="section-subtitle">
          Start free and upgrade when you need more. No hidden fees, cancel
          anytime.
        </p>

        <div className="pricing-grid">
          {pricingPlans.map((plan) => (
            <div
              key={plan.name}
              className={`pricing-card${plan.popular ? ' popular' : ''}`}
            >
              {plan.popular && (
                <span className="pricing-popular-badge">Most Popular</span>
              )}
              <div className="pricing-name">{plan.name}</div>
              <div className="pricing-price">
                <span className="pricing-amount">{plan.amount}</span>
                <span className="pricing-period">{plan.period}</span>
              </div>
              <ul className="pricing-features">
                {plan.features.map((feature) => (
                  <li
                    key={feature.text}
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

      {/* FAQ */}
      <section className="faq" id="faq">
        <h2 className="section-title">
          Frequently Asked{' '}
          <span className="text-gradient">Questions</span>
        </h2>
        <p className="section-subtitle">
          Everything you need to know about ResumePilot.
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

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">
            Ready to Land{' '}
            <span className="text-gradient">More Interviews?</span>
          </h2>
          <p className="cta-description">
            Join thousands of job seekers who have optimized their resumes with
            AI. Start for free — no credit card required.
          </p>
          <Link href="/signup" className="btn btn-primary btn-lg">
            <Zap size={18} />
            Start Free Today
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link href="/" className="landing-logo">
              <span className="landing-logo-icon">
                <Sparkles size={18} />
              </span>
              ResumePilot
            </Link>
            <p className="footer-brand-description">
              AI-powered resume optimization platform that helps you land more
              interviews. Truthful, ATS-optimized, and tailored to every job.
            </p>
          </div>

          <div>
            <h4 className="footer-column-title">Product</h4>
            <ul className="footer-links">
              <li>
                <button className="footer-link" onClick={() => scrollTo('benefits')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', padding: 0 }}>
                  Features
                </button>
              </li>
              <li>
                <button className="footer-link" onClick={() => scrollTo('pricing')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', padding: 0 }}>
                  Pricing
                </button>
              </li>
              <li>
                <button className="footer-link" onClick={() => scrollTo('faq')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', padding: 0 }}>
                  FAQ
                </button>
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
                <span className="footer-link">Blog</span>
              </li>
              <li>
                <span className="footer-link">Careers</span>
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
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>&copy; {new Date().getFullYear()} ResumePilot. All rights reserved.</span>
          <span>Built with AI, designed for humans.</span>
        </div>
      </footer>
    </>
  );
}
