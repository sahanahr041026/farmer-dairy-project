import React, { useState } from 'react';

export function CollectionTrendChart({ data = [] }) {
  const [hovered, setHovered] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        No trend data available
      </div>
    );
  }

  const width = 650;
  const height = 220;
  const padding = { top: 20, right: 20, bottom: 35, left: 45 };

  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxTotal = Math.max(...data.map(d => d.total), 10);
  const yMax = Math.ceil((maxTotal * 1.15) / 10) * 10;

  const xStep = chartW / Math.max(data.length - 1, 1);

  // Compute points
  const pointsTotal = data.map((d, i) => {
    const x = padding.left + i * xStep;
    const y = padding.top + chartH - (d.total / yMax) * chartH;
    return { x, y, data: d };
  });

  const linePath = pointsTotal.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${pointsTotal[pointsTotal.length - 1].x.toFixed(1)} ${(padding.top + chartH).toFixed(1)} L ${pointsTotal[0].x.toFixed(1)} ${(padding.top + chartH).toFixed(1)} Z`;

  // Grid lines
  const yTicks = [0, yMax * 0.33, yMax * 0.66, yMax];

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', minWidth: 450, height: 'auto', display: 'block' }}>
        {/* Y Grid & Labels */}
        {yTicks.map((val, idx) => {
          const y = padding.top + chartH - (val / yMax) * chartH;
          return (
            <g key={idx}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="var(--border)" strokeDasharray="3 3" />
              <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="var(--text-muted)">
                {Math.round(val)}L
              </text>
            </g>
          );
        })}

        {/* Gradient fill */}
        <defs>
          <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#245C3A" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#245C3A" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Area & Line */}
        <path d={areaPath} fill="url(#trendGradient)" />
        <path d={linePath} fill="none" stroke="#245C3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Data Points */}
        {pointsTotal.map((p, idx) => (
          <g key={idx} onMouseEnter={() => setHovered(p)} onMouseLeave={() => setHovered(null)} style={{ cursor: 'pointer' }}>
            <circle cx={p.x} cy={p.y} r={hovered === p ? 6 : 4} fill="#FFFFFF" stroke="#245C3A" strokeWidth="2.5" />
            {/* X Axis Labels every 2 steps or on ends */}
            {(idx % 2 === 0 || idx === data.length - 1) && (
              <text x={p.x} y={height - 10} textAnchor="middle" fontSize="10" fill="var(--text-muted)">
                {p.data.date}
              </text>
            )}
          </g>
        ))}

        {/* Tooltip */}
        {hovered && (
          <g transform={`translate(${Math.min(hovered.x, width - 110)}, ${Math.max(hovered.y - 45, 10)})`}>
            <rect width="100" height="38" rx="6" fill="#24332A" opacity="0.92" />
            <text x="10" y="16" fill="#FFFFFF" fontSize="10" fontWeight="600">{hovered.data.date}</text>
            <text x="10" y="30" fill="#F2C45A" fontSize="10">Total: {hovered.data.total}L (₹{hovered.data.amount})</text>
          </g>
        )}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: 12, height: 3, backgroundColor: '#245C3A', borderRadius: 2 }}></span> Total Daily Litres
        </span>
      </div>
    </div>
  );
}

export function QualityBarChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        No quality data available
      </div>
    );
  }

  const maxCount = Math.max(...data.map(d => d.count), 1);
  const colors = ["#e5b64c", "#6FAF68", "#245C3A", "#1b452c"];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.5rem 0' }}>
      {data.map((item, idx) => {
        const pct = Math.round((item.count / maxCount) * 100);
        return (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600 }}>
              <span>{item.label}</span>
              <span style={{ color: 'var(--text-muted)' }}>{item.count} samples ({pct}%)</span>
            </div>
            <div style={{ width: '100%', height: 16, backgroundColor: 'var(--primary-light)', borderRadius: 8, overflow: 'hidden' }}>
              <div
                style={{
                  width: `${pct}%`,
                  height: '100%',
                  backgroundColor: colors[idx % colors.length],
                  borderRadius: 8,
                  transition: 'width 0.4s ease'
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
