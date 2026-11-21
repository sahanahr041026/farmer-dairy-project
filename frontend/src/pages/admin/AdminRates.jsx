import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {} from '../../components/Icons';

export function AdminRates() {
  const [_currentRule, setCurrentRule] = useState(null);
  const [_loading, setLoading] = useState(true);

  // Form State
  const [ruleName, setRuleName] = useState('Cooperative Quality Procurement Rule');
  const [version, setVersion] = useState('1.1');
  const [calculationMethod, setCalculationMethod] = useState('fat_snf_formula'); // 'fat_snf_formula' or 'flat_rate'
  const [flatRate, setFlatRate] = useState(42.0);
  const [baseRate, setBaseRate] = useState(41.0);
  const [baseFat, setBaseFat] = useState(4.0);
  const [baseSnf, setBaseSnf] = useState(8.5);
  const [fatStep, setFatStep] = useState(0.45);
  const [snfStep, setSnfStep] = useState(0.30);
  const [minRate, setMinRate] = useState(20.0);
  const [maxRate, setMaxRate] = useState(80.0);
  const [effectiveDate, setEffectiveDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Simulator State
  const [simQty, setSimQty] = useState(10);
  const [simFat, setSimFat] = useState(4.2);
  const [simSnf, setSimSnf] = useState(8.6);
  const [simRate, setSimRate] = useState(0);
  const [simTotal, setSimTotal] = useState(0);

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadRate = async () => {
    try {
      const rule = await api.getCurrentRate();
      setCurrentRule(rule);
      if (rule) {
        setRuleName(rule.rule_name || 'Standard Quality Matrix');
        setVersion(rule.version || '1.0');
        setCalculationMethod(rule.calculation_method || 'fat_snf_formula');
        setFlatRate(rule.flat_rate || 40.0);
        setBaseRate(rule.base_rate);
        setBaseFat(rule.base_fat);
        setBaseSnf(rule.base_snf);
        setFatStep(rule.fat_rate_step);
        setSnfStep(rule.snf_rate_step);
        setMinRate(rule.min_rate || 20.0);
        setMaxRate(rule.max_rate || 80.0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRate();
  }, []);

  // Update simulator when pricing parameters or test sliders change
  useEffect(() => {
    let rate = 0;
    if (calculationMethod === 'flat_rate') {
      rate = parseFloat(flatRate) || 0;
    } else {
      const fDiff = simFat - (parseFloat(baseFat) || 4.0);
      const sDiff = simSnf - (parseFloat(baseSnf) || 8.5);
      const calculated = (parseFloat(baseRate) || 40.0) + (fDiff * 10 * (parseFloat(fatStep) || 0.45)) + (sDiff * 10 * (parseFloat(snfStep) || 0.30));
      rate = Math.max(parseFloat(minRate) || 20.0, Math.min(calculated, parseFloat(maxRate) || 80.0));
    }
    const roundedRate = Math.round(rate * 100) / 100;
    setSimRate(roundedRate);
    setSimTotal(Math.round(simQty * roundedRate * 100) / 100);
  }, [simQty, simFat, simSnf, calculationMethod, flatRate, baseRate, baseFat, baseSnf, fatStep, snfStep, minRate, maxRate]);

  const handleUpdateRule = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      await api.createRate({
        rule_name: ruleName.trim(),
        version: version.trim(),
        calculation_method: calculationMethod,
        flat_rate: parseFloat(flatRate),
        base_rate: parseFloat(baseRate),
        base_fat: parseFloat(baseFat),
        base_snf: parseFloat(baseSnf),
        fat_rate_step: parseFloat(fatStep),
        snf_rate_step: parseFloat(snfStep),
        min_fat: 2.0,
        max_fat: 12.0,
        min_snf: 5.0,
        max_snf: 12.0,
        min_rate: parseFloat(minRate),
        max_rate: parseFloat(maxRate),
        effective_date: effectiveDate
      });
      setSuccessMsg("Cooperative milk rate configuration published successfully!");
      loadRate();
    } catch (err) {
      setErrorMsg(err.message || "Failed to update rate rule");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.2s ease' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)' }}>
          Milk Rate Rules & Quality Matrix
        </h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Configure cooperative procurement pricing rules: flat rate or transparent quality-based matrix
        </p>
      </div>

      {/* Notice Banner */}
      <div style={{
        padding: '0.75rem 1rem',
        backgroundColor: '#EFF6FF',
        border: '1px solid #BFDBFE',
        borderRadius: 8,
        fontSize: '0.82rem',
        color: '#1E40AF',
        marginBottom: '1.5rem',
        lineHeight: 1.5
      }}>
        <strong>Cooperative Pricing Policy Notice:</strong> Default rate formulas are loaded as <em>fictional demonstration data</em> for demonstration purposes. Cooperatives can configure either a simple flat rate per litre or a quality matrix with customized Fat and SNF steps.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Active Rule Form */}
        <div className="card">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '1rem' }}>
            Configure Pricing Policy
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
            {/* Calculation Method Selection */}
            <div className="form-group">
              <label className="form-label">Pricing Method *</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setCalculationMethod('fat_snf_formula')}
                  className="touch-target"
                  style={{
                    padding: '0.6rem',
                    borderRadius: 6,
                    border: '2px solid',
                    borderColor: calculationMethod === 'fat_snf_formula' ? 'var(--primary)' : 'var(--border)',
                    backgroundColor: calculationMethod === 'fat_snf_formula' ? 'var(--primary-light)' : 'var(--bg-card)',
                    color: calculationMethod === 'fat_snf_formula' ? 'var(--primary)' : 'var(--text-main)',
                    fontWeight: 700,
                    fontSize: '0.85rem'
                  }}
                >
                  Quality Matrix (Fat + SNF)
                </button>
                <button
                  type="button"
                  onClick={() => setCalculationMethod('flat_rate')}
                  className="touch-target"
                  style={{
                    padding: '0.6rem',
                    borderRadius: 6,
                    border: '2px solid',
                    borderColor: calculationMethod === 'flat_rate' ? 'var(--primary)' : 'var(--border)',
                    backgroundColor: calculationMethod === 'flat_rate' ? 'var(--primary-light)' : 'var(--bg-card)',
                    color: calculationMethod === 'flat_rate' ? 'var(--primary)' : 'var(--text-main)',
                    fontWeight: 700,
                    fontSize: '0.85rem'
                  }}
                >
                  Flat Rate per Litre
                </button>
              </div>
            </div>

            {/* Rule Name & Version */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Rule Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Version *</label>
                <input
                  type="text"
                  className="form-input"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Effective Date */}
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

            {/* Flat Rate Mode Inputs */}
            {calculationMethod === 'flat_rate' ? (
              <div className="form-group">
                <label className="form-label">Flat Rate per Litre (₹/L) *</label>
                <input
                  type="number"
                  step="0.1"
                  min="10.0"
                  max="120.0"
                  className="form-input"
                  value={flatRate}
                  onChange={(e) => setFlatRate(e.target.value)}
                  required
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  All intake will be procured at this flat rate regardless of quality testing.
                </span>
              </div>
            ) : (
              /* Quality Matrix Inputs */
              <>
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
                    <label className="form-label">Minimum Rate Floor (₹/L)</label>
                    <input
                      type="number"
                      step="0.5"
                      className="form-input"
                      value={minRate}
                      onChange={(e) => setMinRate(e.target.value)}
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
              </>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{ width: '100%', minHeight: 48, marginTop: '0.75rem' }}
            >
              {isSubmitting ? "Publishing Rate Rule..." : "Publish & Activate New Rate Rule"}
            </button>
          </form>
        </div>

        {/* Live Rate Simulator */}
        <div className="card" style={{ border: '2px solid var(--accent)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            Interactive Pricing Simulator
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Simulate how quality variations and volume alter the final payable rate and farmer bill amount.
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

          {calculationMethod === 'fat_snf_formula' && (
            <>
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
            </>
          )}

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
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block' }}>Simulated Milk Value</span>
              <strong style={{ fontSize: '1.4rem', color: 'var(--primary)' }}>₹{simTotal.toFixed(2)}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
