import React from 'react';
import { AlertTriangleIcon } from '../../../components/Icons';

export function GatewayBanner() {
  return (
    <div style={{
      padding: '0.75rem 1.1rem',
      backgroundColor: '#fffbeb',
      border: '1.5px solid #fde68a',
      borderRadius: 'var(--radius-sm)',
      marginBottom: '1.25rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem'
    }}>
      <div style={{ color: '#d97706' }}>
        <AlertTriangleIcon size={20} />
      </div>
      <div style={{ fontSize: '0.85rem', color: '#92400e' }}>
        <strong>Gateway Mode: Simulated Provider (DLT Compliant Mode).</strong>
        <span style={{ display: 'block', fontSize: '0.78rem', color: '#b45309' }}>
          Farmer mobile numbers are protected with privacy masking (e.g. <code>+91 98451 •••••</code>) and deduplicated via cryptographic idempotency keys. Live DLT gateway activates when <code>SMS_GATEWAY_API_KEY</code> is configured.
        </span>
      </div>
    </div>
  );
}
