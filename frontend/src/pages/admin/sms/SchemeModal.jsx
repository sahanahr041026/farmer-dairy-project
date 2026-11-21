import React from 'react';
import { Modal } from '../../../components/Modal';

export function SchemeModal({ isOpen, onClose, form, farmers, villages, handleCreateScheme, schemeSubmitting }) {
  const {
    schemeTitle, setSchemeTitle, schemeTitleKn, setSchemeTitleKn, schemeCategory, setSchemeCategory, schemeAudience, setSchemeAudience, schemeVillage, setSchemeVillage, schemeFarmerId, setSchemeFarmerId, schemeContent, setSchemeContent, schemeContentKn, setSchemeContentKn, schemeEligibility, setSchemeEligibility, schemeBenefits, setSchemeBenefits, schemeContact, setSchemeContact, schemeExpiresAt, setSchemeExpiresAt, schemeSendSms, setSchemeSendSms
  } = form;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Publish Cooperative Scheme or Notice"
      maxWidth={620}
    >
      <form onSubmit={handleCreateScheme}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <label className="form-label">Category *</label>
            <select
              className="form-input"
              value={schemeCategory}
              onChange={(e) => setSchemeCategory(e.target.value)}
            >
              <option value="subsidy">Government Subsidy (Pashu Bhagya etc.)</option>
              <option value="procurement">Procurement Notice & Bonus</option>
              <option value="health_camp">Veterinary / Vaccination Camp</option>
              <option value="meeting">General Body Meeting</option>
              <option value="general">General Notice</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Target Audience *</label>
            <select
              className="form-input"
              value={schemeAudience}
              onChange={(e) => setSchemeAudience(e.target.value)}
            >
              <option value="all">All Registered Farmers</option>
              <option value="village">Specific Village</option>
              <option value="individual">Individual Farmer</option>
            </select>
          </div>
        </div>

        {schemeAudience === 'village' && (
          <div className="form-group">
            <label className="form-label">Select Target Village *</label>
            <select
              className="form-input"
              value={schemeVillage}
              onChange={(e) => setSchemeVillage(e.target.value)}
            >
              {villages.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        )}

        {schemeAudience === 'individual' && (
          <div className="form-group">
            <label className="form-label">Select Target Farmer *</label>
            <select
              className="form-input"
              value={schemeFarmerId}
              onChange={(e) => setSchemeFarmerId(e.target.value)}
            >
              {farmers.map(f => <option key={f.id} value={f.id}>{f.full_name} ({f.farmer_uid})</option>)}
            </select>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Scheme Title (English) *</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Pashu Bhagya 50% Subsidy Scheme 2026"
            value={schemeTitle}
            onChange={(e) => setSchemeTitle(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Scheme Title (Kannada Optional)</label>
          <input
            type="text"
            className="form-input"
            placeholder="ಉದಾ: ಪಶು ಭಾಗ್ಯ ಶೇ ೫೦ ಸಹಾಯಧನ ಯೋಜನೆ"
            value={schemeTitleKn}
            onChange={(e) => setSchemeTitleKn(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Scheme Content / Description *</label>
          <textarea
            className="form-input"
            rows="3"
            placeholder="Detailed guidelines, required documents, and submission steps..."
            value={schemeContent}
            onChange={(e) => setSchemeContent(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Scheme Content (Kannada Optional)</label>
          <textarea
            className="form-input"
            rows="2"
            placeholder="ಕನ್ನಡ ವಿವರಣೆ..."
            value={schemeContentKn}
            onChange={(e) => setSchemeContentKn(e.target.value)}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <label className="form-label">Eligibility Criteria</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Small & marginal dairy farmers"
              value={schemeEligibility}
              onChange={(e) => setSchemeEligibility(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Benefits</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. ₹25,000 subsidy per cattle unit"
              value={schemeBenefits}
              onChange={(e) => setSchemeBenefits(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <label className="form-label">Contact Person / Office</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Society Secretary or Vet Officer"
              value={schemeContact}
              onChange={(e) => setSchemeContact(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Valid Until (Expiry Date)</label>
            <input
              type="date"
              className="form-input"
              value={schemeExpiresAt}
              onChange={(e) => setSchemeExpiresAt(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
          <input
            type="checkbox"
            id="send_sms_checkbox"
            checked={schemeSendSms}
            onChange={(e) => setSchemeSendSms(e.target.checked)}
            style={{ width: 18, height: 18 }}
          />
          <label htmlFor="send_sms_checkbox" style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)', cursor: 'pointer' }}>
            Queue SMS alert immediately to all eligible farmers
          </label>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
          <button
            type="button"
            onClick={() => onClose()}
            className="btn btn-outline"
            style={{ flex: 1 }}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ flex: 1.5 }}
            disabled={schemeSubmitting}
          >
            {schemeSubmitting ? "Publishing..." : "Publish & Notify Farmers"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
