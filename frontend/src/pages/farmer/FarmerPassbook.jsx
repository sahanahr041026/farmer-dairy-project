import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { t } from '../../i18n';
import {
  DownloadIcon, MilkIcon, SunIcon, MoonIcon,
  AlertTriangleIcon, CheckCircleIcon, CalendarIcon, RefreshCwIcon
} from '../../components/Icons';

export function FarmerPassbook() {
  const { user, language } = useAuth();
  const [passbook, setPassbook] = useState(null);
  const [filterType, setFilterType] = useState('this_month'); // this_month, prev_month, week, custom
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState('idle'); // idle, downloading, success, error
  const [downloadErrorMsg, setDownloadErrorMsg] = useState('');
  const [error, setError] = useState('');
  const [lastSynced, setLastSynced] = useState(() => new Date());

  const getFilterDates = (filter) => {
    const today = new Date();
    let start = '';
    let end = today.toISOString().split('T')[0];

    if (filter === 'this_month') {
      const pastMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      start = pastMonth.toISOString().split('T')[0];
    } else if (filter === 'prev_month') {
      const prevMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const prevMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
      start = prevMonthStart.toISOString().split('T')[0];
      end = prevMonthEnd.toISOString().split('T')[0];
    } else if (filter === 'week') {
      const pastWeek = new Date();
      pastWeek.setDate(today.getDate() - 7);
      start = pastWeek.toISOString().split('T')[0];
    } else if (filter === 'custom') {
      start = customStart || end;
      end = customEnd || end;
    }
    return { start, end };
  };

  const fetchPassbookData = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setRefreshing(true);
    setError('');

    const { start, end } = getFilterDates(filterType);

    try {
      const data = await api.getPassbook({
        start_date: start,
        end_date: end
      });
      setPassbook(data);
      setLastSynced(new Date());
    } catch (err) {
      if (!isBackground) {
        setError(err.message || "Failed to load passbook records from cooperative server.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterType, customStart, customEnd]);

  // Initial fetch on mount & filter change
  useEffect(() => {
    fetchPassbookData(false);
  }, [filterType]);

  // Live Automatic Synchronization: Polling every 20 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      fetchPassbookData(true);
    }, 20000);

    // Refresh when user returns to tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchPassbookData(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchPassbookData]);

  const handleDownloadPdf = async () => {
    setDownloading(true);
    setDownloadStatus('downloading');
    setDownloadErrorMsg('');
    try {
      const { start, end } = getFilterDates(filterType);
      await api.downloadPassbookPdf({ start_date: start, end_date: end });
      setDownloadStatus('success');
      setTimeout(() => setDownloadStatus('idle'), 6000);
    } catch (err) {
      setDownloadStatus('error');
      setDownloadErrorMsg(err.message || "Failed to generate passbook PDF. Please check connection and retry.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="container-narrow" style={{ padding: '1rem', animation: 'fadeIn 0.2s ease' }}>
      {/* Title & Farmer Identity Header */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        marginBottom: '1.25rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
              {t("passbook_title", language)}
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {user?.name} ({user?.farmer_uid}) — {user?.cooperative?.name || passbook?.cooperative_name}
            </p>
          </div>

          {/* Sync & Refresh Button */}
          <button
            onClick={() => fetchPassbookData(false)}
            disabled={refreshing || loading}
            className="touch-target"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.4rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--bg-card)',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--text-main)',
              cursor: 'pointer'
            }}
          >
            <RefreshCwIcon size={14} className={refreshing ? 'spin' : ''} />
            <span>{refreshing ? "Syncing..." : t("refresh", language)}</span>
          </button>
        </div>

        {/* Live Sync Status indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }} />
          <span>{t("sync_live", language)} • Last checked {lastSynced.toLocaleTimeString()}</span>
        </div>

        {/* PDF Download Feedback / Status Notifications */}
        {downloadStatus === 'success' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            backgroundColor: '#ECFDF5',
            color: '#065F46',
            borderRadius: 'var(--radius-md)',
            border: '1px solid #A7F3D0',
            fontSize: '0.85rem',
            fontWeight: 600
          }}>
            <CheckCircleIcon size={18} color="#059669" />
            <span>{t("download_success", language)}</span>
          </div>
        )}

        {downloadStatus === 'error' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            backgroundColor: '#FEF2F2',
            color: '#991B1B',
            borderRadius: 'var(--radius-md)',
            border: '1px solid #FECACA',
            fontSize: '0.85rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangleIcon size={18} color="#DC2626" />
              <span>{downloadErrorMsg || t("download_error", language)}</span>
            </div>
            <button
              onClick={handleDownloadPdf}
              className="touch-target"
              style={{
                padding: '0.35rem 0.75rem',
                backgroundColor: '#DC2626',
                color: '#FFFFFF',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Prominent PDF Download Button (Accessible >= 48px touch target) */}
        <button
          onClick={handleDownloadPdf}
          disabled={downloading || !passbook?.records?.length}
          className="btn btn-primary touch-target"
          style={{
            width: '100%',
            backgroundColor: 'var(--primary)',
            boxShadow: 'var(--shadow-md)',
            fontSize: '1.05rem',
            fontWeight: 700,
            padding: '0.9rem',
            minHeight: 52,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.6rem',
            opacity: (!passbook?.records?.length) ? 0.6 : 1
          }}
        >
          <DownloadIcon size={22} />
          <span>{downloading ? t("generating_pdf", language) : t("download_my_epassbook", language)}</span>
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
          { key: 'this_month', label: t("preset_this_month", language) },
          { key: 'prev_month', label: t("preset_prev_month", language) },
          { key: 'week', label: t("filter_7days", language) },
          { key: 'custom', label: t("preset_custom", language) }
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
              minHeight: 44,
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
                style={{ minHeight: 44, padding: '0.4rem' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>End Date</label>
              <input
                type="date"
                className="form-input"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                style={{ minHeight: 44, padding: '0.4rem' }}
              />
            </div>
          </div>
          <button
            onClick={() => fetchPassbookData(false)}
            className="btn btn-secondary"
            style={{ width: '100%', minHeight: 44, padding: '0.4rem', fontWeight: 700 }}
          >
            Apply Date Range
          </button>
        </div>
      )}

      {/* Financial & Volume Summary Cards */}
      {passbook && (
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '0.5rem' }}>
            {/* Total Milk */}
            <div className="card" style={{ padding: '0.85rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t("total_milk", language)}</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)' }}>
                {passbook.total_litres} <span style={{ fontSize: '0.8rem' }}>L</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Avg Fat: {passbook.avg_fat}% | SNF: {passbook.avg_snf}%
              </div>
            </div>

            {/* Calculated Earnings */}
            <div className="card" style={{ padding: '0.85rem', backgroundColor: 'var(--primary-light)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>{t("gross_earnings", language)}</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)' }}>
                ₹{passbook.total_earnings.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Calculated provisional value
              </div>
            </div>

            {/* Paid Amount */}
            <div className="card" style={{ padding: '0.85rem', backgroundColor: 'var(--status-settled-bg)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--status-settled)' }}>{t("total_paid", language)}</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--status-settled)' }}>
                ₹{passbook.paid_amount.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--status-settled)' }}>
                Confirmed bank settlements
              </div>
            </div>

            {/* Pending Balance */}
            <div className="card" style={{ padding: '0.85rem', backgroundColor: 'var(--status-pending-bg)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--status-pending)' }}>{t("balance_due", language)}</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--status-pending)' }}>
                ₹{passbook.pending_amount.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--status-pending)' }}>
                Pending payment disbursement
              </div>
            </div>
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0.2rem 0.4rem' }}>
            * Note: Calculated earnings represent provisional milk value based on fat & SNF testing. Payments are marked Settled only upon banking credit confirmation.
          </div>

          {/* Explicit Notice about Milk Value vs Payment Disbursement */}
          <div style={{
            padding: '0.65rem 0.85rem',
            backgroundColor: '#FEF3C7',
            border: '1px solid #FDE68A',
            borderRadius: 6,
            fontSize: '0.76rem',
            color: '#92400E',
            marginBottom: '1.25rem',
            lineHeight: 1.4
          }}>
            <strong>{language === 'kn' ? 'ಗಮನಿಸಿ:' : 'Notice:'}</strong> {t("not_received_notice", language)}
          </div>
        </>
      )}

      {/* Milk Records List */}
      <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.75rem' }}>
        {language === 'kn' ? 'ದೈನಂದಿನ ಹಾಲಿನ ಸಂಗ್ರಹ ವಿವರಗಳು' : 'Daily Collection Records'}
      </h2>

      {/* Error & Retry State */}
      {error && (
        <div className="card" style={{ padding: '1rem', marginBottom: '1rem', backgroundColor: 'var(--status-overdue-bg)', color: 'var(--status-overdue)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <AlertTriangleIcon size={20} />
            <strong style={{ fontSize: '0.9rem' }}>{error}</strong>
          </div>
          <button onClick={() => fetchPassbookData(false)} className="btn btn-outline" style={{ fontSize: '0.82rem', padding: '0.35rem 0.8rem' }}>
            {t("retry", language)}
          </button>
        </div>
      )}

      {/* Loading Indicator */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
          <RefreshCwIcon size={24} className="spin" style={{ margin: '0 auto 0.75rem' }} />
          <p style={{ fontSize: '0.9rem' }}>Loading latest verified milk records from society...</p>
        </div>
      ) : passbook && passbook.records && passbook.records.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {passbook.records.map((rec) => {
            const hasAudit = rec.audits && rec.audits.length > 0;
            const isSettled = rec.payment_status === 'settled';
            const isCorrected = rec.record_status === 'corrected' || hasAudit;

            return (
              <div
                key={rec.id}
                className="card"
                style={{
                  padding: '1rem',
                  borderLeft: `5px solid ${isSettled ? 'var(--status-settled)' : (isCorrected ? 'var(--status-pending)' : 'var(--primary)')}`,
                  position: 'relative'
                }}
              >
                {/* Top: Date & Session */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {rec.session === 'morning' ? (
                      <span style={{ color: 'var(--status-pending)' }}><SunIcon size={20} /></span>
                    ) : (
                      <span style={{ color: 'var(--primary)' }}><MoonIcon size={20} /></span>
                    )}
                    <span style={{ fontWeight: 800, fontSize: '1rem' }}>
                      {rec.collection_date} ({rec.session === 'morning' ? t("morning", language) : t("evening", language)})
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                    {isCorrected && (
                      <span className="badge badge-pending" style={{ fontSize: '0.7rem' }}>
                        {t("corrected", language)}
                      </span>
                    )}
                    <span className={`badge badge-${rec.payment_status}`}>
                      {rec.payment_status === 'settled'
                        ? t("settled", language)
                        : (rec.payment_status === 'approved' ? t("approved", language) : t("pending", language))}
                    </span>
                  </div>
                </div>

                {/* Grid: Quantity, Quality, Rate, Milk Value */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '0.4rem',
                  padding: '0.65rem 0',
                  borderTop: '1px solid var(--border)',
                  borderBottom: '1px solid var(--border)',
                  fontSize: '0.85rem'
                }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Quantity</span>
                    <strong style={{ fontSize: '1.05rem', color: 'var(--primary)' }}>{rec.quantity_litres} L</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Fat / SNF</span>
                    <span style={{ fontWeight: 600 }}>
                      {rec.fat_percentage ? `${rec.fat_percentage}%` : '-'} / {rec.snf_percentage ? `${rec.snf_percentage}%` : '-'}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Rate/L</span>
                    <span style={{ fontWeight: 600 }}>₹{rec.rate_per_litre.toFixed(2)}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Milk Value</span>
                    <strong style={{ color: 'var(--primary)', fontSize: '1.05rem' }}>₹{rec.total_amount.toFixed(2)}</strong>
                  </div>
                </div>

                {/* Audit Correction Banner */}
                {hasAudit && (
                  <div style={{
                    marginTop: '0.65rem',
                    padding: '0.5rem 0.75rem',
                    backgroundColor: 'var(--status-pending-bg)',
                    borderRadius: 6,
                    fontSize: '0.8rem',
                    color: 'var(--status-pending)',
                    lineHeight: 1.4
                  }}>
                    <strong>{t("audit_reason", language)}:</strong> {rec.audits[rec.audits.length - 1].reason}
                    <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      Adjusted from {rec.audits[rec.audits.length - 1].previous_quantity}L (₹{rec.audits[rec.audits.length - 1].previous_amount.toFixed(2)}) to {rec.quantity_litres}L (₹{rec.total_amount.toFixed(2)})
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <MilkIcon size={44} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            {t("no_records", language)}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: 360, margin: '0 auto', lineHeight: 1.5 }}>
            {language === 'kn'
              ? 'ನಿಮ್ಮ ಡೈರಿ ಸಹಕಾರ ಸಂಘದಲ್ಲಿ ಹಾಲು ದಾಖಲಿಸಿದ ತಕ್ಷಣ, ಅದು ಇಲ್ಲಿ ನೈಜ ಸಮಯದಲ್ಲಿ ಲಭ್ಯವಾಗುತ್ತದೆ.'
              : 'When your dairy cooperative records your morning or evening milk supply, it will automatically appear here in real-time.'}
          </p>
        </div>
      )}
    </div>
  );
}
