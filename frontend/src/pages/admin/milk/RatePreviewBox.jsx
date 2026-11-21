import React from 'react';

export function RatePreviewBox({ activeRateRule, previewRate, previewAmount }) {
  return (
    <div style={{
      padding: '0.85rem 1rem',
      backgroundColor: 'var(--primary-light)',
      borderRadius: 'var(--radius-sm)',
      marginBottom: '1rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
          {activeRateRule?.calculation_method === 'flat_rate' ? 'Configured Flat Rate' : 'Calculated Quality Rate'}
        </span>
        <strong style={{ fontSize: '1.15rem', color: 'var(--primary)' }}>₹{previewRate.toFixed(2)} / L</strong>
      </div>
      <div style={{ textAlign: 'right' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
          Estimated Milk Value (Live)
        </span>
        <strong style={{ fontSize: '1.35rem', color: 'var(--primary)' }}>₹{previewAmount.toFixed(2)}</strong>
      </div>
    </div>
  );
}
