import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { t } from '../../i18n';
import { DownloadIcon, MilkIcon, SunIcon, MoonIcon, AlertTriangleIcon, CheckCircleIcon, CalendarIcon } from '../../components/Icons';

export function FarmerPassbook() {
  const { user, language } = useAuth();
  const [passbook, setPassbook] = useState(null);
  const [filterType, setFilterType] = useState('month'); // today, week, month, custom
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  const fetchPassbookData = async (filter = filterType) => {
    setLoading(true);
    setError('');

    const today = new Date();
    let start = '';
    let end = today.toISOString().split('T')[0];

    if (filter === 'today') {
      start = end;
    } else if (filter === 'week') {
      const pastWeek = new Date();
      pastWeek.setDate(today.getDate() - 7);
      start = pastWeek.toISOString().split('T')[0];
    } else if (filter === 'month') {
      const pastMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      start = pastMonth.toISOString().split('T')[0];
    } else if (filter === 'custom') {
      start = customStart || end;
      end = customEnd || end;
    }

    try {
      const data = await api.getPassbook({
        start_date: start,
        end_date: end
      });
      setPassbook(data);
    } catch (err) {
      setError(err.message || "Failed to load passbook records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPassbookData(filterType);
  }, [filterType]);

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const today = new Date();
      let start = '';
      let end = today.toISOString().split('T')[0];

      if (filterType === 'today') start = end;
      else if (filterType === 'week') {
        const d = new Date(); d.setDate(today.getDate() - 7);
        start = d.toISOString().split('T')[0];
      } else if (filterType === 'month') {
        start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      } else {
        start = customStart || end;
        end = customEnd || end;
      }

      await api.downloadPassbookPdf({ start_date: start, end_date: end });
    } catch (err) {
      alert("Error generating PDF: " + err.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="container-narrow" style={{ padding: '1rem', animation: 'fadeIn 0.2s ease' }}>
      {/* Title & Download Header */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        marginBottom: '1.25rem'
      }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
            {t("passbook_title", language)}
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {user?.name} ({user?.farmer_uid}) — {user?.cooperative?.name}
          </p>
        </div>

        {/* Prominent Download Button */}
        <button
          onClick={handleDownloadPdf}
          disabled={downloading}
          className="btn btn-primary touch-target"
          style={{
            width: '100%',
            backgroundColor: 'var(--primary)',
            boxShadow: 'var(--shadow-md)',
            fontSize: '1rem',
            padding: '0.85rem'
          }}
        >
          <DownloadIcon size={20} />
          <span>{downloading ? "Generating Official PDF..." : t("download_pdf", language)}</span>
        </button>
      </div>

      {/* Period Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.4rem',
        overflowX: 'auto',
        paddingBottom: '0.5rem',
        marginBottom: '1rem'
      }}>
        {[
          { key: 'today', label: t("filter_today", language) },
          { key: 'week', label: t("filter_7days", language) },
          { key: 'month', label: t("filter_month", language) },
          { key: 'custom', label: t("filter_custom", language) }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterType(tab.key)}
            className="touch-target"
            style={{
              padding: '0.4rem 0.9rem',
              borderRadius: 'var(--radius-full)',
              border: '1.5px solid',
              borderColor: filterType === tab.key ? 'var(--primary)' : 'var(--border)',
              backgroundColor: filterType === tab.key ? 'var(--primary)' : 'var(--bg-card)',
              color: filterType === tab.key ? '#FFFFFF' : 'var(--text-main)',
              fontWeight: 600,
              fontSize: '0.85rem',
              minHeight: 40,
              whiteSpace: 'nowrap'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Custom Date Range Picker */}
      {filterType === 'custom' && (
        <div className="card" style={{ marginBottom: '1rem', padding: '0.85rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Start Date</label>
              <input
                type="date"
                className="form-input"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                style={{ minHeight: 40, padding: '0.4rem' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>End Date</label>
              <input
                type="date"
                className="form-input"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                style={{ minHeight: 40, padding: '0.4rem' }}
              />
            </div>
          </div>
          <button
            onClick={() => fetchPassbookData('custom')}
            className="btn btn-secondary"
            style={{ width: '100%', minHeight: 40, padding: '0.4rem' }}
          >
            Apply Date Range
          </button>
        </div>
      )}

      {/* Financial Summary Cards */}
      {passbook && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div className="card" style={{ padding: '0.85rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t("total_milk", language)}</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)' }}>
              {passbook.total_litres} <span style={{ fontSize: '0.8rem' }}>L</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Avg Fat: {passbook.avg_fat}% | SNF: {passbook.avg_snf}%
            </div>
          </div>

          <div className="card" style={{ padding: '0.85rem', backgroundColor: 'var(--primary-light)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>{t("gross_earnings", language)}</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)' }}>
              ₹{passbook.total_earnings.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--status-pending)' }}>
              Pending: ₹{passbook.pending_amount.toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Milk Records List */}
      <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.75rem' }}>
        {language === 'kn' ? 'ದೈನಂದಿನ ಹಾಲಿನ ದಾಖಲೆಗಳು' : 'Daily Collection Records'}
      </h2>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
          Loading latest passbook records...
        </div>
      ) : passbook && passbook.records && passbook.records.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {passbook.records.map((rec) => {
            const hasAudit = rec.audits && rec.audits.length > 0;
            const isSettled = rec.payment_status === 'settled';

            return (
              <div
                key={rec.id}
                className="card"
                style={{
                  padding: '1rem',
                  borderLeft: `5px solid ${isSettled ? 'var(--status-settled)' : 'var(--status-pending)'}`,
                  position: 'relative'
                }}
              >
                {/* Top: Date & Session */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {rec.session === 'morning' ? (
                      <span style={{ color: 'var(--status-pending)' }}><SunIcon size={18} /></span>
                    ) : (
                      <span style={{ color: 'var(--primary)' }}><MoonIcon size={18} /></span>
                    )}
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                      {rec.collection_date} ({rec.session === 'morning' ? t("morning", language) : t("evening", language)})
                    </span>
                  </div>
                  <span className={`badge badge-${rec.payment_status}`}>
                    {rec.payment_status === 'settled' ? t("settled", language) : (rec.payment_status === 'approved' ? t("approved", language) : t("pending", language))}
                  </span>
                </div>

                {/* Grid: Quantity, Quality, Rate, Total */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '0.4rem',
                  padding: '0.6rem 0',
                  borderTop: '1px solid var(--border)',
                  borderBottom: '1px solid var(--border)',
                  fontSize: '0.85rem'
                }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Quantity</span>
                    <strong style={{ fontSize: '1rem', color: 'var(--primary)' }}>{rec.quantity_litres} L</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Fat / SNF</span>
                    <span>{rec.fat_percentage ? `${rec.fat_percentage}%` : '-'} / {rec.snf_percentage ? `${rec.snf_percentage}%` : '-'}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Rate</span>
                    <span>₹{rec.rate_per_litre.toFixed(2)}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Amount</span>
                    <strong style={{ color: 'var(--primary)', fontSize: '1rem' }}>₹{rec.total_amount.toFixed(2)}</strong>
                  </div>
                </div>

                {/* Audit Correction Banner */}
                {hasAudit && (
                  <div style={{
                    marginTop: '0.5rem',
                    padding: '0.4rem 0.6rem',
                    backgroundColor: 'var(--status-pending-bg)',
                    borderRadius: 4,
                    fontSize: '0.78rem',
                    color: 'var(--status-pending)'
                  }}>
                    <strong>{t("corrected", language)}:</strong> {rec.audits[rec.audits.length - 1].reason}
                    <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Adjusted from {rec.audits[rec.audits.length - 1].previous_quantity}L (₹{rec.audits[rec.audits.length - 1].previous_amount}) to {rec.quantity_litres}L
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
          <MilkIcon size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            {t("no_records", language)}
          </p>
        </div>
      )}
    </div>
  );
}
