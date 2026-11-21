import React from 'react';

export function JobsSummary({ smsSummary }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
      <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Total Jobs</span>
        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>{smsSummary.total_jobs}</span>
      </div>
      <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Delivered / Sent</span>
        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669' }}>{smsSummary.sent + smsSummary.delivered}</span>
      </div>
      <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Pending in Queue</span>
        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#d97706' }}>{smsSummary.pending}</span>
      </div>
      <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Failed / Undelivered</span>
        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#dc2626' }}>{smsSummary.failed}</span>
      </div>
      <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Success Rate</span>
        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>{smsSummary.success_rate_percent}%</span>
      </div>
    </div>
  );
}
