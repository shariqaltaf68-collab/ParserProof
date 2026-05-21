'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'hsl(230 25% 7%)',
        color: 'hsl(220 15% 90%)',
        fontFamily: 'var(--font-inter, Inter, system-ui, sans-serif)',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: '480px' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'hsl(0 70% 50% / 0.15)',
            border: '1px solid hsl(0 70% 50% / 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            fontSize: '1.75rem',
          }}
        >
          ⚠️
        </div>
        <h1
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            marginBottom: '0.75rem',
          }}
        >
          Something Went Wrong
        </h1>
        <p
          style={{
            fontSize: '1rem',
            color: 'hsl(220 15% 60%)',
            lineHeight: 1.6,
            marginBottom: '2rem',
          }}
        >
          An unexpected error occurred. Please try again or contact support if
          the problem persists.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button
            onClick={() => reset()}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: 'white',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            Try Again
          </button>
          <a
            href="/"
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              background: 'hsl(230 20% 15%)',
              border: '1px solid hsl(230 20% 25%)',
              color: 'hsl(220 15% 80%)',
              fontWeight: 600,
              textDecoration: 'none',
              fontSize: '0.9rem',
            }}
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
}
