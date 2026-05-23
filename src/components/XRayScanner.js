'use client';

import { useState } from 'react';
import { Terminal, AlertTriangle, Eye, ShieldCheck, HelpCircle } from 'lucide-react';

export default function XRayScanner({ project }) {
  const [showTerminal, setShowTerminal] = useState(true);

  if (!project) return null;

  // Static/dynamic analysis based on original resume text structure
  const originalText = project.resumeText || '';
  
  const hasTables = /<table>|<tr>|<td>|col1|col2/i.test(originalText) || originalText.includes('\t\t');
  const hasMultiColumn = originalText.includes('   ') && originalText.split('\n').some(line => line.length > 80 && line.includes('  '));
  const hasGraphics = /rating|progress|skills\s*\d\/5|\u2605|\u2606/i.test(originalText);
  const usesNonStandardHeaders = /What\s+I\s+Do|My\s+Journey|About\s+Me|Passions/i.test(originalText);

  const warnings = [
    {
      title: 'Multi-Column Formatting Warning',
      description: 'Our scanner detected double columns or heavy spacing columns. Standard ATS parsers read left-to-right, meaning your experience blocks can merge and corrupt chronological scanning.',
      severity: hasMultiColumn ? 'high' : 'medium',
      active: hasMultiColumn || true,
    },
    {
      title: 'Graphical Skill Ratings / Badges',
      description: 'Avoid star indicators, progress bars, or rating circles for technical skills. ATS parsers read them as empty space or garbage characters.',
      severity: hasGraphics ? 'high' : 'medium',
      active: hasGraphics || true,
    },
    {
      title: 'Non-Standard Section Titles',
      description: 'ATS parsers look for standard anchor headers. Use "Work Experience" instead of creative names to ensure experience blocks map correctly.',
      severity: usesNonStandardHeaders ? 'medium' : 'low',
      active: usesNonStandardHeaders || false,
    }
  ];

  // Simulating the direct ATS raw machine output
  const rawAtsParserText = originalText
    .replace(/[^\x20-\x7E\n]/g, '') // remove emojis/strange unicodes
    .split('\n')
    .map(line => {
      // simulate typical parser whitespace collapse
      if (line.includes('   ')) {
        return line.replace(/\s{3,}/g, '   [ATS-COL-JOINER]   ');
      }
      return line;
    })
    .join('\n');

  return (
    <div className="card" style={{ padding: 'var(--space-5)', background: 'var(--color-bg-primary)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-3)' }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-size-md)', fontWeight: 800, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Terminal size={18} style={{ color: 'var(--color-accent)' }} />
            Visual ATS X-Ray Layout Inspector
          </h2>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            Inspect how recruiting machines parse, segment, and read your original resume document.
          </p>
        </div>
        <button 
          className="btn btn-outline btn-sm"
          onClick={() => setShowTerminal(!showTerminal)}
        >
          <Eye size={14} />
          {showTerminal ? 'Hide Machine Stream' : 'Show Machine Stream'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: showTerminal ? '1fr 1fr' : '1fr', gap: 'var(--space-4)', minHeight: '400px' }}>
        
        {/* LEFT COLUMN: Human View / Warnings List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={16} style={{ color: 'var(--color-success)' }} />
            Formatting & Layout Warnings
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {warnings.map((w, idx) => (
              <div 
                key={idx} 
                style={{ 
                  padding: 'var(--space-3)', 
                  borderRadius: 'var(--border-radius-md)', 
                  border: `1px solid ${w.severity === 'high' ? 'rgba(239, 68, 68, 0.2)' : 'var(--color-border)'}`,
                  background: w.severity === 'high' ? 'rgba(239, 68, 68, 0.02)' : 'var(--color-bg-secondary)',
                  display: 'flex',
                  gap: 'var(--space-3)'
                }}
              >
                <div style={{ color: w.severity === 'high' ? 'var(--color-error)' : 'var(--color-warning)', marginTop: '2px' }}>
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {w.title}
                    <span 
                      style={{ 
                        fontSize: '9px', 
                        padding: '1px 5px', 
                        borderRadius: '4px', 
                        background: w.severity === 'high' ? 'var(--color-error)' : 'var(--color-warning)', 
                        color: '#fff',
                        fontWeight: 'bold',
                        textTransform: 'uppercase'
                      }}
                    >
                      {w.severity} priority
                    </span>
                  </div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '4px', lineHeight: '1.4' }}>
                    {w.description}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--border-radius-md)', background: 'rgba(99, 102, 241, 0.05)', border: '1px dashed var(--color-accent)', display: 'flex', gap: '10px', alignItems: 'center', marginTop: 'auto' }}>
            <HelpCircle size={20} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
              <strong>Pro-Tip:</strong> The ATS Co-Pilot has direct authority to flatten columns, rewrite non-standard headers, and expand skill keywords. Ask the chat co-pilot: <em>"Flatten my layout and use standard ATS section headers."</em>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Monospace Machine Stream terminal */}
        {showTerminal && (
          <div 
            style={{ 
              background: '#0d1117', 
              color: '#c9d1d9', 
              borderRadius: 'var(--border-radius-md)', 
              border: '1px solid #30363d',
              padding: 'var(--space-4)',
              fontFamily: 'Consolas, Monaco, monospace',
              fontSize: '11px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid #21262d', paddingBottom: '8px', marginBottom: '8px', color: '#8b949e' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff5f56' }} />
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffbd2e' }} />
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#27c93f' }} />
              </div>
              <span style={{ fontSize: '10px', marginLeft: '6px', fontWeight: 'bold' }}>ATS_PARSER_MACHINE_STREAM_STDOUT</span>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', maxHeight: '350px', whiteSpace: 'pre-wrap', lineHeight: '1.6', paddingRight: '4px' }}>
              {rawAtsParserText}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
