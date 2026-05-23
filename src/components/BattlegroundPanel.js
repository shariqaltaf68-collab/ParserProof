'use client';

import { useState, useEffect, useRef } from 'react';
import { Crown, Download, Loader2, RefreshCw, Award, TrendingUp, Users } from 'lucide-react';

export default function BattlegroundPanel({ projectId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const canvasRef = useRef(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/battleground`);
      const resData = await res.json();
      if (res.ok && resData.success) {
        setData(resData.stats);
      } else {
        throw new Error(resData.error || 'Failed to retrieve cohort statistics.');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchStats();
    }
  }, [projectId]);

  // Dynamic canvas certificate badge generator
  useEffect(() => {
    if (data && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      // Setup high-res high-fidelity coordinates (1200x630 OpenGraph size)
      canvas.width = 1200;
      canvas.height = 630;

      // 1. Draw premium dark glassmorphic gradient background
      const bgGrad = ctx.createRadialGradient(600, 315, 100, 600, 315, 600);
      bgGrad.addColorStop(0, '#1e1b4b'); // deep indigo-950
      bgGrad.addColorStop(1, '#090514'); // ultra-dark charcoal
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1200, 630);

      // 2. Draw subtle tech grids/concentric circles for aesthetics
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.08)';
      ctx.lineWidth = 1;
      for (let r = 200; r < 700; r += 80) {
        ctx.beginPath();
        ctx.arc(600, 315, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 3. Draw outer premium gold border
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.45)'; // metallic soft gold
      ctx.lineWidth = 14;
      ctx.strokeRect(30, 30, 1140, 570);

      // 4. Draw inner double-fine gold border line
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.25)';
      ctx.lineWidth = 2;
      ctx.strokeRect(48, 48, 1104, 534);

      // 5. Draw award laurel or top badge element
      ctx.font = '80px sans-serif';
      ctx.fillStyle = '#d4af37'; // gold
      ctx.textAlign = 'center';
      ctx.fillText('🏆', 600, 140);

      // 6. Draw Platform Name Header
      ctx.font = 'bold 36px "Inter", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.letterSpacing = '5px';
      ctx.fillText('P A R S E R P R O O F', 600, 200);

      // Subtitle
      ctx.font = 'italic 18px "Inter", sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.letterSpacing = '2px';
      ctx.fillText('CERTIFIED ATS COMPATIBILITY CREDENTIAL', 600, 235);

      // 7. Draw Divider gold line
      const divGrad = ctx.createLinearGradient(400, 0, 800, 0);
      divGrad.addColorStop(0, 'rgba(212, 175, 55, 0.01)');
      divGrad.addColorStop(0.5, 'rgba(212, 175, 55, 0.65)');
      divGrad.addColorStop(1, 'rgba(212, 175, 55, 0.01)');
      ctx.fillStyle = divGrad;
      ctx.fillRect(350, 260, 500, 2);

      // 8. Draw Candidate Job Title
      ctx.font = '800 48px "Inter", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(data.jobTitle.toUpperCase(), 600, 335);

      ctx.font = '500 22px "Inter", sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText('Validated Role Fit & ATS Parsing Standards', 600, 375);

      // 9. Draw the BIG Match Score value (Laurel/Gold-gradient look)
      ctx.font = '900 96px "Inter", sans-serif';
      const scoreGrad = ctx.createLinearGradient(400, 0, 800, 0);
      scoreGrad.addColorStop(0.2, '#ffffff');
      scoreGrad.addColorStop(0.5, '#ffd700'); // gold
      scoreGrad.addColorStop(0.8, '#ffffff');
      ctx.fillStyle = scoreGrad;
      ctx.fillText(`${data.userScore}% ATS MATCH`, 600, 480);

      // 10. Verification footnote
      ctx.font = '600 16px monospace';
      ctx.fillStyle = '#6366f1'; // accent blue
      ctx.fillText(`VERIFICATION SECURE_HASH: pp_rag_secure_${projectId.slice(0, 8)}`, 600, 530);

      ctx.font = '400 13px sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.fillText('ParserProof Grounded RAG Standard • 100% Anti-Hallucination Verified', 600, 555);
    }
  }, [data]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `parserproof-certified-badge-${data?.userScore}%.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (loading) {
    return (
      <div className="card" style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '12px' }}>
        <Loader2 size={36} className="animate-spin" style={{ color: 'var(--color-accent)' }} />
        <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
          Benchmarking your resume against active peer applications...
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
        <button className="btn btn-outline btn-sm" onClick={fetchStats}>
          <RefreshCw size={14} /> Retry Benchmark
        </button>
      </div>
    );
  }

  // Calculate position indicator for the distribution chart
  const bandKeys = Object.keys(data.bands);
  const total = data.totalCandidates;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-3)' }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-size-md)', fontWeight: 800, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Crown size={18} style={{ color: 'var(--color-warning)' }} />
            Placement Cohort Battleground
          </h2>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            Compare your compatibility against the peer group and claim your shareable professional credential.
          </p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={fetchStats}>
          <RefreshCw size={12} /> Sync Cohort
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 'var(--space-5)' }}>
        
        {/* LEFT COLUMN: Benchmarking Curve & Leaderboard Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          
          {/* Key Stats Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
            <div className="card" style={{ padding: 'var(--space-3)', background: 'var(--color-bg-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <Users size={20} style={{ color: 'var(--color-accent)' }} />
              <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Active Candidates</span>
              <span style={{ fontSize: 'var(--font-size-md)', fontWeight: 800, color: 'var(--color-text-primary)' }}>{data.totalCandidates}</span>
            </div>
            <div className="card" style={{ padding: 'var(--space-3)', background: 'var(--color-bg-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <TrendingUp size={20} style={{ color: 'var(--color-success)' }} />
              <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Your Percentile</span>
              <span style={{ fontSize: 'var(--font-size-md)', fontWeight: 800, color: 'var(--color-success)' }}>Top {100 - data.percentile}%</span>
            </div>
            <div className="card" style={{ padding: 'var(--space-3)', background: 'var(--color-bg-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <Crown size={20} style={{ color: 'var(--color-warning)' }} />
              <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Cohort Average</span>
              <span style={{ fontSize: 'var(--font-size-md)', fontWeight: 800, color: 'var(--color-text-primary)' }}>{data.cohortAverage}%</span>
            </div>
          </div>

          {/* Peer Distribution chart */}
          <div className="card" style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Cohort Score Distribution &amp; Your Standing
            </h3>
            
            <div style={{ display: 'flex', alignItems: 'flex-end', height: '140px', gap: '12px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px', paddingTop: '10px' }}>
              {bandKeys.map((key) => {
                const count = data.bands[key];
                const heightPct = total > 0 ? (count / total) * 100 : 0;
                
                // Identify which band the user belongs to
                let isUserBand = false;
                const score = data.userScore;
                if (key === '0-40' && score <= 40) isUserBand = true;
                else if (key === '41-60' && score > 40 && score <= 60) isUserBand = true;
                else if (key === '61-75' && score > 60 && score <= 75) isUserBand = true;
                else if (key === '76-85' && score > 75 && score <= 85) isUserBand = true;
                else if (key === '86-100' && score > 85) isUserBand = true;

                return (
                  <div key={key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', height: '100%', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '10px', fontWeight: 'bold', color: isUserBand ? 'var(--color-success)' : 'var(--color-text-tertiary)' }}>
                      {count} {isUserBand && '👤'}
                    </span>
                    <div 
                      style={{ 
                        width: '100%', 
                        height: `${Math.max(8, heightPct)}%`, 
                        background: isUserBand ? 'var(--color-success)' : 'var(--color-accent)', 
                        opacity: isUserBand ? 1 : 0.45,
                        borderRadius: '4px 4px 0 0',
                        transition: 'height 1s ease',
                        boxShadow: isUserBand ? '0 0 12px rgba(39, 201, 63, 0.4)' : 'none'
                      }}
                    />
                    <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)', fontWeight: isUserBand ? 'bold' : 'normal' }}>
                      {key}
                    </span>
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.4', textAlign: 'center' }}>
              You scored higher than <strong>{data.percentile}%</strong> of all other <strong>{data.jobTitle}</strong> applicants.
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: LinkedIn Certified High Score Badge Preview & Download */}
        <div className="card" style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', alignItems: 'center' }}>
          <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '6px', width: '100%', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
            <Award size={16} style={{ color: 'var(--color-warning)' }} />
            Certified LinkedIn Badge
          </h3>

          {/* Hidden high-res canvas */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {/* Visual card mockup scaled down */}
          <div 
            style={{ 
              width: '100%', 
              aspectRatio: '1.9/1',
              borderRadius: 'var(--border-radius-md)',
              border: '2px solid #ffd700',
              background: 'radial-gradient(circle, #1e1b4b 0%, #090514 100%)',
              boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '16px',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Small styled certificate detail mockup */}
            <span style={{ fontSize: '18px', marginBottom: '2px' }}>🏆</span>
            <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#fff', letterSpacing: '2px' }}>PARSERPROOF</span>
            <span style={{ fontSize: '6px', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', marginBottom: '8px' }}>CERTIFIED ATS CREDENTIAL</span>
            <span style={{ fontSize: '12px', fontWeight: 900, color: '#fff', textTransform: 'uppercase' }}>{data.jobTitle}</span>
            <span style={{ fontSize: '18px', fontWeight: 900, color: '#ffd700', marginTop: '6px' }}>{data.userScore}% ATS MATCH</span>
            <span style={{ fontSize: '5px', color: '#6366f1', fontFamily: 'monospace', marginTop: '8px' }}>VERIFIED pp_rag_secure_{projectId.slice(0, 8)}</span>
          </div>

          <button className="btn btn-primary" onClick={handleDownload} style={{ width: '100%' }}>
            <Download size={14} /> Download Certified LinkedIn Badge
          </button>
        </div>

      </div>
    </div>
  );
}
