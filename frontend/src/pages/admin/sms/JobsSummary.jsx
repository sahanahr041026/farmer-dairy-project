import React from 'react';

// The API returns per-status counts (queued, submitted, sent, delivered, failed, cancelled);
// "pending" and the success rate are derived here.
export function summarizeJobs(smsSummary) {
  const total = smsSummary.total_jobs || 0;
  const delivered = (smsSummary.sent || 0) + (smsSummary.delivered || 0);
  return {
    total,
    delivered,
    pending: (smsSummary.queued || 0) + (smsSummary.submitted || 0),
    failed: smsSummary.failed || 0,
    successRate: total > 0 ? Math.round((delivered / total) * 100) : 0,
  };
}

export function JobsSummary({ smsSummary }) {
  const stats = summarizeJobs(smsSummary);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
      <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Total Jobs</span>
        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>{stats.total}</span>
      </div>
      <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Delivered / Sent</span>
        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669' }}>{stats.delivered}</span>
      </div>
      <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Pending in Queue</span>
        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#d97706' }}>{stats.pending}</span>
      </div>
      <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Failed / Undelivered</span>
        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#dc2626' }}>{stats.failed}</span>
      </div>
      <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Success Rate</span>
        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>{stats.successRate}%</span>
      </div>
    </div>
  );
}
