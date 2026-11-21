import React from 'react';

export function RatePolicyCard({ activeRateRule }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.75rem' }}>
          Active Cooperative Pricing Policy
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1rem' }}>
          Procurement amounts are governed strictly by the cooperative's rate rules resolved on collection date.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.88rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border)' }}>
            <span>Rule Policy Name:</span>
            <strong>{activeRateRule?.rule_name || 'Standard Quality Matrix'}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border)' }}>
            <span>Calculation Method:</span>
            <strong style={{ textTransform: 'capitalize' }}>
              {activeRateRule?.calculation_method === 'flat_rate' ? 'Simple Flat Rate' : 'Quality Matrix (Fat + SNF)'}
            </strong>
          </div>
          {activeRateRule?.calculation_method === 'flat_rate' ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border)' }}>
              <span>Configured Flat Rate:</span>
              <strong>₹{activeRateRule?.flat_rate?.toFixed(2) || '40.00'} / L</strong>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border)' }}>
                <span>Standard Base Rate (4.0% F / 8.5% S):</span>
                <strong>₹{activeRateRule?.base_rate?.toFixed(2) || '41.00'} / L</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border)' }}>
                <span>Fat Step (per 0.1% diff):</span>
                <strong>+₹{activeRateRule?.fat_rate_step?.toFixed(2) || '0.45'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border)' }}>
                <span>SNF Step (per 0.1% diff):</span>
                <strong>+₹{activeRateRule?.snf_rate_step?.toFixed(2) || '0.30'}</strong>
              </div>
            </>
          )}
        </div>
      </div>

      <div style={{
        marginTop: '1.5rem',
        padding: '0.75rem',
        backgroundColor: 'var(--bg-page)',
        borderRadius: 6,
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
        lineHeight: 1.5
      }}>
        <strong>Automatic Farmer Sync Guarantee:</strong> All saved records persist to the shared SQL database and become immediately queryable on the authenticated farmer's mobile passbook.
      </div>
    </div>
  );
}
