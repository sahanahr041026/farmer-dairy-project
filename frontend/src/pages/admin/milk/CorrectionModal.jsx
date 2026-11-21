import React from 'react';
import { Modal } from '../../../components/Modal';

export function CorrectionModal({
  editingRecord, setEditingRecord, correctError, handleSaveCorrection,
  correctQty, setCorrectQty, correctFat, setCorrectFat,
  correctSnf, setCorrectSnf, correctReason, setCorrectReason, isCorrecting
}) {
  return (
    <Modal
      isOpen={!!editingRecord}
      onClose={() => setEditingRecord(null)}
      title={`Correct Milk Record #${editingRecord.id}`}
    >
      {correctError && (
        <div style={{ padding: '0.75rem', backgroundColor: 'var(--status-overdue-bg)', color: 'var(--status-overdue)', borderRadius: 6, marginBottom: '1rem', fontWeight: 600 }}>
          {correctError}
        </div>
      )}

      <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-page)', borderRadius: 6, marginBottom: '1rem', fontSize: '0.85rem' }}>
        Farmer: <strong>{editingRecord.farmer_name}</strong> ({editingRecord.farmer_uid})<br />
        Date & Session: <strong>{editingRecord.collection_date} ({editingRecord.session.toUpperCase()})</strong><br />
        Original: <strong>{editingRecord.quantity_litres}L</strong> (₹{editingRecord.total_amount.toFixed(2)})
      </div>

      <form onSubmit={handleSaveCorrection}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
          <div className="form-group">
            <label className="form-label">New Qty (L) *</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              className="form-input"
              value={correctQty}
              onChange={(e) => setCorrectQty(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Fat %</label>
            <input
              type="number"
              step="0.1"
              min="2.0"
              max="12.0"
              className="form-input"
              value={correctFat}
              onChange={(e) => setCorrectFat(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">SNF %</label>
            <input
              type="number"
              step="0.1"
              min="5.0"
              max="12.0"
              className="form-input"
              value={correctSnf}
              onChange={(e) => setCorrectSnf(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Audit Correction Reason (Mandatory) *</label>
          <textarea
            className="form-input"
            rows="3"
            required
            placeholder="e.g. Weighing scale tare adjustment or clerical keying correction"
            value={correctReason}
            onChange={(e) => setCorrectReason(e.target.value)}
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            This explanation will be permanently recorded in the audit trail and visible to the farmer.
          </span>
        </div>

        <button
          type="submit"
          disabled={isCorrecting}
          className="btn btn-primary"
          style={{ width: '100%', minHeight: 48, fontWeight: 700 }}
        >
          {isCorrecting ? "Applying Correction..." : "Apply Correction & Sync Farmer Portal"}
        </button>
      </form>
    </Modal>
  );
}
