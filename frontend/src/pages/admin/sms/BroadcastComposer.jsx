import React from 'react';

export function BroadcastComposer({ form, templates, farmers, villages, handleApplyTemplate, handleRequestPreview, charStats }) {
  const { title, setTitle, message, setMessage, targetAudience, setTargetAudience, targetLocality, setTargetLocality, targetFarmerId, setTargetFarmerId } = form;
  const { charLength, isUnicode, maxSingle, parts } = charStats;

  return (
    <div className="card" style={{ border: '2px solid var(--secondary)' }}>
      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '1rem' }}>
        Compose Broadcast SMS
      </h3>

      <form onSubmit={handleRequestPreview}>
        {/* Template Presets */}
        <div className="form-group">
          <label className="form-label">Load Verified Announcement Template (Optional)</label>
          <select
            className="form-input"
            onChange={(e) => handleApplyTemplate(e.target.value)}
            defaultValue=""
          >
            <option value="" disabled>-- Select a standard template --</option>
            {templates.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        {/* Target Audience */}
        <div className="form-group">
          <label className="form-label">Target Farmer Audience *</label>
          <select
            className="form-input"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            required
          >
            <option value="all">All Registered Farmers ({farmers.length} active members)</option>
            <option value="locality">Farmers in Specific Village / Locality</option>
            <option value="individual">Individual Farmer</option>
          </select>
        </div>

        {/* Locality Selector */}
        {targetAudience === 'locality' && (
          <div className="form-group">
            <label className="form-label">Select Village *</label>
            <select
              className="form-input"
              value={targetLocality}
              onChange={(e) => setTargetLocality(e.target.value)}
              required
            >
              {villages.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
        )}

        {/* Individual Farmer Selector */}
        {targetAudience === 'individual' && (
          <div className="form-group">
            <label className="form-label">Select Farmer *</label>
            <select
              className="form-input"
              value={targetFarmerId}
              onChange={(e) => setTargetFarmerId(e.target.value)}
              required
            >
              {farmers.map(f => (
                <option key={f.id} value={f.id}>{f.full_name} ({f.phone ? `••••${f.phone.slice(-4)}` : 'No phone'}) — {f.village}</option>
              ))}
            </select>
          </div>
        )}

        {/* Campaign Title */}
        <div className="form-group">
          <label className="form-label">Campaign Title / Subject *</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Free Cattle Vaccination Camp"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        {/* Message Body */}
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <label className="form-label" style={{ margin: 0 }}>SMS Message Text *</label>
            <span style={{ fontSize: '0.78rem', color: charLength > maxSingle ? 'var(--status-pending)' : 'var(--text-muted)' }}>
              {charLength} chars | {parts} SMS {isUnicode ? '(Unicode)' : '(GSM 7-bit)'}
            </span>
          </div>
          <textarea
            className="form-input"
            rows="4"
            placeholder="Type verified announcement details..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
            Note: Transparent, DLT-formatted text prevents delivery rejection by telecom operators.
          </span>
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%', minHeight: 48 }}>
          <span>Preview & Validate Recipients</span>
        </button>
      </form>
    </div>
  );
}
