'use client';

import { useState, useEffect } from 'react';
import { Mail, Linkedin, Megaphone, Copy, Check, Loader2, RefreshCw } from 'lucide-react';

export default function OutreachAccelerator({ projectId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedType, setCopiedType] = useState(null);

  const fetchOutreach = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/outreach`);
      const resData = await res.json();
      if (res.ok && resData.success) {
        setData(resData.outreach);
      } else {
        throw new Error(resData.error || 'Failed to generate outreach materials.');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchOutreach();
    }
  }, [projectId]);

  const handleCopy = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    } catch {}
  };

  if (loading) {
    return (
      <div className="card" style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '12px' }}>
        <Loader2 size={36} className="animate-spin" style={{ color: 'var(--color-accent)' }} />
        <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
          Tailoring outreach templates to your experience...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)' }}>
        <span style={{ color: 'var(--color-error)', fontSize: 'var(--font-size-sm)' }}>
          ⚠️ {error}
        </span>
        <button className="btn btn-outline btn-sm" onClick={fetchOutreach}>
          <RefreshCw size={14} /> Retry Generation
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-3)' }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-size-md)', fontWeight: 800, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Linkedin size={18} style={{ color: 'var(--color-accent)' }} />
            Recruiter Outreach &amp; Pitch Accelerator
          </h2>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            Tailored outreach scripts ready to copy and send to accelerate your hiring callbacks.
          </p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={fetchOutreach}>
          <RefreshCw size={12} /> Regenerate
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
        
        {/* LEFT COLUMN: LinkedIn Note & Elevator Pitch */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          
          {/* LinkedIn Connection note */}
          <div className="card" style={{ padding: 'var(--space-4)', background: 'var(--color-bg-secondary)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-primary)' }}>
                <Linkedin size={16} style={{ color: '#0a66c2' }} />
                LinkedIn DM/Connection Note (&lt;95 words)
              </h3>
              <button 
                className="btn btn-ghost btn-sm" 
                onClick={() => handleCopy(data.linkedinMsg, 'li')}
                style={{ padding: '4px 8px', fontSize: '11px' }}
              >
                {copiedType === 'li' ? <Check size={12} /> : <Copy size={12} />}
                {copiedType === 'li' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div style={{ background: 'var(--color-bg-primary)', padding: 'var(--space-3)', borderRadius: 'var(--border-radius-md)', fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.5', whiteSpace: 'pre-wrap', border: '1px solid var(--color-border)' }}>
              {data.linkedinMsg}
            </div>
          </div>

          {/* Elevator Pitch script */}
          <div className="card" style={{ padding: 'var(--space-4)', background: 'var(--color-bg-secondary)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-primary)' }}>
                <Megaphone size={16} style={{ color: 'var(--color-accent)' }} />
                30-Second Interview Elevator Pitch
              </h3>
              <button 
                className="btn btn-ghost btn-sm" 
                onClick={() => handleCopy(data.elevatorPitch, 'pitch')}
                style={{ padding: '4px 8px', fontSize: '11px' }}
              >
                {copiedType === 'pitch' ? <Check size={12} /> : <Copy size={12} />}
                {copiedType === 'pitch' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div style={{ background: 'var(--color-bg-primary)', padding: 'var(--space-3)', borderRadius: 'var(--border-radius-md)', fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.5', whiteSpace: 'pre-wrap', border: '1px solid var(--color-border)', fontStyle: 'italic' }}>
              "{data.elevatorPitch}"
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Recruiter Cold Email */}
        <div className="card" style={{ padding: 'var(--space-4)', background: 'var(--color-bg-secondary)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-primary)' }}>
              <Mail size={16} style={{ color: 'var(--color-warning)' }} />
              Tailored Cold Recruiter Email
            </h3>
            <button 
              className="btn btn-ghost btn-sm" 
              onClick={() => handleCopy(data.recruiterEmail, 'mail')}
              style={{ padding: '4px 8px', fontSize: '11px' }}
            >
              {copiedType === 'mail' ? <Check size={12} /> : <Copy size={12} />}
              {copiedType === 'mail' ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div style={{ background: 'var(--color-bg-primary)', padding: 'var(--space-3)', borderRadius: 'var(--border-radius-md)', fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.6', whiteSpace: 'pre-wrap', border: '1px solid var(--color-border)', flex: 1 }}>
            {data.recruiterEmail}
          </div>
        </div>

      </div>
    </div>
  );
}
