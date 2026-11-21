import React from 'react';

export function CollectionsTable({
  collections, filteredCollections, historySummary, handleOpenCorrection,
  historySearch, setHistorySearch,
  filterStartDate, setFilterStartDate, filterEndDate, setFilterEndDate,
  filterSession, setFilterSession, filterStatus, setFilterStatus
}) {
  return (
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
            {collections.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No milk collections recorded yet. Use the form above to record collection.
                </td>
              </tr>
            ) : (
              collections.map((c) => {
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
            }))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
