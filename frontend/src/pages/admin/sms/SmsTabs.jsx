import React from 'react';

export function SmsTabs({ activeTab, setActiveTab, announcements, smsSummary }) {
  return (
    <div style={{
      display: 'flex',
      gap: '0.5rem',
      borderBottom: '2px solid var(--border)',
      marginBottom: '1.5rem'
    }}>
      <button
        onClick={() => setActiveTab('campaigns')}
        style={{
          padding: '0.75rem 1.25rem',
          border: 'none',
          borderBottom: activeTab === 'campaigns' ? '3px solid var(--primary)' : '3px solid transparent',
          background: 'none',
          fontWeight: activeTab === 'campaigns' ? 800 : 600,
          color: activeTab === 'campaigns' ? 'var(--primary)' : 'var(--text-muted)',
          cursor: 'pointer',
          fontSize: '0.95rem'
        }}
      >
        SMS Broadcast Dispatch
      </button>

      <button
        onClick={() => setActiveTab('schemes')}
        style={{
          padding: '0.75rem 1.25rem',
          border: 'none',
          borderBottom: activeTab === 'schemes' ? '3px solid var(--primary)' : '3px solid transparent',
          background: 'none',
          fontWeight: activeTab === 'schemes' ? 800 : 600,
          color: activeTab === 'schemes' ? 'var(--primary)' : 'var(--text-muted)',
          cursor: 'pointer',
          fontSize: '0.95rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}
      >
        <span>Schemes & Announcements</span>
        <span style={{
          fontSize: '0.72rem',
          padding: '0.1rem 0.45rem',
          borderRadius: 12,
          backgroundColor: activeTab === 'schemes' ? 'var(--primary-light)' : '#f3f4f6',
          color: activeTab === 'schemes' ? 'var(--primary)' : 'var(--text-muted)',
          fontWeight: 700
        }}>
          {announcements.length}
        </span>
      </button>

      <button
        onClick={() => setActiveTab('jobs')}
        style={{
          padding: '0.75rem 1.25rem',
          border: 'none',
          borderBottom: activeTab === 'jobs' ? '3px solid var(--primary)' : '3px solid transparent',
          background: 'none',
          fontWeight: activeTab === 'jobs' ? 800 : 600,
          color: activeTab === 'jobs' ? 'var(--primary)' : 'var(--text-muted)',
          cursor: 'pointer',
          fontSize: '0.95rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}
      >
        <span>SMS Delivery Queue & Jobs</span>
        {smsSummary && smsSummary.failed > 0 && (
          <span style={{
            fontSize: '0.72rem',
            padding: '0.1rem 0.45rem',
            borderRadius: 12,
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            fontWeight: 700
          }}>
            {smsSummary.failed} Failed
          </span>
        )}
      </button>
    </div>
  );
}
