import React from 'react';
import { Modal } from '../../../components/Modal';

export function CompletionModal({
  completingRem, isCompletionModalOpen, setIsCompletionModalOpen,
  adminBy, setAdminBy, nextDueDate, setNextDueDate,
  completionNotes, setCompletionNotes, handleConfirmCompletion
}) {
  return (
    <Modal
      isOpen={isCompletionModalOpen}
      onClose={() => setIsCompletionModalOpen(false)}
      title={`Record Administration: ${completingRem.title}`}
      maxWidth={500}
    >
      <form onSubmit={handleConfirmCompletion}>
        <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-page)', borderRadius: 6, marginBottom: '1rem', fontSize: '0.85rem' }}>
          <div>Farmer: <strong>{completingRem.farmer_name}</strong></div>
          <div>Target: <strong>{completingRem.cattle_name ? `${completingRem.cattle_name} (${completingRem.cattle_tag})` : 'Herd-wide'}</strong></div>
          <div>Scheduled Date: <strong>{completingRem.due_date}</strong></div>
        </div>

        <div className="form-group">
          <label className="form-label">Administered By (Veterinarian / Staff Name) *</label>
          <input
            type="text"
            className="form-input"
            value={adminBy}
            onChange={(e) => setAdminBy(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Next Due Date (Booster / Next Schedule)</label>
          <input
            type="date"
            className="form-input"
            value={nextDueDate}
            onChange={(e) => setNextDueDate(e.target.value)}
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Recommended interval: 6 months for FMD booster, 1 year for Brucellosis.
          </span>
        </div>

        <div className="form-group">
          <label className="form-label">Clinical Observations & Verification Notes</label>
          <textarea
            className="form-input"
            rows="2"
            placeholder="e.g. Dose administered subcutaneously, normal vital signs..."
            value={completionNotes}
            onChange={(e) => setCompletionNotes(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
          <button
            type="button"
            onClick={() => setIsCompletionModalOpen(false)}
            className="btn btn-outline"
            style={{ flex: 1 }}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ flex: 1.5 }}
          >
            Verify & Complete Dose
          </button>
        </div>
      </form>
    </Modal>
  );
}
