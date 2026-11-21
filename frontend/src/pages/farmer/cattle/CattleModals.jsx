import React from 'react';
import { t } from '../../../i18n';
import { Modal } from '../../../components/Modal';

function BreedOptions() {
  return (
    <>
      <option value="Gir">Gir (ಗಿರ್)</option>
      <option value="Murrah Buffalo">Murrah Buffalo (ಮುರ್ರಾ)</option>
      <option value="Jersey Cross">Jersey Cross (ಜರ್ಸಿ)</option>
      <option value="Holstein Friesian">Holstein Friesian (HF)</option>
      <option value="Sahiwal">Sahiwal (ಸಾಹಿವಾಲ್)</option>
      <option value="Hallikar">Hallikar (ಹಳ್ಳಿಕಾರ್)</option>
      <option value="Other / Crossbreed">Other / Crossbreed</option>
    </>
  );
}

function StatusOptions() {
  return (
    <>
      <option value="Milking">Milking (ಹಾಲು ನೀಡುವ)</option>
      <option value="Dry">Dry (ಬತ್ತಿದ ಹಸು)</option>
      <option value="Pregnant">Pregnant (ಗರ್ಭಿಣಿ)</option>
      <option value="Heifer">Heifer (ಕರು/ಹೆಣ್ಣು ಕರು)</option>
    </>
  );
}

const successStyle = { padding: '1rem', backgroundColor: 'var(--status-settled-bg)', color: 'var(--status-settled)', borderRadius: 6, fontWeight: 700 };
const errorStyle = { padding: '0.6rem', backgroundColor: 'var(--status-overdue-bg)', color: 'var(--status-overdue)', borderRadius: 6, marginBottom: '0.75rem', fontSize: '0.85rem' };

export function AddCattleModal({ language, add }) {
  const {
    isAddModalOpen, setIsAddModalOpen,
    addTag, setAddTag, addName, setAddName,
    addBreed, setAddBreed, addAge, setAddAge,
    addStatus, setAddStatus, addYield, setAddYield,
    addNotes, setAddNotes, addError, addSuccess,
    handleAddCattle
  } = add;

  return (
    <Modal
      isOpen={isAddModalOpen}
      onClose={() => setIsAddModalOpen(false)}
      title={t("add_cattle", language)}
    >
      {addSuccess ? (
        <div style={successStyle}>
          {addSuccess}
        </div>
      ) : (
        <form onSubmit={handleAddCattle}>
          {addError && (
            <div style={errorStyle}>
              {addError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">{t("tag_number", language)} *</label>
            <input
              type="text"
              className="form-input"
              required
              placeholder="e.g. KA-14-GIR-05"
              value={addTag}
              onChange={(e) => setAddTag(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t("cow_name", language)} *</label>
            <input
              type="text"
              className="form-input"
              required
              placeholder="e.g. Ganga / Lakshmi"
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">{t("breed", language)}</label>
              <select className="form-input" value={addBreed} onChange={(e) => setAddBreed(e.target.value)}>
                <BreedOptions />
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">{t("milking_status", language)}</label>
              <select className="form-input" value={addStatus} onChange={(e) => setAddStatus(e.target.value)}>
                <StatusOptions />
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">{t("age", language)} ({t("years", language)})</label>
              <input
                type="number"
                step="0.5"
                className="form-input"
                value={addAge}
                onChange={(e) => setAddAge(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t("daily_yield", language)} (L/day)</label>
              <input
                type="number"
                step="0.5"
                className="form-input"
                value={addYield}
                onChange={(e) => setAddYield(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t("health_notes", language)}</label>
            <textarea
              className="form-input"
              rows="2"
              placeholder="Vaccination status, feeding notes, calving history..."
              value={addNotes}
              onChange={(e) => setAddNotes(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', minHeight: 46 }}>
            {t("add_cattle", language)}
          </button>
        </form>
      )}
    </Modal>
  );
}

export function EditCattleModal({ language, edit }) {
  const {
    editingCattle, setEditingCattle,
    editName, setEditName, editBreed, setEditBreed,
    editStatus, setEditStatus, editAge, setEditAge,
    editYield, setEditYield, editNotes, setEditNotes,
    editError, editSuccess, handleUpdateCattle
  } = edit;

  if (!editingCattle) return null;

  return (
    <Modal
      isOpen={true}
      onClose={() => setEditingCattle(null)}
      title={`${t("edit_cattle", language)}: ${editingCattle.name} (${editingCattle.tag_number})`}
    >
      {editSuccess ? (
        <div style={successStyle}>
          {editSuccess}
        </div>
      ) : (
        <form onSubmit={handleUpdateCattle}>
          {editError && (
            <div style={errorStyle}>
              {editError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">{t("cow_name", language)} *</label>
            <input
              type="text"
              className="form-input"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">{t("breed", language)}</label>
              <select className="form-input" value={editBreed} onChange={(e) => setEditBreed(e.target.value)}>
                <BreedOptions />
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">{t("milking_status", language)}</label>
              <select className="form-input" value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                <StatusOptions />
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">{t("age", language)} ({t("years", language)})</label>
              <input
                type="number"
                step="0.5"
                className="form-input"
                value={editAge}
                onChange={(e) => setEditAge(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t("daily_yield", language)} (L/day)</label>
              <input
                type="number"
                step="0.5"
                className="form-input"
                value={editYield}
                onChange={(e) => setEditYield(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t("health_notes", language)}</label>
            <textarea
              className="form-input"
              rows="2"
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', minHeight: 46 }}>
            {language === 'kn' ? 'ಬದಲಾವಣೆಗಳನ್ನು ಉಳಿಸಿ' : 'Save Changes'}
          </button>
        </form>
      )}
    </Modal>
  );
}
