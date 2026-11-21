import React from 'react';
import { MilkIcon, CheckCircleIcon, SearchIcon } from '../../../components/Icons';
import { RatePreviewBox } from './RatePreviewBox';

export function MilkEntryForm({
  activeRateRule, formSuccess, formError, handleSubmitCollection,
  farmerSearch, setFarmerSearch, selectedFarmerId, setSelectedFarmerId,
  filteredFarmers, selectedFarmer,
  collectionDate, setCollectionDate, session, setSession,
  quantity, setQuantity, fat, setFat, snf, setSnf,
  previewRate, previewAmount, isSubmitting
}) {
  return (
    <div className="card" style={{ border: '2px solid var(--secondary)' }}>
      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <MilkIcon size={22} />
        <span>Record Milk Intake</span>
      </h3>

      {/* Success Banner */}
      {formSuccess && (
        <div style={{
          padding: '0.85rem 1rem',
          backgroundColor: 'var(--status-settled-bg)',
          color: 'var(--status-settled)',
          borderRadius: 8,
          marginBottom: '1.25rem',
          border: '1px solid var(--secondary)',
          lineHeight: 1.5
        }}>
          <div style={{ fontWeight: 800, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
            <CheckCircleIcon size={18} />
            <span>Intake Successfully Recorded & Synchronized!</span>
          </div>
          <div style={{ fontSize: '0.85rem' }}>
            Farmer: <strong>{formSuccess.farmerName}</strong> ({formSuccess.farmerUid})<br />
            Date & Session: <strong>{formSuccess.date} ({formSuccess.session.toUpperCase()})</strong><br />
            Intake Volume: <strong>{formSuccess.quantity} L</strong> @ <strong>₹{formSuccess.rate.toFixed(2)}/L</strong><br />
            Total Milk Value: <strong>₹{formSuccess.amount.toFixed(2)}</strong> (Persisted in database & updated in farmer passbook)
          </div>
        </div>
      )}

      {/* Error Banner */}
      {formError && (
        <div style={{ padding: '0.75rem', backgroundColor: 'var(--status-overdue-bg)', color: 'var(--status-overdue)', borderRadius: 6, marginBottom: '1rem', fontWeight: 600 }}>
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmitCollection}>
        {/* Searchable Farmer Selector */}
        <div className="form-group">
          <label className="form-label">Search & Select Registered Farmer *</label>
          <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Type name, UID (e.g. DS-FARM-101), or phone..."
              value={farmerSearch}
              onChange={(e) => setFarmerSearch(e.target.value)}
              style={{ paddingLeft: '2rem' }}
            />
            <span style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
              <SearchIcon size={16} />
            </span>
          </div>

          <select
            className="form-input"
            value={selectedFarmerId}
            onChange={(e) => setSelectedFarmerId(e.target.value)}
            required
          >
            {filteredFarmers.length === 0 ? (
              <option value="" disabled>No matching farmers found</option>
            ) : (
              filteredFarmers.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.full_name} ({f.farmer_uid}) — {f.village} {f.phone ? `• ${f.phone}` : ''}
                </option>
              ))
            )}
          </select>

          {/* Selected Farmer Info Card */}
          {selectedFarmer && (
            <div style={{
              marginTop: '0.5rem',
              padding: '0.6rem 0.8rem',
              backgroundColor: 'var(--bg-page)',
              borderRadius: 6,
              fontSize: '0.82rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <strong>{selectedFarmer.full_name}</strong> | UID: <code>{selectedFarmer.farmer_uid}</code>
                <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  Village: {selectedFarmer.village} {selectedFarmer.phone ? `| Phone: ${selectedFarmer.phone}` : ''}
                </span>
              </div>
              <span className="badge badge-settled" style={{ fontSize: '0.72rem' }}>
                Active Member
              </span>
            </div>
          )}
        </div>

        {/* Date & Session */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <label className="form-label">Collection Date *</label>
            <input
              type="date"
              className="form-input"
              value={collectionDate}
              onChange={(e) => setCollectionDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Session *</label>
            <select
              className="form-input"
              value={session}
              onChange={(e) => setSession(e.target.value)}
            >
              <option value="morning">Morning (ಬೆಳಿಗ್ಗೆ)</option>
              <option value="evening">Evening (ಸಂಜೆ)</option>
            </select>
          </div>
        </div>

        {/* Quantity, Fat, SNF */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
          <div className="form-group">
            <label className="form-label">Quantity (L) *</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              className="form-input"
              placeholder="e.g. 14.5"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Fat % {activeRateRule?.calculation_method === 'flat_rate' ? '(Opt)' : '*'}
            </label>
            <input
              type="number"
              step="0.1"
              min="2.0"
              max="12.0"
              className="form-input"
              value={fat}
              onChange={(e) => setFat(e.target.value)}
              required={activeRateRule?.calculation_method !== 'flat_rate'}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              SNF % {activeRateRule?.calculation_method === 'flat_rate' ? '(Opt)' : '*'}
            </label>
            <input
              type="number"
              step="0.1"
              min="5.0"
              max="12.0"
              className="form-input"
              value={snf}
              onChange={(e) => setSnf(e.target.value)}
              required={activeRateRule?.calculation_method !== 'flat_rate'}
            />
          </div>
        </div>

        {/* Real-time Calculation Summary Box */}
        <RatePreviewBox
          activeRateRule={activeRateRule}
          previewRate={previewRate}
          previewAmount={previewAmount}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary"
          style={{ width: '100%', minHeight: 48, fontWeight: 700 }}
        >
          {isSubmitting ? "Recording & Synchronizing..." : "Save Record & Synchronize to Farmer Portal"}
        </button>
      </form>
    </div>
  );
}
