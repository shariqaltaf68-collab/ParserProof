'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, Loader2, Mail, ArrowRight, KeyRound, Lock, CheckCircle2 } from 'lucide-react';

function ForgotPasswordForm() {
  const router = useRouter();

  // Reset steps: 'email' | 'verification' | 'password' | 'success'
  const [step, setStep] = useState('email');
  
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  // Verification code state (6 separate digits)
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [verificationError, setVerificationError] = useState('');
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [resendMessage, setResendMessage] = useState('');
  const [isDevFallback, setIsDevFallback] = useState(false);
  const [smtpError, setSmtpError] = useState('');

  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

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

  function getPasswordStrength(pwd) {
    if (!pwd) return { label: '', level: 0 };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 2) return { label: 'Weak', level: 1 };
    if (score <= 3) return { label: 'Fair', level: 2 };
    if (score === 4) return { label: 'Good', level: 3 };
    return { label: 'Strong', level: 4 };
  }

  // Step 1: Submit Email
  async function handleEmailSubmit(e) {
    e.preventDefault();
    setEmailError('');

    if (!email.trim()) {
      setEmailError('Please enter your email address');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setEmailLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setEmailError(data.error || 'Something went wrong. Please try again.');
        setEmailLoading(false);
        return;
      }

      // Transition to verification stage
      setStep('verification');
      setResendTimer(30); // 30s countdown
      setIsDevFallback(!!data.developmentFallback);
      setSmtpError(data.smtpError || '');
      setEmailLoading(false);
    } catch {
      setEmailError('Something went wrong. Please try again.');
      setEmailLoading(false);
    }
  }

  // Handle code digit input
  const handleCodeChange = (e, index) => {
    const val = e.target.value;
    if (val && !/^\d+$/.test(val)) return;

    const newCode = [...code];
    newCode[index] = val.slice(-1);
    setCode(newCode);
    setVerificationError('');

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

  // Support paste of full 6-digit codes
  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (pasteData.length === 6 && /^\d+$/.test(pasteData)) {
      const splitCode = pasteData.split('');
      setCode(splitCode);
      setVerificationError('');
      inputRefs.current[5]?.focus();
    }
  };

  // Resend code callback
  async function handleResendCode() {
    setVerificationError('');
    setResendMessage('');
    setResendTimer(30);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setVerificationError(data.error || 'Failed to resend reset code.');
        return;
      }

      setIsDevFallback(!!data.developmentFallback);
      setSmtpError(data.smtpError || '');
      setResendMessage('A new reset code has been sent!');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch {
      setVerificationError('Failed to resend verification code. Please try again.');
    }
  }

  // Step 2: Submit Code to transition to password step
  function handleCodeSubmit(e) {
    e.preventDefault();
    setVerificationError('');

    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setVerificationError('Please enter all 6 digits.');
      return;
    }

    // Since we'll send the code and new password together in Step 3,
    // we can transition directly or dry-run, but moving to step 3 is extremely direct and smooth.
    setStep('password');
  }

  // Step 3: Reset Password
  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPasswordError('');

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setPasswordError('Password must contain at least one uppercase letter');
      return;
    }
    if (!/[a-z]/.test(newPassword)) {
      setPasswordError('Password must contain at least one lowercase letter');
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      setPasswordError('Password must contain at least one number');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setPasswordLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          code: code.join(''),
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPasswordError(data.error || 'Failed to reset password. Please check your verification code.');
        setPasswordLoading(false);
        // If code is invalid/expired, offer going back to verification
        if (data.error?.includes('code') || data.error?.includes('expired')) {
          setStep('verification');
          setVerificationError(data.error);
        }
        return;
      }

      setStep('success');
      setPasswordLoading(false);
    } catch {
      setPasswordError('Something went wrong. Please try again.');
      setPasswordLoading(false);
    }
  }

  const strength = getPasswordStrength(newPassword);

  return (
    <div className="auth-layout">
      <div className="auth-card card-glass">
        
        {/* STEP 1: EMAIL INPUT */}
        {step === 'email' && (
          <>
            <div className="auth-header">
              <Link href="/" className="auth-logo" id="reset-logo">
                <span className="landing-logo-icon">
                  <Sparkles size={18} />
                </span>
                ResumePilot
              </Link>
              <h1 className="auth-title">Reset your password</h1>
              <p className="auth-subtitle">Enter your email and we will send a 6-digit recovery code</p>
            </div>

            <form className="auth-form" onSubmit={handleEmailSubmit} noValidate>
              {emailError && (
                <div className="form-error" role="alert" style={{ marginBottom: 'var(--space-4)' }}>
                  {emailError}
                </div>
              )}

              <div className="form-group" style={{ marginBottom: 'var(--space-6)' }}>
                <label className="form-label" htmlFor="reset-email">
                  Email Address
                </label>
                <input
                  id="reset-email"
                  type="email"
                  className="form-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError('');
                  }}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={emailLoading}
                style={{ width: '100%' }}
              >
                {emailLoading ? (
                  <>
                    <span className="loader-spinner">
                      <Loader2 size={18} />
                    </span>
                    Sending code…
                  </>
                ) : (
                  <>
                    Send Recovery Code
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="auth-footer" style={{ marginTop: 'var(--space-6)' }}>
              Remember your password?{' '}
              <Link href="/login" style={{ fontWeight: 600 }}>
                Sign in
              </Link>
            </div>
          </>
        )}

        {/* STEP 2: VERIFICATION CODE */}
        {step === 'verification' && (
          <>
            <div className="auth-header" style={{ textAlign: 'center' }}>
              <div 
                style={{ 
                  width: '56px', 
                  height: '56px', 
                  borderRadius: 'var(--radius-lg)', 
                  background: 'rgba(245, 158, 11, 0.1)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: 'var(--color-warning)', 
                  margin: '0 auto var(--space-4) auto' 
                }}
              >
                <Mail size={24} />
              </div>
              <h1 className="auth-title">Verify recovery code</h1>
              <p className="auth-subtitle" style={{ padding: '0 var(--space-2)' }}>
                We sent a 6-digit code to <strong style={{ color: 'var(--color-text-primary)' }}>{email}</strong>.
              </p>
            </div>

            <form onSubmit={handleCodeSubmit} noValidate>
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
                        SMTP failed physically:
                        <code style={{ display: 'block', margin: '4px 0', padding: '4px 8px', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '4px', color: 'var(--color-danger)' }}>{smtpError}</code>
                      </p>
                      <p style={{ margin: '0' }}>
                        The 6-digit code has been logged to your **Node.js terminal console** for instant testing.
                      </p>
                    </>
                  ) : (
                    <>
                      SMTP credentials are not fully configured. The code has been printed to your **Node.js terminal console** for instant testing.
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
                Verify Code
                <KeyRound size={16} />
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
                onClick={() => setStep('email')} 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--color-text-secondary)', 
                  cursor: 'pointer', 
                  fontFamily: 'var(--font-family)',
                  fontSize: 'var(--font-size-sm)' 
                }}
              >
                &larr; Back to Email entry
              </button>
            </div>
          </>
        )}

        {/* STEP 3: CONFIGURE NEW PASSWORD */}
        {step === 'password' && (
          <>
            <div className="auth-header">
              <div 
                style={{ 
                  width: '56px', 
                  height: '56px', 
                  borderRadius: 'var(--radius-lg)', 
                  background: 'rgba(99, 102, 241, 0.1)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: 'var(--color-accent)', 
                  margin: '0 auto var(--space-4) auto' 
                }}
              >
                <Lock size={24} />
              </div>
              <h1 className="auth-title">Set new password</h1>
              <p className="auth-subtitle">Create a secure, strong password for your account</p>
            </div>

            <form className="auth-form" onSubmit={handlePasswordSubmit} noValidate>
              {passwordError && (
                <div className="form-error" role="alert" style={{ marginBottom: 'var(--space-4)' }}>
                  {passwordError}
                </div>
              )}

              <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                <label className="form-label" htmlFor="new-password">
                  New Password
                </label>
                <input
                  id="new-password"
                  type="password"
                  className="form-input"
                  placeholder="Create a strong password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (passwordError) setPasswordError('');
                  }}
                  required
                />
                {newPassword && (
                  <p className="form-hint" style={{ marginTop: 'var(--space-1)' }}>
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

              <div className="form-group" style={{ marginBottom: 'var(--space-6)' }}>
                <label className="form-label" htmlFor="confirm-password">
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  className="form-input"
                  placeholder="Verify your new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (passwordError) setPasswordError('');
                  }}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={passwordLoading}
                style={{ width: '100%' }}
              >
                {passwordLoading ? (
                  <>
                    <span className="loader-spinner">
                      <Loader2 size={18} />
                    </span>
                    Resetting password…
                  </>
                ) : (
                  <>
                    Reset Password
                    <Lock size={16} />
                  </>
                )}
              </button>
            </form>
          </>
        )}

        {/* STEP 4: SUCCESS CONFIRMATION */}
        {step === 'success' && (
          <div style={{ textAlign: 'center', padding: 'var(--space-4) 0' }}>
            <div 
              style={{ 
                width: '64px', 
                height: '64px', 
                borderRadius: '50%', 
                background: 'rgba(34, 197, 94, 0.1)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: 'var(--color-success)', 
                margin: '0 auto var(--space-6) auto' 
              }}
            >
              <CheckCircle2 size={36} />
            </div>
            
            <h1 className="auth-title">Password reset successfully!</h1>
            <p className="auth-subtitle" style={{ marginBottom: 'var(--space-8)' }}>
              Your account credentials have been securely updated. You can now use your new password to sign in.
            </p>

            <Link href="/login" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
              Sign In to ResumePilot
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
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
                ResumePilot
              </span>
              <h1 className="auth-title">Loading</h1>
              <p className="auth-subtitle">Please wait...</p>
            </div>
          </div>
        </div>
      }
    >
      <ForgotPasswordForm />
    </Suspense>
  );
}
