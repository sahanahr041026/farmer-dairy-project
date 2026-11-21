import React from 'react';

export function PhonePreview({ title, message }) {
  return (
    <div className="card" style={{
      backgroundColor: '#FFFFFF',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1rem' }}>
        Farmer Handset Screen Preview
      </h3>

      <div style={{
        width: 280,
        height: 440,
        borderRadius: 36,
        border: '8px solid #24332A',
        backgroundColor: '#f3f4f6',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <div style={{
          width: 60,
          height: 4,
          backgroundColor: '#9ca3af',
          borderRadius: 2,
          margin: '8px auto 6px'
        }} />

        <div style={{
          padding: '0.5rem 0.75rem',
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #e5e7eb',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#111827' }}>
            DAIRYSTH (KMF)
          </div>
          <div style={{ fontSize: '0.65rem', color: '#6b7280' }}>
            Official Cooperative SMS
          </div>
        </div>

        <div style={{ flex: 1, padding: '0.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px 12px 12px 2px',
            padding: '0.75rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            fontSize: '0.8rem',
            lineHeight: 1.45,
            color: '#1f2937',
            border: '1px solid #e5e7eb',
            wordBreak: 'break-word'
          }}>
            {title && (
              <strong style={{ display: 'block', color: 'var(--primary)', marginBottom: '0.25rem', fontSize: '0.82rem' }}>
                [{title}]
              </strong>
            )}
            {message || "Enter your SMS message in the form to see a live preview of how it will appear on low-cost feature and smartphones..."}
            <div style={{ textAlign: 'right', fontSize: '0.62rem', color: '#9ca3af', marginTop: '0.35rem' }}>
              Just now • SMS
            </div>
          </div>
        </div>

        <div style={{
          width: 100,
          height: 4,
          backgroundColor: '#24332A',
          borderRadius: 2,
          margin: '6px auto'
        }} />
      </div>
    </div>
  );
}
