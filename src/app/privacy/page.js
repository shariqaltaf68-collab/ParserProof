import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy - ParserProof',
  description: 'Learn how ParserProof collects, uses, and protects your data.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="legal-page">
      <Link href="/" className="btn btn-ghost btn-sm" style={{ marginBottom: 'var(--space-6)', display: 'inline-flex' }}>
        <ArrowLeft size={16} />
        Back to Home
      </Link>

      <h1>Privacy Policy</h1>
      <p style={{ color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-8)' }}>
        Last updated: May 2026
      </p>

      <p>
        At ParserProof, we take your privacy seriously. This Privacy Policy explains how we collect,
        use, disclose, and safeguard your information when you use our AI-powered resume optimization
        platform.
      </p>

      <h2>1. Information We Collect</h2>
      <p>We collect the following types of information when you use ParserProof:</p>
      <ul>
        <li>
          <strong>Account information:</strong> Your email address and name provided during
          registration.
        </li>
        <li>
          <strong>Resume data:</strong> The resume content you upload or paste into the platform
          for optimization.
        </li>
        <li>
          <strong>Job descriptions:</strong> The job postings you provide for tailoring your resume.
        </li>
        <li>
          <strong>Usage analytics:</strong> Information about how you interact with our platform,
          including pages visited, features used, and optimization history.
        </li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <p>We use the information we collect for the following purposes:</p>
      <ul>
        <li>
          <strong>Providing services:</strong> To analyze, optimize, and tailor your resume based
          on job descriptions using AI processing.
        </li>
        <li>
          <strong>Improving our AI:</strong> To enhance the accuracy and effectiveness of our
          resume optimization algorithms through aggregate, anonymized usage patterns.
        </li>
        <li>
          <strong>Communicating updates:</strong> To send you important service announcements,
          feature updates, and account-related notifications.
        </li>
      </ul>

      <h2>3. Data Storage and Security</h2>
      <p>
        Your data is encrypted at rest and in transit using industry-standard encryption protocols.
        We implement strict access controls to ensure only authorized personnel can access user data.
        Our infrastructure is hosted on secure cloud platforms with regular security audits and
        vulnerability assessments.
      </p>

      <h2>4. AI Processing</h2>
      <p>
        When you use our resume optimization features, your resume data and job descriptions are
        sent to AI providers for processing. This data is used solely to generate your optimized
        resume and related analysis. Your personal data is not used for training AI models. We
        maintain data processing agreements with all AI providers to ensure your data is handled
        responsibly.
      </p>

      <h2>5. Data Retention</h2>
      <p>
        Your data is retained for as long as your account remains active. If you choose to delete
        your account, all associated data — including resumes, projects, and personal
        information — will be permanently deleted within 30 days of your account deletion request.
        Backups containing your data are purged on the same schedule.
      </p>

      <h2>6. Your Rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li>
          <strong>Access</strong> all personal data we hold about you at any time through your
          account Settings page.
        </li>
        <li>
          <strong>Correct</strong> any inaccurate personal information via your profile settings.
        </li>
        <li>
          <strong>Delete</strong> your account and all associated data at any time from the Settings
          page under Danger Zone.
        </li>
        <li>
          <strong>Export</strong> your data by contacting our support team.
        </li>
      </ul>

      <h2>7. Third-Party Services</h2>
      <p>
        We use the following categories of third-party services to operate ParserProof:
      </p>
      <ul>
        <li>
          <strong>Authentication providers:</strong> For secure account creation and login.
        </li>
        <li>
          <strong>AI providers:</strong> For resume analysis, optimization, and interview question
          generation.
        </li>
        <li>
          <strong>Analytics providers:</strong> For understanding aggregate usage patterns and
          improving our platform.
        </li>
      </ul>
      <p>
        Each third-party provider is bound by data processing agreements that limit how your data
        may be used.
      </p>

      <h2>8. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. For material changes, we will notify
        you via email at the address associated with your account. We encourage you to review this
        page periodically for the latest information on our privacy practices.
      </p>

      <h2>9. Contact</h2>
      <p>
        If you have questions or concerns about this Privacy Policy or your data, please contact
        us at{' '}
        <a href="mailto:guys4929@gmail.com">guys4929@gmail.com</a>.
      </p>

      <div style={{ marginTop: 'var(--space-12)', paddingTop: 'var(--space-6)', borderTop: '1px solid var(--color-border)' }}>
        <Link href="/" className="btn btn-ghost btn-sm">
          <ArrowLeft size={16} />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
