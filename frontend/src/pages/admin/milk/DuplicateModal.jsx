import React from 'react';
import { AlertTriangleIcon } from '../../../components/Icons';
import { Modal } from '../../../components/Modal';

export function DuplicateModal({
  isOpen, onClose, selectedFarmer, collectionDate, session, onConfirm
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Duplicate Record Detected"
    >
      <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
        <AlertTriangleIcon size={36} color="var(--status-pending)" style={{ margin: '0 auto 0.5rem' }} />
        <p style={{ fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
          A milk collection record already exists for <strong>{selectedFarmer?.full_name}</strong> on <strong>{collectionDate}</strong> ({session.toUpperCase()} session).
        </p>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          Cooperative ledger rules prevent accidental duplicate entries. Do you wish to overwrite this session record?
        </p>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button
          onClick={onClose}
          className="btn btn-outline"
          style={{ flex: 1 }}
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="btn btn-primary"
          style={{ flex: 1 }}
        >
          Confirm Overwrite
        </button>
      </div>
    </Modal>
  );
}
