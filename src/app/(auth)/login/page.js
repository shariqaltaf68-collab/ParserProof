'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, Loader2 } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function validateForm() {
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
      setError('Please enter your password');
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
      const result = await signIn('credentials', {
        email: form.email.toLowerCase().trim(),
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error.includes('verify') || result.error.includes('Verify') || result.error.includes('email address')) {
          setError(result.error);
        } else {
          setError('Invalid email or password');
        }
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  }

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <div className="auth-header">
          <Link href="/" className="auth-logo" id="login-logo">
            <span className="landing-logo-icon">
              <Sparkles size={18} />
            </span>
            ResumePilot
          </Link>
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to continue optimizing your career</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="form-error" role="alert" id="login-error" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
              <span>{error}</span>
              {(error.includes('verify') || error.includes('Verify') || error.includes('email address')) && (
                <Link
                  href={`/signup?email=${encodeURIComponent(form.email)}&step=verification`}
                  style={{
                    color: 'var(--color-accent-light)',
                    textDecoration: 'underline',
                    fontWeight: 600,
                    fontSize: 'var(--font-size-sm)',
                    marginTop: '2px'
                  }}
                >
                  Verify your email now &rarr;
                </Link>
              )}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="login-email">
              Email
            </label>
            <input
              id="login-email"
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

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-1.5)' }}>
              <label className="form-label" htmlFor="login-password" style={{ marginBottom: 0 }}>
                Password
              </label>
              <Link
                href="/forgot-password"
                id="login-forgot-password-link"
                style={{
                  color: 'var(--color-accent-light)',
                  textDecoration: 'none',
                  fontWeight: 500,
                  fontSize: 'var(--font-size-xs)',
                  transition: 'color var(--transition-fast)'
                }}
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="login-password"
              name="password"
              type="password"
              className="form-input"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
              required
            />
          </div>

          <button
            id="login-submit"
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
                Signing in…
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="auth-footer">
          Don&apos;t have an account?{' '}
          <Link href="/signup" id="login-signup-link">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
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
      <LoginForm />
    </Suspense>
  );
}
