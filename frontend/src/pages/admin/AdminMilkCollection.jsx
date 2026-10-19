import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/api';
import {
  MilkIcon, PlusIcon, EditIcon, CheckCircleIcon,
  AlertTriangleIcon, SearchIcon, SunIcon, MoonIcon, RefreshCwIcon
} from '../../components/Icons';
import { Modal } from '../../components/Modal';

export function AdminMilkCollection() {
  const [farmers, setFarmers] = useState([]);
  const [collections, setCollections] = useState([]);
  const [activeRateRule, setActiveRateRule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Farmer Search & Selection State
  const [farmerSearch, setFarmerSearch] = useState('');
  const [selectedFarmerId, setSelectedFarmerId] = useState('');

  // Form State
  const [collectionDate, setCollectionDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [session, setSession] = useState('morning');
  const [quantity, setQuantity] = useState('');
  const [fat, setFat] = useState('4.0');
  const [snf, setSnf] = useState('8.5');
  const [notes, setNotes] = useState('');

  // Live calculation preview
  const [previewRate, setPreviewRate] = useState(41.0);
  const [previewAmount, setPreviewAmount] = useState(0.0);

  // Correction Modal State
  const [editingRecord, setEditingRecord] = useState(null);
  const [correctQty, setCorrectQty] = useState('');
  const [correctFat, setCorrectFat] = useState('');
  const [correctSnf, setCorrectSnf] = useState('');
  const [correctReason, setCorrectReason] = useState('');
  const [correctError, setCorrectError] = useState('');
  const [isCorrecting, setIsCorrecting] = useState(false);

  // Filter State for History
  const [historySearch, setHistorySearch] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterSession, setFilterSession] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Notifications
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  // Load initial data
  const loadData = async () => {
    try {
      const [fList, cList, rRule] = await Promise.all([
        api.getFarmers(),
        api.getCollections({ limit: 100 }),
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
      setFormError("Failed to load data from server. Please verify connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered farmers for selection dropdown
  const filteredFarmers = useMemo(() => {
    if (!farmerSearch.trim()) return farmers;
    const term = farmerSearch.toLowerCase().trim();
    return farmers.filter((f) =>
      f.full_name.toLowerCase().includes(term) ||
      f.farmer_uid.toLowerCase().includes(term) ||
      (f.phone && f.phone.includes(term)) ||
      (f.village && f.village.toLowerCase().includes(term))
    );
  }, [farmers, farmerSearch]);

  // Selected farmer object
  const selectedFarmer = useMemo(() => {
    return farmers.find((f) => f.id.toString() === selectedFarmerId.toString()) || null;
  }, [farmers, selectedFarmerId]);

  // Live recalculate preview rate and amount whenever inputs change
  useEffect(() => {
    const q = parseFloat(quantity) || 0;
    const f = parseFloat(fat) || 4.0;
    const s = parseFloat(snf) || 8.5;

    if (activeRateRule) {
      let rate = 40.0;
      if (activeRateRule.calculation_method === 'flat_rate') {
        rate = activeRateRule.flat_rate ?? activeRateRule.base_rate ?? 40.0;
      } else {
        const fatDiff = f - activeRateRule.base_fat;
        const snfDiff = s - activeRateRule.base_snf;
        const calculatedRate = activeRateRule.base_rate +
          (fatDiff * 10 * activeRateRule.fat_rate_step) +
          (snfDiff * 10 * activeRateRule.snf_rate_step);
        const minR = activeRateRule.min_rate || 20.0;
        const maxR = activeRateRule.max_rate || 80.0;
        rate = Math.max(minR, Math.min(calculatedRate, maxR));
      }

      const roundedRate = Math.round(rate * 100) / 100;
      setPreviewRate(roundedRate);
      setPreviewAmount(Math.round(q * roundedRate * 100) / 100);
    }
  }, [quantity, fat, snf, activeRateRule]);

  // Handle milk collection save
  const handleSubmitCollection = async (e, forceOverwrite = false) => {
    if (e) e.preventDefault();
    setFormError('');
    setFormSuccess(null);

    const q = parseFloat(quantity);
    if (!q || q <= 0) {
      setFormError("Please enter a valid milk quantity in litres (must be > 0).");
      return;
    }

    if (!selectedFarmerId) {
      setFormError("Please select a registered farmer.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.recordCollection({
        farmer_id: parseInt(selectedFarmerId),
        collection_date: collectionDate,
        session,
        quantity_litres: q,
        fat_percentage: activeRateRule?.calculation_method === 'flat_rate' ? (parseFloat(fat) || null) : parseFloat(fat),
        snf_percentage: activeRateRule?.calculation_method === 'flat_rate' ? (parseFloat(snf) || null) : parseFloat(snf),
        notes: notes || undefined
      }, forceOverwrite);

      setFormSuccess({
        farmerName: res.farmer_name || selectedFarmer?.full_name,
        farmerUid: res.farmer_uid || selectedFarmer?.farmer_uid,
        date: res.collection_date,
        session: res.session,
        quantity: res.quantity_litres,
        rate: res.rate_per_litre,
        amount: res.total_amount
      });

      // Clear quantity and notes, keeping date and session for fast consecutive entries
      setQuantity('');
      setNotes('');
      setShowDuplicateModal(false);
      loadData();
    } catch (err) {
      if (err.message && (err.message.includes('Duplicate') || err.message.includes('already exists') || err.message.includes('409'))) {
        setShowDuplicateModal(true);
      } else {
        setFormError(err.message || "Failed to record milk collection.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open correction modal
  const handleOpenCorrection = (rec) => {
    setEditingRecord(rec);
    setCorrectQty(rec.quantity_litres.toString());
    setCorrectFat(rec.fat_percentage ? rec.fat_percentage.toString() : '4.0');
    setCorrectSnf(rec.snf_percentage ? rec.snf_percentage.toString() : '8.5');
    setCorrectReason('');
    setCorrectError('');
  };

  // Save record correction
  const handleSaveCorrection = async (e) => {
    e.preventDefault();
    if (!correctReason.trim()) {
      setCorrectError("Mandatory: Please provide a specific audit reason for this correction.");
      return;
    }

    const q = parseFloat(correctQty);
    if (!q || q <= 0) {
      setCorrectError("Quantity must be greater than zero.");
      return;
    }

    setIsCorrecting(true);
    try {
      await api.correctCollection(editingRecord.id, {
        quantity_litres: q,
        fat_percentage: parseFloat(correctFat) || null,
        snf_percentage: parseFloat(correctSnf) || null,
        reason: correctReason.trim()
      });

      setEditingRecord(null);
      loadData();
    } catch (err) {
      setCorrectError(err.message || "Failed to save correction.");
    } finally {
      setIsCorrecting(false);
    }
  };

  // Filtered collections for history table
  const filteredCollections = useMemo(() => {
    return collections.filter((c) => {
      // Search
      if (historySearch.trim()) {
        const term = historySearch.toLowerCase().trim();
        const matchName = c.farmer_name && c.farmer_name.toLowerCase().includes(term);
        const matchUid = c.farmer_uid && c.farmer_uid.toLowerCase().includes(term);
        if (!matchName && !matchUid) return false;
      }
      // Date range
      if (filterStartDate && c.collection_date < filterStartDate) return false;
      if (filterEndDate && c.collection_date > filterEndDate) return false;
      // Session
      if (filterSession !== 'all' && c.session !== filterSession) return false;
      // Record status
      if (filterStatus !== 'all' && c.record_status !== filterStatus) return false;

      return true;
    });
  }, [collections, historySearch, filterStartDate, filterEndDate, filterSession, filterStatus]);

  // Aggregate summary totals for filtered period
  const historySummary = useMemo(() => {
    const totalLitres = filteredCollections.reduce((sum, c) => sum + (c.quantity_litres || 0), 0);
    const totalAmount = filteredCollections.reduce((sum, c) => sum + (c.total_amount || 0), 0);
    return {
      totalLitres: Math.round(totalLitres * 10) / 10,
      totalAmount: Math.round(totalAmount * 100) / 100,
      count: filteredCollections.length
    };
  }, [filteredCollections]);

  return (
    <div style={{ animation: 'fadeIn 0.2s ease' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)' }}>
            Milk Collection Management
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Record milk collection intake with authoritative rate calculation, duplicate prevention, and instant farmer portal synchronization
          </p>
        </div>
        <button
          onClick={loadData}
          className="btn btn-outline touch-target"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
        >
          <RefreshCwIcon size={16} />
          <span>Refresh Data</span>
        </button>
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
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                  {activeRateRule?.calculation_method === 'flat_rate' ? 'Configured Flat Rate' : 'Calculated Quality Rate'}
                </span>
                <strong style={{ fontSize: '1.15rem', color: 'var(--primary)' }}>₹{previewRate.toFixed(2)} / L</strong>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                  Estimated Milk Value (Live)
                </span>
                <strong style={{ fontSize: '1.35rem', color: 'var(--primary)' }}>₹{previewAmount.toFixed(2)}</strong>
              </div>
            </div>

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

        {/* Pricing Policy Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.75rem' }}>
              Active Cooperative Pricing Policy
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1rem' }}>
              Procurement amounts are governed strictly by the cooperative's rate rules resolved on collection date.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border)' }}>
                <span>Rule Policy Name:</span>
                <strong>{activeRateRule?.rule_name || 'Standard Quality Matrix'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border)' }}>
                <span>Calculation Method:</span>
                <strong style={{ textTransform: 'capitalize' }}>
                  {activeRateRule?.calculation_method === 'flat_rate' ? 'Simple Flat Rate' : 'Quality Matrix (Fat + SNF)'}
                </strong>
              </div>
              {activeRateRule?.calculation_method === 'flat_rate' ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border)' }}>
                  <span>Configured Flat Rate:</span>
                  <strong>₹{activeRateRule?.flat_rate?.toFixed(2) || '40.00'} / L</strong>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border)' }}>
                    <span>Standard Base Rate (4.0% F / 8.5% S):</span>
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
                </>
              )}
            </div>
          </div>

          <div style={{
            marginTop: '1.5rem',
            padding: '0.75rem',
            backgroundColor: 'var(--bg-page)',
            borderRadius: 6,
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            lineHeight: 1.5
          }}>
            <strong>Automatic Farmer Sync Guarantee:</strong> All saved records persist to the shared SQL database and become immediately queryable on the authenticated farmer's mobile passbook.
          </div>
        </div>
      </div>

      {/* Collection History Table & Filters */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)' }}>
              Milk Collection History & Audit Log
            </h3>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Showing {filteredCollections.length} records in current view
            </span>
          </div>

          {/* Filter Bar */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search Input */}
            <input
              type="text"
              placeholder="Search farmer name or UID..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              className="form-input"
              style={{ minHeight: 36, padding: '0.35rem 0.65rem', fontSize: '0.82rem', width: 180 }}
            />

            {/* Date Range */}
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="form-input"
              title="Start Date"
              style={{ minHeight: 36, padding: '0.35rem 0.5rem', fontSize: '0.82rem', width: 135 }}
            />
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="form-input"
              title="End Date"
              style={{ minHeight: 36, padding: '0.35rem 0.5rem', fontSize: '0.82rem', width: 135 }}
            />

            {/* Session Filter */}
            <select
              value={filterSession}
              onChange={(e) => setFilterSession(e.target.value)}
              className="form-input"
              style={{ minHeight: 36, padding: '0.35rem 0.5rem', fontSize: '0.82rem', width: 110 }}
            >
              <option value="all">All Sessions</option>
              <option value="morning">Morning</option>
              <option value="evening">Evening</option>
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="form-input"
              style={{ minHeight: 36, padding: '0.35rem 0.5rem', fontSize: '0.82rem', width: 115 }}
            >
              <option value="all">All Status</option>
              <option value="recorded">Recorded</option>
              <option value="corrected">Corrected</option>
            </select>
          </div>
        </div>

        {/* Aggregated Filter Summary Banner */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.75rem 1rem',
          backgroundColor: 'var(--bg-page)',
          borderRadius: 8,
          marginBottom: '1rem',
          fontSize: '0.88rem'
        }}>
          <div>
            Total Filtered Volume: <strong style={{ color: 'var(--primary)', fontSize: '1.05rem' }}>{historySummary.totalLitres} L</strong>
          </div>
          <div>
            Total Filtered Milk Value: <strong style={{ color: 'var(--primary)', fontSize: '1.05rem' }}>₹{historySummary.totalAmount.toLocaleString()}</strong>
          </div>
        </div>

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
                <th style={{ padding: '0.65rem' }}>Status</th>
                <th style={{ padding: '0.65rem' }}>Audit Trail</th>
                <th style={{ padding: '0.65rem' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCollections.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No milk collection records found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredCollections.map((c) => {
                  const hasAudit = c.audits && c.audits.length > 0;
                  const isCorrected = c.record_status === 'corrected' || hasAudit;
                  return (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.65rem' }}>
                        <strong>{c.collection_date}</strong>{' '}
                        <span style={{ textTransform: 'capitalize', color: 'var(--text-muted)' }}>({c.session})</span>
                      </td>
                      <td style={{ padding: '0.65rem' }}>
                        <strong>{c.farmer_name}</strong>{' '}
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>({c.farmer_uid})</span>
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
                        <span className={`badge ${isCorrected ? 'badge-pending' : 'badge-settled'}`}>
                          {isCorrected ? 'Corrected' : 'Recorded'}
                        </span>
                      </td>
                      <td style={{ padding: '0.65rem' }}>
                        {hasAudit ? (
                          <span style={{ fontSize: '0.78rem', color: 'var(--status-pending)', fontWeight: 600 }}>
                            {c.audits[c.audits.length - 1].reason}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Original Entry</span>
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
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Duplicate Record Confirmation Modal */}
      <Modal
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
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

      {/* Record Correction Modal with Mandatory Reason */}
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
            Farmer: <strong>{editingRecord.farmer_name}</strong> ({editingRecord.farmer_uid})<br />
            Date & Session: <strong>{editingRecord.collection_date} ({editingRecord.session.toUpperCase()})</strong><br />
            Original: <strong>{editingRecord.quantity_litres}L</strong> (₹{editingRecord.total_amount.toFixed(2)})
          </div>

          <form onSubmit={handleSaveCorrection}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              <div className="form-group">
                <label className="form-label">New Qty (L) *</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
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
                  min="2.0"
                  max="12.0"
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
                  min="5.0"
                  max="12.0"
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
                placeholder="e.g. Weighing scale tare adjustment or clerical keying correction"
                value={correctReason}
                onChange={(e) => setCorrectReason(e.target.value)}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                This explanation will be permanently recorded in the audit trail and visible to the farmer.
              </span>
            </div>

            <button
              type="submit"
              disabled={isCorrecting}
              className="btn btn-primary"
              style={{ width: '100%', minHeight: 48, fontWeight: 700 }}
            >
              {isCorrecting ? "Applying Correction..." : "Apply Correction & Sync Farmer Portal"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
