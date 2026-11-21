import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import {
  UsersIcon, MilkIcon, ShieldCheckIcon, CalendarIcon,
  _SunIcon, _MoonIcon, ArrowRightIcon, PlusIcon
} from '../../components/Icons';
import { CollectionTrendChart, QualityBarChart } from '../../components/Charts';

export function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [quality, setQuality] = useState(null);
  const [recentCollections, setRecentCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [sumRes, trendRes, qualRes, recRes] = await Promise.all([
          api.getDashboardSummary(),
          api.getTrends(14),
          api.getQuality(),
          api.getCollections({ limit: 6 })
        ]);
        setSummary(sumRes);
        setTrends(trendRes);
        setQuality(qualRes);
        setRecentCollections(recRes);
      } catch (e) {
        console.error("Error loading admin dashboard:", e);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading cooperative dashboard...</div>;
  }

  return (
    <div style={{ animation: 'fadeIn 0.2s ease' }}>
      {/* Page Title & Quick Record Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)' }}>
            Cooperative Operations Dashboard
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Real-time milk intake, financial settlement, and herd health status
          </p>
        </div>
        <Link to="/admin/milk" className="btn btn-primary touch-target">
          <PlusIcon size={18} />
          <span>Record Milk Collection</span>
        </Link>
      </div>

      {/* Summary KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        {/* Total Farmers */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <UsersIcon size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>REGISTERED FARMERS</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {summary?.total_farmers || 0}
            </div>
          </div>
        </div>

        {/* Today's Collection */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            backgroundColor: 'var(--accent-light)',
            color: 'var(--status-pending)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <MilkIcon size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>TODAY'S COLLECTION</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)' }}>
              {summary?.today_collection?.total_litres || 0} <span style={{ fontSize: '0.9rem' }}>L</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              M: {summary?.today_collection?.morning_litres}L | E: {summary?.today_collection?.evening_litres}L
            </div>
          </div>
        </div>

        {/* Monthly Collection */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            backgroundColor: 'var(--secondary-light)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <MilkIcon size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>MONTHLY COLLECTION</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {summary?.monthly_collection?.total_litres || 0} <span style={{ fontSize: '0.9rem' }}>L</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
              Value: ₹{summary?.monthly_collection?.total_amount?.toLocaleString() || 0}
            </div>
          </div>
        </div>

        {/* Pending Payout */}
        <div className="card" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          borderLeft: '4px solid var(--status-pending)'
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            backgroundColor: 'var(--status-pending-bg)',
            color: 'var(--status-pending)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldCheckIcon size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--status-pending)', fontWeight: 700 }}>PENDING PAYOUTS</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--status-pending)' }}>
              ₹{summary?.financials?.pending_amount?.toLocaleString() || 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Settled: ₹{summary?.financials?.completed_settlements?.toLocaleString() || 0}
            </div>
          </div>
        </div>

        {/* Upcoming Vaccinations */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <CalendarIcon size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>VACCINATION CAMPS</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)' }}>
              {summary?.upcoming_vaccinations || 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Next 14 days</div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '1.5rem',
        marginBottom: '1.5rem'
      }}>
        {/* Collection Trends Chart */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>
              14-Day Milk Intake Trends (Litres)
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Daily Totals</span>
          </div>
          <CollectionTrendChart data={trends} />
        </div>

        {/* Milk Quality Fat Breakdown */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>
              Milk Fat Quality Distribution
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Last 30 Days</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            Quality segmentation based on tested fat content to determine rate slabs.
          </p>
          <QualityBarChart data={quality?.fat_distribution || []} />
        </div>
      </div>

      {/* Recent Milk Collections Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>
            Recent Milk Collections Log
          </h3>
          <Link to="/admin/milk" style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <span>View All Collections</span>
            <ArrowRightIcon size={16} />
          </Link>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.65rem' }}>Date & Session</th>
                <th style={{ padding: '0.65rem' }}>Farmer</th>
                <th style={{ padding: '0.65rem' }}>Qty (L)</th>
                <th style={{ padding: '0.65rem' }}>Fat %</th>
                <th style={{ padding: '0.65rem' }}>SNF %</th>
                <th style={{ padding: '0.65rem' }}>Rate (₹)</th>
                <th style={{ padding: '0.65rem' }}>Amount (₹)</th>
                <th style={{ padding: '0.65rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentCollections.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.65rem' }}>
                    <strong>{r.collection_date}</strong> ({r.session})
                  </td>
                  <td style={{ padding: '0.65rem' }}>
                    {r.farmer_name} <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>({r.farmer_uid})</span>
                  </td>
                  <td style={{ padding: '0.65rem', fontWeight: 700, color: 'var(--primary)' }}>
                    {r.quantity_litres} L
                  </td>
                  <td style={{ padding: '0.65rem' }}>{r.fat_percentage ? `${r.fat_percentage}%` : '-'}</td>
                  <td style={{ padding: '0.65rem' }}>{r.snf_percentage ? `${r.snf_percentage}%` : '-'}</td>
                  <td style={{ padding: '0.65rem' }}>₹{r.rate_per_litre.toFixed(2)}</td>
                  <td style={{ padding: '0.65rem', fontWeight: 700 }}>₹{r.total_amount.toFixed(2)}</td>
                  <td style={{ padding: '0.65rem' }}>
                    <span className={`badge badge-${r.payment_status}`}>
                      {r.payment_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
