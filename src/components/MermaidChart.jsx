import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

// CSS to nuke the grey rect Mermaid injects into every SVG
const MERMAID_TRANSPARENT_STYLE = `
  .mermaid svg { background: transparent !important; }
  /* Mermaid flowcharts often inject a full-canvas background rect. Strip only that. */
  .mermaid svg rect[x="0"][y="0"] { fill: transparent !important; }
`;

function initMermaid(isDark) {
  mermaid.initialize({
    startOnLoad: false,
    theme: 'base',
    themeVariables: isDark ? {
      background: 'transparent',
      primaryColor: '#0d0d12',
      primaryTextColor: '#e2e8f0',
      primaryBorderColor: '#3b82f6',
      lineColor: '#60a5fa',
      secondaryColor: '#1e293b',
      tertiaryColor: 'transparent',
      fontFamily: '"Inter", sans-serif',
      fontSize: '13px',
      clusterBkg: 'rgba(255,255,255,0.02)',
      clusterBorder: 'rgba(255,255,255,0.08)',
      nodeBorder: '#3b82f6',
      mainBkg: '#0d0d12',
      edgeLabelBackground: 'transparent',
    } : {
      background: 'transparent',
      // Minimalist neutrals for light mode charts
      primaryColor: '#111827',
      primaryTextColor: '#f8fafc',
      primaryBorderColor: '#374151',
      lineColor: '#64748b',
      secondaryColor: '#0f172a',
      tertiaryColor: 'transparent',
      fontFamily: '"Inter", sans-serif',
      fontSize: '13px',
      clusterBkg: 'rgba(15,23,42,0.03)',
      clusterBorder: 'rgba(51,65,85,0.18)',
      nodeBorder: '#374151',
      mainBkg: 'transparent',
      edgeLabelBackground: 'transparent',
    },
    flowchart: {
      padding: 20,
      useMaxWidth: true,
      htmlLabels: true,
      curve: 'basis',
    },
  });
}

// Inject CSS once on module load
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = MERMAID_TRANSPARENT_STYLE;
  document.head.appendChild(style);
}

function sanitizeChart(chart) {
  // Remove HTML-unsafe characters from node labels while keeping structure
  return chart
    .replace(/\[([^\]]*)\]/g, (_, label) => `["${label.replace(/"/g, "'").replace(/[<>]/g, '')}"]`)
    .replace(/\(([^)]*)\)/g, (_, label) => `("${label.replace(/"/g, "'").replace(/[<>]/g, '')}")`)
    .replace(/\{([^}]*)\}/g, (_, label) => `{"${label.replace(/"/g, "'").replace(/[<>]/g, '')}"}`);
}

export default function MermaidChart({ chart, sop }) {
  const chartRef = useRef(null);
  const [hasError, setHasError] = useState(false);

  // Detect dark mode via the class on <html>
  const isDark = document.documentElement.classList.contains('dark');

  useEffect(() => {
    initMermaid(isDark);
    const renderChart = async () => {
      if (chartRef.current && chart) {
        setHasError(false);
        // Try original chart first, then sanitized fallback
        for (const attempt of [chart, sanitizeChart(chart)]) {
          try {
            const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
            await mermaid.parse(attempt);
            const { svg } = await mermaid.render(id, attempt);
            if (chartRef.current) {
              const cleaned = svg.replace(
                /<rect[^>]*x="0"[^>]*y="0"[^>]*fill="[^"]*"[^>]*>/g,
                (match) => match.replace(/fill="[^"]*"/, 'fill="transparent"')
              );
              chartRef.current.innerHTML = cleaned;
            }
            return; // success
          } catch (error) {
            console.error('Mermaid rendering error (attempt):', error);
          }
        }
        // Both attempts failed — try a simple fallback from SOP data
        if (sop?.length) {
          try {
            const nodes = sop.slice(0, 6).map((s, i) => {
              const label = (s.title || `Step ${i + 1}`).replace(/[^a-zA-Z0-9 ]/g, '').slice(0, 30);
              return `S${i}["${label}"]`;
            });
            const arrows = sop.slice(0, 5).map((_, i) => `S${i} --> S${i + 1}`);
            const fallback = `flowchart LR\n  ${nodes.join('\n  ')}\n  ${arrows.join('\n  ')}`;
            const id = `mermaid-fallback-${Math.random().toString(36).substr(2, 9)}`;
            await mermaid.parse(fallback);
            const { svg } = await mermaid.render(id, fallback);
            if (chartRef.current) {
              const cleaned = svg.replace(
                /<rect[^>]*x="0"[^>]*y="0"[^>]*fill="[^"]*"[^>]*>/g,
                (match) => match.replace(/fill="[^"]*"/, 'fill="transparent"')
              );
              chartRef.current.innerHTML = cleaned;
            }
            return;
          } catch (e) {
            console.error('Fallback chart error:', e);
          }
        }
        setHasError(true);
      }
    };
    renderChart();
  }, [chart, isDark]);

  if (hasError) {
    const steps = sop?.slice(0, 5) || [];
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[400px] gap-6 px-4">
        {steps.length > 0 ? (
          <div className="w-full max-w-4xl">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {steps.map((step, i) => (
                <React.Fragment key={i}>
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className="w-32 rounded-xl p-3 text-center border"
                      style={{ background: 'rgba(99,102,241,0.08)', borderColor: 'rgba(99,102,241,0.2)' }}
                    >
                      <div className="text-[8px] font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(99,102,241,0.7)' }}>Phase {i + 1}</div>
                      <div className="text-[10px] font-semibold leading-tight" style={{ color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(15,23,42,0.85)' }}>
                        {(step.title || '').replace(/^phase\s*\d+:?\s*/i, '').slice(0, 28)}
                      </div>
                    </div>
                  </div>
                  {i < steps.length - 1 && (
                    <div style={{ color: 'rgba(99,102,241,0.4)', fontSize: '18px' }}>→</div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
              <svg className="w-6 h-6" style={{ color: 'rgba(99,102,241,0.6)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <p style={{ color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(15,23,42,0.4)' }} className="text-sm font-medium">Process map will render after generation</p>
          </div>
        )}
      </div>
    );
  }

  return <div ref={chartRef} className="mermaid flex justify-center overflow-x-auto w-full min-h-[400px]" />;
}
