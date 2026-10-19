import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  MilkIcon, PlusIcon, EditIcon, CheckCircleIcon,
  AlertTriangleIcon, SearchIcon, SunIcon, MoonIcon
} from '../../components/Icons';
import { Modal } from '../../components/Modal';

export function AdminMilkCollection() {
  const [farmers, setFarmers] = useState([]);
  const [collections, setCollections] = useState([]);
  const [activeRateRule, setActiveRateRule] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedFarmerId, setSelectedFarmerId] = useState('');
  const [collectionDate, setCollectionDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [session, setSession] = useState('morning');
  const [quantity, setQuantity] = useState('');
  const [fat, setFat] = useState('4.0');
  const [snf, setSnf] = useState('8.5');
  const [notes, setNotes] = useState('');

  // Live calculation preview
  const [previewRate, setPreviewRate] = useState(41.0);
  const [previewAmount, setPreviewAmount] = useState(0.0);

  // Correction Modal
  const [editingRecord, setEditingRecord] = useState(null);
  const [correctQty, setCorrectQty] = useState('');
  const [correctFat, setCorrectFat] = useState('');
  const [correctSnf, setCorrectSnf] = useState('');
  const [correctReason, setCorrectReason] = useState('');
  const [correctError, setCorrectError] = useState('');

  // Notifications
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  const loadData = async () => {
    try {
      const [fList, cList, rRule] = await Promise.all([
        api.getFarmers(),
        api.getCollections({ limit: 50 }),
        api.getCurrentRate()
      ]);
      setFarmers(fList);
      setCollections(cList);
      setActiveRateRule(rRule);
      if (fList.length > 0 && !selectedFarmerId) {
        setSelectedFarmerId(fList[0].id.toString());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Recalculate live preview
  useEffect(() => {
    const q = parseFloat(quantity) || 0;
    const f = parseFloat(fat) || 4.0;
    const s = parseFloat(snf) || 8.5;

    if (activeRateRule) {
      const fatDiff = f - activeRateRule.base_fat;
      const snfDiff = s - activeRateRule.base_snf;
      const calculatedRate = Math.max(
        activeRateRule.base_rate + (fatDiff * 10 * activeRateRule.fat_rate_step) + (snfDiff * 10 * activeRateRule.snf_rate_step),
        20.0
      );
      setPreviewRate(Math.round(calculatedRate * 100) / 100);
      setPreviewAmount(Math.round(q * calculatedRate * 100) / 100);
    }
  }, [quantity, fat, snf, activeRateRule]);

  const handleSubmitCollection = async (e, forceOverwrite = false) => {
    if (e) e.preventDefault();
    setFormError('');
    setFormSuccess('');

    const q = parseFloat(quantity);
    if (!q || q <= 0) {
      setFormError("Please enter a valid milk quantity in litres.");
      return;
    }

    try {
      await api.recordCollection({
        farmer_id: parseInt(selectedFarmerId),
        collection_date: collectionDate,
        session,
        quantity_litres: q,
        fat_percentage: parseFloat(fat) || null,
        snf_percentage: parseFloat(snf) || null,
        notes: notes || undefined
      }, forceOverwrite);

      setFormSuccess(`Successfully recorded ${q}L (₹${previewAmount.toFixed(2)})! Synchronized to farmer portal.`);
      setQuantity('');
      setNotes('');
      setShowDuplicateModal(false);
      loadData();
    } catch (err) {
      if (err.message.includes('already exists') || err.message.includes('409')) {
        setShowDuplicateModal(true);
      } else {
        setFormError(err.message);
      }
    }
  };

  const handleOpenCorrection = (rec) => {
    setEditingRecord(rec);
    setCorrectQty(rec.quantity_litres.toString());
    setCorrectFat(rec.fat_percentage ? rec.fat_percentage.toString() : '4.0');
    setCorrectSnf(rec.snf_percentage ? rec.snf_percentage.toString() : '8.5');
    setCorrectReason('');
    setCorrectError('');
  };

  const handleSaveCorrection = async (e) => {
    e.preventDefault();
    if (!correctReason.trim()) {
      setCorrectError("Mandatory: Please provide a reason for this correction.");
      return;
    }

    try {
      await api.correctCollection(editingRecord.id, {
        quantity_litres: parseFloat(correctQty),
        fat_percentage: parseFloat(correctFat) || null,
        snf_percentage: parseFloat(correctSnf) || null,
        reason: correctReason.trim()
      });

      setEditingRecord(null);
      loadData();
    } catch (err) {
      setCorrectError(err.message);
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.2s ease' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)' }}>
          Milk Collection & Rate Processing
        </h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Record daily intake with automated rate calculation, duplicate prevention, and instant farmer portal sync
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {/* Collection Form Card */}
        <div className="card" style={{ border: '2px solid var(--secondary)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MilkIcon size={22} />
            <span>Record Milk Entry</span>
          </h3>

          {formSuccess && (
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--status-settled-bg)', color: 'var(--status-settled)', borderRadius: 6, marginBottom: '1rem', fontWeight: 600 }}>
              {formSuccess}
            </div>
          )}
          {formError && (
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--status-overdue-bg)', color: 'var(--status-overdue)', borderRadius: 6, marginBottom: '1rem', fontWeight: 600 }}>
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmitCollection}>
            {/* Farmer Selector */}
            <div className="form-group">
              <label className="form-label">Select Registered Farmer *</label>
              <select
                className="form-input"
                value={selectedFarmerId}
                onChange={(e) => setSelectedFarmerId(e.target.value)}
                required
              >
                {farmers.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.full_name} ({f.farmer_uid}) — {f.village}
                  </option>
                ))}
              </select>
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
                  placeholder="e.g. 12.5"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Fat % *</label>
                <input
                  type="number"
                  step="0.1"
                  min="2.0"
                  max="12.0"
                  className="form-input"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">SNF % *</label>
                <input
                  type="number"
                  step="0.1"
                  min="6.0"
                  max="12.0"
                  className="form-input"
                  value={snf}
                  onChange={(e) => setSnf(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Real-time Calculation Summary Box */}
            <div style={{
              padding: '0.85rem 1rem',
              backgroundColor: 'var(--primary-light)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>Calculated Milk Rate</span>
                <strong style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>₹{previewRate.toFixed(2)} / L</strong>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>Total Calculated Amount</span>
                <strong style={{ fontSize: '1.3rem', color: 'var(--primary)' }}>₹{previewAmount.toFixed(2)}</strong>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', minHeight: 48 }}>
              Save & Synchronize to Farmer Portal
            </button>
          </form>
        </div>

        {/* Rate Reference Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.75rem' }}>
              Active Milk Pricing Formula
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1rem' }}>
              Rates are governed by cooperative transparent quality slabs. Adjustments are dynamically applied for Fat and SNF variance from standard base.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border)' }}>
                <span>Base Rate (at 4.0% Fat / 8.5% SNF):</span>
                <strong>₹{activeRateRule?.base_rate?.toFixed(2) || '41.00'} / L</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border)' }}>
                <span>Fat Step (per 0.1% diff):</span>
                <strong>+₹{activeRateRule?.fat_rate_step?.toFixed(2) || '0.45'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border)' }}>
                <span>SNF Step (per 0.1% diff):</span>
                <strong>+₹{activeRateRule?.snf_rate_step?.toFixed(2) || '0.30'}</strong>
              </div>
            </div>
          </div>

          <div style={{
            marginTop: '1.5rem',
            padding: '0.75rem',
            backgroundColor: 'var(--bg-page)',
            borderRadius: 6,
            fontSize: '0.8rem',
            color: 'var(--text-muted)'
          }}>
            <strong>Automatic Farmer Sync Guarantee:</strong> Persists to PostgreSQL, recalculates ledger, refreshes passbook and triggers farmer notification.
          </div>
        </div>
      </div>

      {/* Collection Log Table */}
      <div className="card">
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '1rem' }}>
          Milk Collections Audit History
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.65rem' }}>Date & Session</th>
                <th style={{ padding: '0.65rem' }}>Farmer</th>
                <th style={{ padding: '0.65rem' }}>Qty (L)</th>
                <th style={{ padding: '0.65rem' }}>Fat / SNF %</th>
                <th style={{ padding: '0.65rem' }}>Rate</th>
                <th style={{ padding: '0.65rem' }}>Amount</th>
                <th style={{ padding: '0.65rem' }}>Payment</th>
                <th style={{ padding: '0.65rem' }}>Audits / Corrections</th>
                <th style={{ padding: '0.65rem' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {collections.map((c) => {
                const hasAudit = c.audits && c.audits.length > 0;
                return (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.65rem' }}>
                      <strong>{c.collection_date}</strong> ({c.session})
                    </td>
                    <td style={{ padding: '0.65rem' }}>
                      {c.farmer_name} <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>({c.farmer_uid})</span>
                    </td>
                    <td style={{ padding: '0.65rem', fontWeight: 700, color: 'var(--primary)' }}>
                      {c.quantity_litres} L
                    </td>
                    <td style={{ padding: '0.65rem' }}>
                      {c.fat_percentage ? `${c.fat_percentage}%` : '-'} / {c.snf_percentage ? `${c.snf_percentage}%` : '-'}
                    </td>
                    <td style={{ padding: '0.65rem' }}>₹{c.rate_per_litre.toFixed(2)}</td>
                    <td style={{ padding: '0.65rem', fontWeight: 700 }}>₹{c.total_amount.toFixed(2)}</td>
                    <td style={{ padding: '0.65rem' }}>
                      <span className={`badge badge-${c.payment_status}`}>
                        {c.payment_status}
                      </span>
                    </td>
                    <td style={{ padding: '0.65rem' }}>
                      {hasAudit ? (
                        <span style={{ fontSize: '0.78rem', color: 'var(--status-pending)', fontWeight: 600 }}>
                          Adjusted: {c.audits[c.audits.length - 1].reason}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Original</span>
                      )}
                    </td>
                    <td style={{ padding: '0.65rem' }}>
                      <button
                        onClick={() => handleOpenCorrection(c)}
                        className="btn btn-outline touch-target"
                        style={{ minHeight: 32, padding: '0.25rem 0.6rem', fontSize: '0.78rem' }}
                      >
                        Correct
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Duplicate Record Confirmation Modal */}
      <Modal
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        title="Existing Record Detected"
      >
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <AlertTriangleIcon size={36} color="var(--status-pending)" style={{ margin: '0 auto 0.5rem' }} />
          <p style={{ fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
            A milk collection record already exists for this farmer on <strong>{collectionDate}</strong> ({session} session).
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Do you wish to overwrite the existing record with the new values?
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => setShowDuplicateModal(false)}
            className="btn btn-outline"
            style={{ flex: 1 }}
          >
            Cancel
          </button>
          <button
            onClick={() => handleSubmitCollection(null, true)}
            className="btn btn-primary"
            style={{ flex: 1 }}
          >
            Confirm Overwrite
          </button>
        </div>
      </Modal>

      {/* Record Correction Modal */}
      {editingRecord && (
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
            Farmer: <strong>{editingRecord.farmer_name}</strong> | Date: <strong>{editingRecord.collection_date} ({editingRecord.session})</strong>
          </div>

          <form onSubmit={handleSaveCorrection}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              <div className="form-group">
                <label className="form-label">New Qty (L) *</label>
                <input
                  type="number"
                  step="0.1"
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
                placeholder="e.g. Weighing scale recalibration or clerical keying adjustment"
                value={correctReason}
                onChange={(e) => setCorrectReason(e.target.value)}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                This explanation will be permanently audited and visible to the farmer.
              </span>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', minHeight: 48 }}>
              Apply Correction & Sync Farmer Portal
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
