import React from 'react';
import { Modal } from '../../../components/Modal';

export function PreviewModal({ previewData, isPreviewOpen, setIsPreviewOpen, message, sending, handleConfirmSend }) {
  return (
    <Modal
      isOpen={isPreviewOpen}
      onClose={() => setIsPreviewOpen(false)}
      title="Confirm SMS Broadcast Dispatch"
      maxWidth={600}
    >
      <div style={{
        padding: '0.75rem 1rem',
        backgroundColor: previewData.is_mock_gateway ? 'var(--status-pending-bg)' : 'var(--status-settled-bg)',
        color: previewData.is_mock_gateway ? 'var(--status-pending)' : 'var(--status-settled)',
        borderRadius: 6,
        marginBottom: '1rem',
        fontWeight: 700,
        fontSize: '0.85rem'
      }}>
        {previewData.mock_banner}
      </div>

      <div style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Target Audience:</span>
            <div><strong>{previewData.recipient_count} Valid Mobile Numbers</strong></div>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>SMS Segments:</span>
            <div><strong>{previewData.estimated_parts} part(s) ({previewData.message_length} chars)</strong></div>
          </div>
        </div>

        <div style={{ fontWeight: 700, marginBottom: '0.25rem', fontSize: '0.82rem' }}>Sample Recipients (Privacy Masked):</div>
        <div style={{ backgroundColor: 'var(--bg-page)', padding: '0.5rem', borderRadius: 6, fontSize: '0.8rem' }}>
          {previewData.sample_recipients.map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0' }}>
              <span>{r.name} ({r.village})</span>
              <strong>{r.phone}</strong>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '0.75rem', backgroundColor: '#FFFFFF', border: '1px solid var(--border)', borderRadius: 6, marginBottom: '1.25rem', fontSize: '0.85rem' }}>
        <strong>Message Preview:</strong>
        <p style={{ marginTop: '0.35rem', color: 'var(--text-main)', fontStyle: 'italic' }}>
          "{message}"
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button
          onClick={() => setIsPreviewOpen(false)}
          className="btn btn-outline"
          style={{ flex: 1 }}
          disabled={sending}
        >
          Back to Edit
        </button>
        <button
          onClick={handleConfirmSend}
          className="btn btn-primary"
          style={{ flex: 1.5 }}
          disabled={sending}
        >
          {sending ? "Transmitting..." : `Confirm & Broadcast to ${previewData.recipient_count} Farmers`}
        </button>
      </div>
    </Modal>
  );
}
