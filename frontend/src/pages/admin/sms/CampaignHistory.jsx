import React from 'react';

export function CampaignHistory({ campaigns }) {
  return (
    <div className="card">
      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '1rem' }}>
        Broadcast Campaign History
      </h3>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
              <th style={{ padding: '0.65rem' }}>Date & Time</th>
              <th style={{ padding: '0.65rem' }}>Campaign Title</th>
              <th style={{ padding: '0.65rem' }}>Audience</th>
              <th style={{ padding: '0.65rem' }}>Recipients</th>
              <th style={{ padding: '0.65rem' }}>Delivery Status</th>
              <th style={{ padding: '0.65rem' }}>Message Text</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '0.65rem', whiteSpace: 'nowrap' }}>
                  {new Date(c.sent_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </td>
                <td style={{ padding: '0.65rem', fontWeight: 700, color: 'var(--primary)' }}>
                  {c.title}
                </td>
                <td style={{ padding: '0.65rem', textTransform: 'capitalize' }}>
                  {c.target_audience} {c.target_locality ? `(${c.target_locality})` : ''}
                </td>
                <td style={{ padding: '0.65rem', fontWeight: 700 }}>
                  {c.recipient_count} farmers
                </td>
                <td style={{ padding: '0.65rem' }}>
                  <span className="badge badge-approved" style={{ fontSize: '0.75rem' }}>
                    {c.delivery_status}
                  </span>
                </td>
                <td style={{ padding: '0.65rem', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.message}>
                  {c.message}
                </td>
              </tr>
            ))}
            {campaigns.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No broadcast campaigns recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
