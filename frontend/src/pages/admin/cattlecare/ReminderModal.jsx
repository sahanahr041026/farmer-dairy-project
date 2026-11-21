import React from 'react';
import { Modal } from '../../../components/Modal';

export function ReminderModal({
  isReminderModalOpen, setIsReminderModalOpen, formSuccess, templates, handleApplyTemplate,
  handleCreateReminder, farmers, targetFarmerId, setTargetFarmerId, careType, setCareType,
  dueDate, setDueDate, remTitle, setRemTitle, remTitleKn, setRemTitleKn,
  remGuidance, setRemGuidance, vetNotes, setVetNotes
}) {
  return (
    <Modal
      isOpen={isReminderModalOpen}
      onClose={() => setIsReminderModalOpen(false)}
      title="Schedule Cattle Care Reminder / Camp"
    >
      {formSuccess && (
        <div style={{ padding: '0.75rem', backgroundColor: 'var(--status-settled-bg)', color: 'var(--status-settled)', borderRadius: 6, marginBottom: '1rem', fontWeight: 600 }}>
          {formSuccess}
        </div>
      )}

      {/* Quick Campaign Template Bar */}
      {templates.length > 0 && (
        <div style={{ marginBottom: '1rem', padding: '0.6rem', backgroundColor: 'var(--bg-main)', borderRadius: 6 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
            Quick Health Templates:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
            {templates.map(tpl => (
              <button
                type="button"
                key={tpl.template_id}
                onClick={() => handleApplyTemplate(tpl)}
                className="touch-target"
                style={{
                  fontSize: '0.72rem',
                  padding: '0.25rem 0.5rem',
                  borderRadius: 4,
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--primary)',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                ⚡ {tpl.title.split('(')[0].trim()}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleCreateReminder}>
        <div className="form-group">
          <label className="form-label">Target Farmer *</label>
          <select
            className="form-input"
            value={targetFarmerId}
            onChange={(e) => setTargetFarmerId(e.target.value)}
            required
          >
            {farmers.map(f => (
              <option key={f.id} value={f.id}>{f.full_name} ({f.farmer_uid})</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <label className="form-label">Care Type *</label>
            <select
              className="form-input"
              value={careType}
              onChange={(e) => setCareType(e.target.value)}
            >
              <option value="vaccination">Vaccination (FMD, BQ, HS)</option>
              <option value="deworming">Deworming Drive</option>
              <option value="vet_camp">Veterinary Health Camp</option>
              <option value="health_check">Routine Health Checkup</option>
              <option value="nutrition">Mineral / Feed Advisory</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Due Date *</label>
            <input
              type="date"
              className="form-input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Reminder Title (English) *</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. FMD Booster Dose"
            value={remTitle}
            onChange={(e) => setRemTitle(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Reminder Title (Kannada Optional)</label>
          <input
            type="text"
            className="form-input"
            placeholder="ಉದಾ: ಕಾಲುಬಾಯಿ ರೋಗದ ಲಸಿಕೆ"
            value={remTitleKn}
            onChange={(e) => setRemTitleKn(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Farmer Care Guidance (Preparation Steps)</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Keep animals in shade, do not feed heavy meals 2 hours prior..."
            value={remGuidance}
            onChange={(e) => setRemGuidance(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Veterinary Instructions & Clinical Notes</label>
          <textarea
            className="form-input"
            rows="2"
            placeholder="Special instructions for the cooperative vet officer..."
            value={vetNotes}
            onChange={(e) => setVetNotes(e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%', minHeight: 48 }}>
          Schedule & Notify Farmer
        </button>
      </form>
    </Modal>
  );
}
