import React from 'react';
import { Modal } from '../../../components/Modal';

export function EditCattleModal({
  editingCattle, setEditingCattle, editSuccess, editError, handleSaveEditCattle,
  editName, setEditName, editBreed, setEditBreed, editAge, setEditAge,
  editYield, setEditYield, editStatus, setEditStatus, editNotes, setEditNotes
}) {
  return (
    <Modal
      isOpen={true}
      onClose={() => setEditingCattle(null)}
      title={`Edit Cattle Profile: ${editingCattle.name} (${editingCattle.tag_number})`}
    >
      {editSuccess ? (
        <div style={{ padding: '1rem', backgroundColor: 'var(--status-settled-bg)', color: 'var(--status-settled)', borderRadius: 6, fontWeight: 700 }}>
          {editSuccess}
        </div>
      ) : (
        <form onSubmit={handleSaveEditCattle}>
          {editError && (
            <div style={{ padding: '0.6rem', backgroundColor: 'var(--status-overdue-bg)', color: 'var(--status-overdue)', borderRadius: 6, marginBottom: '0.75rem', fontSize: '0.85rem' }}>
              {editError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Cattle Name *</label>
            <input
              type="text"
              className="form-input"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Breed *</label>
              <select className="form-input" value={editBreed} onChange={(e) => setEditBreed(e.target.value)}>
                <option value="Gir">Gir</option>
                <option value="Holstein Friesian">Holstein Friesian</option>
                <option value="Jersey">Jersey</option>
                <option value="Murrah Buffalo">Murrah Buffalo</option>
                <option value="Sahiwal">Sahiwal</option>
                <option value="Hallikar">Hallikar</option>
                <option value="Crossbred">Crossbred</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Age (Years)</label>
              <input type="number" step="0.1" className="form-input" value={editAge} onChange={(e) => setEditAge(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Est Yield (L)</label>
              <input type="number" step="0.5" className="form-input" value={editYield} onChange={(e) => setEditYield(e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-input" value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
              <option value="Milking">Milking</option>
              <option value="Dry">Dry</option>
              <option value="Pregnant">Pregnant</option>
              <option value="Heifer">Heifer</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Health Notes</label>
            <textarea
              className="form-input"
              rows="2"
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', minHeight: 46 }}>
            Save Cattle Changes
          </button>
        </form>
      )}
    </Modal>
  );
}
