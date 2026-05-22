'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, Loader2, Mail, ArrowRight, KeyRound } from 'lucide-react';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialEmail = searchParams.get('email') || '';
  const initialStep = searchParams.get('step') || 'form';

  // Navigation steps: 'form' | 'verification'
  const [step, setStep] = useState(initialStep === 'verification' ? 'verification' : 'form');
  
  const [form, setForm] = useState({ name: '', email: initialEmail, password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Verification code state (6 separate digits)
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [verificationError, setVerificationError] = useState('');
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [resendMessage, setResendMessage] = useState('');
  const [isDevFallback, setIsDevFallback] = useState(false);
  const [smtpError, setSmtpError] = useState('');

  const inputRefs = useRef([]);

  // Handles countdown timer for resending code
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Focus the first input box when verification screen loads
  useEffect(() => {
    if (step === 'verification') {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  function getPasswordStrength(password) {
    if (!password) return { label: '', level: 0 };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { label: 'Weak', level: 1 };
    if (score <= 3) return { label: 'Fair', level: 2 };
    if (score === 4) return { label: 'Good', level: 3 };
    return { label: 'Strong', level: 4 };
  }

  function validateForm() {
    if (!form.name.trim()) {
      setError('Please enter your name');
      return false;
    }
    if (form.name.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return false;
    }
    if (!form.email.trim()) {
      setError('Please enter your email address');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!form.password) {
      setError('Please enter a password');
      return false;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (!/[A-Z]/.test(form.password)) {
      setError('Password must contain at least one uppercase letter');
      return false;
    }
    if (!/[a-z]/.test(form.password)) {
      setError('Password must contain at least one lowercase letter');
      return false;
    }
    if (!/[0-9]/.test(form.password)) {
      setError('Password must contain at least one number');
      return false;
    }
    return true;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.toLowerCase().trim(),
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        setLoading(false);
        return;
      }

      // Transition to verification stage
      if (data.status === 'pending_verification') {
        setStep('verification');
        setResendTimer(30); // 30s countdown before allowing resend
        setIsDevFallback(!!data.developmentFallback);
        setSmtpError(data.smtpError || '');
      }
      setLoading(false);
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  // Handle digit box focus and value updates
  const handleCodeChange = (e, index) => {
    const val = e.target.value;
    
    // Only accept numeric inputs
    if (val && !/^\d+$/.test(val)) return;

    const newCode = [...code];
    // Keep only the last character entered
    newCode[index] = val.slice(-1);
    setCode(newCode);
    setVerificationError('');

    // Focus next element
    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace backward focus shift
  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (!code[index] && index > 0) {
        const newCode = [...code];
        newCode[index - 1] = '';
        setCode(newCode);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newCode = [...code];
        newCode[index] = '';
        setCode(newCode);
      }
      setVerificationError('');
    }
  };

  // Support copy-paste of full 6-digit codes
  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    
    if (pasteData.length === 6 && /^\d+$/.test(pasteData)) {
      const splitCode = pasteData.split('');
      setCode(splitCode);
      setVerificationError('');
      // Focus the last digit
      inputRefs.current[5]?.focus();
    }
  };

  // Submit code for verification
  async function handleVerificationSubmit(e) {
    e.preventDefault();
    setVerificationError('');

    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setVerificationError('Please enter all 6 digits of the code.');
      return;
    }

    setVerificationLoading(true);

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email.toLowerCase().trim(),
          code: fullCode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setVerificationError(data.error || 'Invalid code. Please try again.');
        setVerificationLoading(false);
        return;
      }

      // Successful verification -> Trigger automatic secure sign-in
      const result = await signIn('credentials', {
        email: form.email.toLowerCase().trim(),
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        setVerificationError('Email verified, but auto-login failed. Please sign in manually.');
        setVerificationLoading(false);
        setTimeout(() => {
          router.push('/login');
        }, 1500);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setVerificationError('Something went wrong. Please try again.');
      setVerificationLoading(false);
    }
  }

  // Resend code callback
  async function handleResendCode() {
    setVerificationError('');
    setResendMessage('');
    setResendTimer(30);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.toLowerCase().trim(),
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setVerificationError(data.error || 'Failed to resend verification code.');
        return;
      }

      setIsDevFallback(!!data.developmentFallback);
      setSmtpError(data.smtpError || '');
      setResendMessage('A new verification code has been generated!');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch {
      setVerificationError('Failed to resend verification code. Please try again.');
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  }

  const strength = getPasswordStrength(form.password);

  return (
    <div className="auth-layout">
      <div className="auth-card card-glass">
        {step === 'form' ? (
          <>
            <div className="auth-header">
              <Link href="/" className="auth-logo" id="signup-logo">
                <span className="landing-logo-icon">
                  <Sparkles size={18} />
                </span>
                ParserProof
              </Link>
              <h1 className="auth-title">Create your account</h1>
              <p className="auth-subtitle">Start optimizing your resume in minutes</p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              {error && (
                <div className="form-error" role="alert" id="signup-error" style={{ marginBottom: 'var(--space-4)' }}>
                  {error}
                </div>
              )}

              <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                <label className="form-label" htmlFor="signup-name">
                  Full Name
                </label>
                <input
                  id="signup-name"
                  name="name"
                  type="text"
                  className="form-input"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={handleChange}
                  autoComplete="name"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                <label className="form-label" htmlFor="signup-email">
                  Email Address
                </label>
                <input
                  id="signup-email"
                  name="email"
                  type="email"
                  className="form-input"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 'var(--space-6)' }}>
                <label className="form-label" htmlFor="signup-password">
                  Password
                </label>
                <input
                  id="signup-password"
                  name="password"
                  type="password"
                  className="form-input"
                  placeholder="Create a strong password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                />
                {form.password && (
                  <p className="form-hint" id="signup-password-strength" style={{ marginTop: 'var(--space-1)' }}>
                    Password strength:{' '}
                    <span
                      style={{
                        color:
                          strength.level <= 1
                            ? 'var(--color-danger)'
                            : strength.level === 2
                            ? 'var(--color-warning)'
                            : 'var(--color-success)',
                        fontWeight: 600,
                      }}
                    >
                      {strength.label}
                    </span>
                  </p>
                )}
                <p className="form-hint" style={{ marginTop: 'var(--space-1)' }}>
                  At least 8 characters with uppercase, lowercase, and a number
                </p>
              </div>

              <button
                id="signup-submit"
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={loading}
                style={{ width: '100%' }}
              >
                {loading ? (
                  <>
                    <span className="loader-spinner">
                      <Loader2 size={18} />
                    </span>
                    Creating account…
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="auth-footer" style={{ marginTop: 'var(--space-6)' }}>
              Already have an account?{' '}
              <Link href="/login" id="signup-login-link" style={{ fontWeight: 600 }}>
                Sign in
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="auth-header" style={{ textAlign: 'center' }}>
              <div 
                style={{ 
                  width: '56px', 
                  height: '56px', 
                  borderRadius: 'var(--radius-lg)', 
                  background: 'var(--color-accent-light)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: 'var(--color-accent)', 
                  margin: '0 auto var(--space-4) auto' 
                }}
              >
                <Mail size={24} />
              </div>
              <h1 className="auth-title">Verify your email</h1>
              <p className="auth-subtitle" style={{ padding: '0 var(--space-2)' }}>
                We sent a 6-digit code to <strong style={{ color: 'var(--color-text-primary)' }}>{form.email}</strong>.
              </p>
            </div>

            <form onSubmit={handleVerificationSubmit} noValidate>
              {verificationError && (
                <div className="form-error" role="alert" style={{ marginBottom: 'var(--space-4)', justifyContent: 'center' }}>
                  {verificationError}
                </div>
              )}
              
              {resendMessage && (
                <div 
                  className="badge badge-success" 
                  style={{ 
                    display: 'flex', 
                    padding: 'var(--space-2)', 
                    marginBottom: 'var(--space-4)', 
                    justifyContent: 'center',
                    fontSize: 'var(--font-size-xs)',
                    width: '100%',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  {resendMessage}
                </div>
              )}

              {isDevFallback && (
                <div style={{
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-3) var(--space-4)',
                  marginBottom: 'var(--space-5)',
                  color: 'var(--color-warning)',
                  fontSize: 'var(--font-size-sm)',
                  textAlign: 'left',
                  lineHeight: '1.5'
                }}>
                  <strong style={{ display: 'block', marginBottom: '4px' }}>🔧 Developer Mode Notice</strong>
                  {smtpError ? (
                    <>
                      <p style={{ margin: '0 0 var(--space-2) 0' }}>
                        SMTP credentials were provided, but the email send failed:
                        <code style={{ display: 'block', margin: '4px 0', padding: '4px 8px', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '4px', color: 'var(--color-danger)' }}>{smtpError}</code>
                      </p>
                      <p style={{ margin: '0' }}>
                        To prevent blocking registration, the code has been logged to your **Node.js terminal console**.
                        <br />
                        <strong style={{ color: 'var(--color-text-primary)' }}>Tip for Gmail SMTP:</strong> Ensure your password is a 16-character <strong>Google App Password</strong> (not your standard password) and 2-Step Verification is enabled.
                      </p>
                    </>
                  ) : (
                    <>
                      Gmail SMTP credentials are not configured in <code style={{ fontStyle: 'normal', color: 'var(--color-text-primary)' }}>.env</code>. The 6-digit code has been printed to your **Node.js terminal console** for instant testing.
                    </>
                  )}
                </div>
              )}

              <div className="verification-code-container" onPaste={handlePaste}>
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    maxLength={1}
                    className="verification-code-input"
                    value={digit}
                    onChange={(e) => handleCodeChange(e, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    required
                    autoComplete="off"
                    pattern="\d*"
                  />
                ))}
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={verificationLoading}
                style={{ width: '100%' }}
              >
                {verificationLoading ? (
                  <>
                    <span className="loader-spinner">
                      <Loader2 size={18} />
                    </span>
                    Activating account…
                  </>
                ) : (
                  <>
                    Verify & Login
                    <KeyRound size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="resend-container">
              Didn't receive the code?{' '}
              {resendTimer > 0 ? (
                <span>
                  Resend in <span className="resend-timer">{resendTimer}s</span>
                </span>
              ) : (
                <button 
                  type="button" 
                  onClick={handleResendCode} 
                  className="resend-button"
                >
                  Resend Code
                </button>
              )}
            </div>

            <div className="auth-footer" style={{ marginTop: 'var(--space-6)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)' }}>
              <button 
                type="button" 
                onClick={() => setStep('form')} 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--color-text-secondary)', 
                  cursor: 'pointer', 
                  fontFamily: 'var(--font-family)',
                  fontSize: 'var(--font-size-sm)' 
                }}
              >
                &larr; Back to Signup info
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-layout">
          <div className="auth-card">
            <div className="auth-header">
              <span className="auth-logo">
                <span className="landing-logo-icon">
                  <Sparkles size={18} />
                </span>
                ParserProof
              </span>
              <h1 className="auth-title">Loading</h1>
              <p className="auth-subtitle">Please wait...</p>
            </div>
          </div>
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
