import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { DownloadIcon, TrendingUpIcon, CalendarIcon, CheckCircleIcon } from '../../components/Icons';

export function AdminReports() {
  const [summary, setSummary] = useState(null);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const sum = await api.getDashboardSummary();
        setSummary(sum);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleDownloadCollectionsCsv = () => {
    const url = api.exportCollectionsCsv(startDate, endDate);
    window.open(url, '_blank');
  };

  return (
    <div style={{ animation: 'fadeIn 0.2s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)' }}>
            Cooperative Reports & Data Exports
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Generate official audits, milk intake ledgers, and export CSVs for regulatory reporting
          </p>
        </div>

        <button
          onClick={handleDownloadCollectionsCsv}
          className="btn btn-primary touch-target"
        >
          <DownloadIcon size={18} />
          <span>Download Collections CSV</span>
        </button>
      </div>

      {/* Date Range Selector Card */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.85rem' }}>
          Report Date Range Selection
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
          <div>
            <label className="form-label">Period Start Date</label>
            <input
              type="date"
              className="form-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">Period End Date</label>
            <input
              type="date"
              className="form-input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div>
            <button
              onClick={handleDownloadCollectionsCsv}
              className="btn btn-secondary touch-target"
              style={{ width: '100%', minHeight: 48 }}
            >
              <DownloadIcon size={18} />
              <span>Export Custom Range CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Performance Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Monthly Milk Intake</h4>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>
            {summary?.monthly_collection?.total_litres || 0} L
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Daily Average: {summary?.monthly_collection?.avg_daily_litres} L/day
          </div>
        </div>

        <div className="card">
          <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Gross Milk Value (This Month)</h4>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>
            ₹{summary?.monthly_collection?.total_amount?.toLocaleString() || 0}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--status-settled)', fontWeight: 600, marginTop: '0.2rem' }}>
            Paid / Settled: ₹{summary?.financials?.completed_settlements?.toLocaleString() || 0}
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid var(--status-pending)' }}>
          <h4 style={{ fontSize: '0.9rem', color: 'var(--status-pending)', marginBottom: '0.4rem' }}>Outstanding Farmer Balance</h4>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--status-pending)' }}>
            ₹{summary?.financials?.pending_amount?.toLocaleString() || 0}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Awaiting bank batch approval
          </div>
        </div>
      </div>

      {/* Audit & Compliance Standards Notice */}
      <div className="card" style={{ backgroundColor: 'var(--primary-light)', border: '1px solid var(--secondary)' }}>
        <h4 style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '0.4rem' }}>
          Dairy Cooperative Compliance & Multi-Tenant Audit Security
        </h4>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
          All exported reports strictly filter records by your authorized cooperative ID (<strong>{summary?.cooperative_code || 'KMF-MLN-108'}</strong>). Data across other cooperatives remains completely isolated at the database level. Digital e-passbook PDF statements generated by farmers strictly match these verified figures.
        </p>
      </div>
    </div>
  );
}
