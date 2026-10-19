import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { ShieldCheckIcon, PlusIcon, CheckCircleIcon, AlertTriangleIcon } from '../../components/Icons';
import { Modal } from '../../components/Modal';

export function AdminPayments() {
  const [farmers, setFarmers] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Settlement Generator Modal
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [targetFarmerId, setTargetFarmerId] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 14);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState('Direct Deposit');
  const [genError, setGenError] = useState('');
  const [genSuccess, setGenSuccess] = useState('');

  // Mark Paid Modal
  const [markingSettlement, setMarkingSettlement] = useState(null);
  const [refNumber, setRefNumber] = useState('');
  const [payDate, setPayDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [payModeSelected, setPayModeSelected] = useState('Direct Deposit');

  const loadData = async () => {
    try {
      const [fList, sList] = await Promise.all([
        api.getFarmers(),
        api.getSettlements()
      ]);
      setFarmers(fList);
      setSettlements(sList);
      if (fList.length > 0 && !targetFarmerId) {
        setTargetFarmerId(fList[0].id.toString());
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

  const handleGenerateSettlement = async (e) => {
    e.preventDefault();
    setGenError('');
    setGenSuccess('');

    try {
      await api.createSettlement({
        farmer_id: parseInt(targetFarmerId),
        period_start: startDate,
        period_end: endDate,
        payment_mode: paymentMode
      });
      setGenSuccess("Billing settlement generated and approved successfully!");
      loadData();
      setTimeout(() => {
        setIsGenerateOpen(false);
        setGenSuccess('');
      }, 1500);
    } catch (err) {
      setGenError(err.message);
    }
  };

  const handleCompletePayment = async (e) => {
    e.preventDefault();
    if (!markingSettlement) return;

    try {
      await api.updateSettlement(markingSettlement.id, {
        status: 'completed',
        paid_amount: markingSettlement.approved_amount,
        reference_no: refNumber || `TXN-${Date.now().toString().slice(-6)}`,
        payment_date: payDate
      });
      setMarkingSettlement(null);
      loadData();
    } catch (err) {
      alert("Error completing settlement: " + err.message);
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.2s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)' }}>
            Milk Payments & Bill Settlements
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Calculate payment disbursements, approve milk statements, and track banking transfers
          </p>
        </div>

        <button
          onClick={() => setIsGenerateOpen(true)}
          className="btn btn-primary touch-target"
        >
          <PlusIcon size={18} />
          <span>Generate Period Settlement</span>
        </button>
      </div>

      {/* Settlements Table */}
      <div className="card">
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '1rem' }}>
          Payment Settlements Ledger
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem' }}>Settlement ID</th>
                <th style={{ padding: '0.75rem' }}>Farmer</th>
                <th style={{ padding: '0.75rem' }}>Period</th>
                <th style={{ padding: '0.75rem' }}>Total Milk</th>
                <th style={{ padding: '0.75rem' }}>Calculated (₹)</th>
                <th style={{ padding: '0.75rem' }}>Approved (₹)</th>
                <th style={{ padding: '0.75rem' }}>Paid (₹)</th>
                <th style={{ padding: '0.75rem' }}>Mode & Reference</th>
                <th style={{ padding: '0.75rem' }}>Status</th>
                <th style={{ padding: '0.75rem' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {settlements.map((s) => {
                const isCompleted = s.status === 'completed';
                return (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 700 }}>#{s.id}</td>
                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>
                      {s.farmer_name} <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>({s.farmer_uid})</span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {s.period_start} to {s.period_end}
                    </td>
                    <td style={{ padding: '0.75rem', fontWeight: 700 }}>{s.total_litres} L</td>
                    <td style={{ padding: '0.75rem' }}>₹{s.calculated_amount.toFixed(2)}</td>
                    <td style={{ padding: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>
                      ₹{s.approved_amount.toFixed(2)}
                    </td>
                    <td style={{ padding: '0.75rem', fontWeight: 700, color: isCompleted ? 'var(--status-settled)' : 'var(--status-pending)' }}>
                      ₹{s.paid_amount.toFixed(2)}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <div>{s.payment_mode}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ref: {s.reference_no || 'Pending'}</div>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className={`badge ${isCompleted ? 'badge-settled' : 'badge-pending'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {!isCompleted ? (
                        <button
                          onClick={() => {
                            setMarkingSettlement(s);
                            setRefNumber(`NEFT-KMF-${Math.floor(100000 + Math.random() * 900000)}`);
                          }}
                          className="btn btn-secondary touch-target"
                          style={{ minHeight: 34, padding: '0.3rem 0.65rem', fontSize: '0.78rem' }}
                        >
                          Mark Paid
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: 'var(--status-settled)', fontWeight: 600 }}>
                          ✓ Disbursed
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Settlement Modal */}
      <Modal
        isOpen={isGenerateOpen}
        onClose={() => setIsGenerateOpen(false)}
        title="Generate Milk Settlement Statement"
        maxWidth={580}
      >
        {genSuccess && (
          <div style={{ padding: '0.85rem', backgroundColor: 'var(--status-settled-bg)', color: 'var(--status-settled)', borderRadius: 6, marginBottom: '1rem', fontWeight: 600 }}>
            {genSuccess}
          </div>
        )}
        {genError && (
          <div style={{ padding: '0.85rem', backgroundColor: 'var(--status-overdue-bg)', color: 'var(--status-overdue)', borderRadius: 6, marginBottom: '1rem', fontWeight: 600 }}>
            {genError}
          </div>
        )}

        <form onSubmit={handleGenerateSettlement}>
          <div className="form-group">
            <label className="form-label">Select Farmer *</label>
            <select
              className="form-input"
              value={targetFarmerId}
              onChange={(e) => setTargetFarmerId(e.target.value)}
              required
            >
              {farmers.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.full_name} ({f.farmer_uid}) — Pending: ₹{f.pending_payout.toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Period Start Date *</label>
              <input
                type="date"
                className="form-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Period End Date *</label>
              <input
                type="date"
                className="form-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Intended Payment Mode</label>
            <select
              className="form-input"
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
            >
              <option value="Direct Deposit">Direct Deposit (Bank Account)</option>
              <option value="NEFT / RTGS">NEFT / RTGS</option>
              <option value="Cash Settlement">Cash Settlement</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', minHeight: 48 }}>
            Compute & Approve Settlement
          </button>
        </form>
      </Modal>

      {/* Mark Completed Modal */}
      {markingSettlement && (
        <Modal
          isOpen={!!markingSettlement}
          onClose={() => setMarkingSettlement(null)}
          title={`Confirm Disbursement for Settlement #${markingSettlement.id}`}
        >
          <div style={{ padding: '0.85rem', backgroundColor: 'var(--primary-light)', borderRadius: 6, marginBottom: '1rem', fontSize: '0.9rem' }}>
            Payable Amount: <strong style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>₹{markingSettlement.approved_amount.toFixed(2)}</strong> to <strong>{markingSettlement.farmer_name}</strong>
          </div>

          <form onSubmit={handleCompletePayment}>
            <div className="form-group">
              <label className="form-label">Disbursement Date *</label>
              <input
                type="date"
                className="form-input"
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Bank Transaction / Reference Number *</label>
              <input
                type="text"
                className="form-input"
                value={refNumber}
                onChange={(e) => setRefNumber(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', minHeight: 48 }}>
              Confirm Payment & Sync All Milk Records
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
