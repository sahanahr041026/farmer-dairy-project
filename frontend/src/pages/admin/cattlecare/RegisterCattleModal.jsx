import React from 'react';
import { Modal } from '../../../components/Modal';

export function RegisterCattleModal({
  isCattleModalOpen, setIsCattleModalOpen, handleCreateCattle, farmers,
  cattleFarmerId, setCattleFarmerId, cTag, setCTag, cName, setCName,
  cBreed, setCBreed, cAge, setCAge, cYield, setCYield,
  cStatus, setCStatus, cNotes, setCNotes
}) {
  return (
    <Modal
      isOpen={isCattleModalOpen}
      onClose={() => setIsCattleModalOpen(false)}
      title="Register Cattle Profile"
    >
      <form onSubmit={handleCreateCattle}>
        <div className="form-group">
          <label className="form-label">Farmer Owner *</label>
          <select
            className="form-input"
            value={cattleFarmerId}
            onChange={(e) => setCattleFarmerId(e.target.value)}
            required
          >
            {farmers.map(f => (
              <option key={f.id} value={f.id}>{f.full_name} ({f.farmer_uid})</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <label className="form-label">Cattle Tag Number *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. KA-14-GIR-12"
              value={cTag}
              onChange={(e) => setCTag(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Name / Nickname *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Kaveri"
              value={cName}
              onChange={(e) => setCName(e.target.value)}
              required
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
          <div className="form-group">
            <label className="form-label">Breed *</label>
            <select className="form-input" value={cBreed} onChange={(e) => setCBreed(e.target.value)}>
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
            <input type="number" step="0.1" className="form-input" value={cAge} onChange={(e) => setCAge(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Est Yield (L)</label>
            <input type="number" step="0.5" className="form-input" value={cYield} onChange={(e) => setCYield(e.target.value)} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Status</label>
          <select className="form-input" value={cStatus} onChange={(e) => setCStatus(e.target.value)}>
            <option value="Milking">Milking</option>
            <option value="Dry">Dry</option>
            <option value="Pregnant">Pregnant</option>
            <option value="Heifer">Heifer</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Health & Vaccination Notes</label>
          <textarea
            className="form-input"
            rows="2"
            placeholder="Health notes, tags, remarks..."
            value={cNotes}
            onChange={(e) => setCNotes(e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%', minHeight: 48 }}>
          Register Animal in Database
        </button>
      </form>
    </Modal>
  );
}
