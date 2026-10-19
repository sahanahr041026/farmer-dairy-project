import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { TrendingUpIcon, CheckCircleIcon } from '../../components/Icons';

export function AdminRates() {
  const [currentRule, setCurrentRule] = useState(null);
  const [loading, setLoading] = useState(true);

  // New Rule Form
  const [baseRate, setBaseRate] = useState(41.0);
  const [baseFat, setBaseFat] = useState(4.0);
  const [baseSnf, setBaseSnf] = useState(8.5);
  const [fatStep, setFatStep] = useState(0.45);
  const [snfStep, setSnfStep] = useState(0.30);
  const [effectiveDate, setEffectiveDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Simulator
  const [simQty, setSimQty] = useState(10);
  const [simFat, setSimFat] = useState(4.2);
  const [simSnf, setSimSnf] = useState(8.6);
  const [simRate, setSimRate] = useState(0);
  const [simTotal, setSimTotal] = useState(0);

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadRate = async () => {
    try {
      const rule = await api.getCurrentRate();
      setCurrentRule(rule);
      setBaseRate(rule.base_rate);
      setBaseFat(rule.base_fat);
      setBaseSnf(rule.base_snf);
      setFatStep(rule.fat_rate_step);
      setSnfStep(rule.snf_rate_step);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRate();
  }, []);

  // Update simulator
  useEffect(() => {
    const fDiff = simFat - baseFat;
    const sDiff = simSnf - baseSnf;
    const rate = Math.max(baseRate + (fDiff * 10 * fatStep) + (sDiff * 10 * snfStep), 20.0);
    const roundedRate = Math.round(rate * 100) / 100;
    setSimRate(roundedRate);
    setSimTotal(Math.round(simQty * roundedRate * 100) / 100);
  }, [simQty, simFat, simSnf, baseRate, baseFat, baseSnf, fatStep, snfStep]);

  const handleUpdateRule = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    try {
      await api.createRate({
        base_rate: parseFloat(baseRate),
        base_fat: parseFloat(baseFat),
        base_snf: parseFloat(baseSnf),
        fat_rate_step: parseFloat(fatStep),
        snf_rate_step: parseFloat(snfStep),
        min_fat: 3.0,
        min_snf: 7.5,
        effective_date: effectiveDate
      });
      setSuccessMsg("Milk rate configuration updated successfully!");
      loadRate();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.2s ease' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)' }}>
          Milk Rate Rules & Quality Matrix
        </h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Define transparent milk procurement pricing rules based on butterfat and SNF content
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Active Rule Form */}
        <div className="card">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '1rem' }}>
            Configure Cooperative Rate Slabs
          </h3>

          {successMsg && (
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--status-settled-bg)', color: 'var(--status-settled)', borderRadius: 6, marginBottom: '1rem', fontWeight: 600 }}>
              {successMsg}
            </div>
          )}
          {errorMsg && (
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--status-overdue-bg)', color: 'var(--status-overdue)', borderRadius: 6, marginBottom: '1rem', fontWeight: 600 }}>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleUpdateRule}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Base Rate (₹/L) *</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={baseRate}
                  onChange={(e) => setBaseRate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Effective Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Standard Base Fat %</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={baseFat}
                  onChange={(e) => setBaseFat(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Standard Base SNF %</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={baseSnf}
                  onChange={(e) => setBaseSnf(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Fat Step (₹ per 0.1% diff)</label>
                <input
                  type="number"
                  step="0.05"
                  className="form-input"
                  value={fatStep}
                  onChange={(e) => setFatStep(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">SNF Step (₹ per 0.1% diff)</label>
                <input
                  type="number"
                  step="0.05"
                  className="form-input"
                  value={snfStep}
                  onChange={(e) => setSnfStep(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', minHeight: 48, marginTop: '0.5rem' }}>
              Publish New Rate Rule
            </button>
          </form>
        </div>

        {/* Live Rate Simulator */}
        <div className="card" style={{ border: '2px solid var(--accent)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            Interactive Quality Rate Simulator
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Simulate how quality variations alter the final payable rate and farmer bill amount.
          </p>

          <div className="form-group">
            <label className="form-label">Test Quantity (Litres): {simQty}L</label>
            <input
              type="range"
              min="1"
              max="50"
              value={simQty}
              onChange={(e) => setSimQty(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Test Fat %: {simFat}%</label>
            <input
              type="range"
              min="3.0"
              max="6.0"
              step="0.1"
              value={simFat}
              onChange={(e) => setSimFat(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Test SNF %: {simSnf}%</label>
            <input
              type="range"
              min="7.5"
              max="10.0"
              step="0.1"
              value={simSnf}
              onChange={(e) => setSimSnf(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{
            padding: '1.25rem',
            backgroundColor: 'var(--primary-light)',
            borderRadius: 'var(--radius-sm)',
            marginTop: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block' }}>Simulated Rate</span>
              <strong style={{ fontSize: '1.4rem', color: 'var(--primary)' }}>₹{simRate.toFixed(2)}/L</strong>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block' }}>Simulated Payout</span>
              <strong style={{ fontSize: '1.4rem', color: 'var(--primary)' }}>₹{simTotal.toFixed(2)}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
