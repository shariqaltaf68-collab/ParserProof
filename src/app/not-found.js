import Link from 'next/link';

export default function NotFound() {
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
            fontSize: '7rem',
            fontWeight: 900,
            lineHeight: 1,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '1rem',
          }}
        >
          404
        </div>
        <h1
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            marginBottom: '0.75rem',
          }}
        >
          Page Not Found
        </h1>
        <p
          style={{
            fontSize: '1rem',
            color: 'hsl(220 15% 60%)',
            lineHeight: 1.6,
            marginBottom: '2rem',
          }}
        >
          The page you are looking for does not exist or has been moved.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link
            href="/"
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: 'white',
              fontWeight: 600,
              textDecoration: 'none',
              fontSize: '0.9rem',
              transition: 'opacity 0.2s',
            }}
          >
            Go Home
          </Link>
          <Link
            href="/dashboard"
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              background: 'hsl(230 20% 15%)',
              border: '1px solid hsl(230 20% 25%)',
              color: 'hsl(220 15% 80%)',
              fontWeight: 600,
              textDecoration: 'none',
              fontSize: '0.9rem',
              transition: 'opacity 0.2s',
            }}
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
