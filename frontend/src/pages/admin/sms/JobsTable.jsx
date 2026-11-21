import React from 'react';
import { RefreshCwIcon } from '../../../components/Icons';

export function JobsTable({ filteredJobs, jobFilter, setJobFilter, loadData, handleRetryJob, handleCancelJob }) {
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--primary)' }}>
          Per-Recipient Cellular Dispatch Log
        </h3>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select
            className="form-input"
            style={{ minHeight: 34, padding: '0.2rem 0.6rem', fontSize: '0.82rem' }}
            value={jobFilter}
            onChange={(e) => setJobFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="sent">Sent / Delivered</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <button
            onClick={loadData}
            className="btn btn-outline"
            style={{ minHeight: 34, padding: '0.2rem 0.6rem', fontSize: '0.82rem' }}
            title="Refresh status"
          >
            <RefreshCwIcon size={14} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
              <th style={{ padding: '0.6rem' }}>Timestamp</th>
              <th style={{ padding: '0.6rem' }}>Farmer</th>
              <th style={{ padding: '0.6rem' }}>Masked Phone</th>
              <th style={{ padding: '0.6rem' }}>Type</th>
              <th style={{ padding: '0.6rem' }}>Status</th>
              <th style={{ padding: '0.6rem' }}>Attempts</th>
              <th style={{ padding: '0.6rem' }}>Error / Gateway Info</th>
              <th style={{ padding: '0.6rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredJobs.map((job) => (
              <tr key={job.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '0.6rem', whiteSpace: 'nowrap' }}>
                  {new Date(job.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                </td>
                <td style={{ padding: '0.6rem', fontWeight: 600 }}>
                  {job.farmer_name || `Farmer #${job.farmer_id}`}
                </td>
                <td style={{ padding: '0.6rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                  {job.phone_masked}
                </td>
                <td style={{ padding: '0.6rem', textTransform: 'capitalize' }}>
                  {job.job_type.replace('_', ' ')}
                </td>
                <td style={{ padding: '0.6rem' }}>
                  <span className={`badge badge-${job.status === 'sent' || job.status === 'delivered' ? 'settled' : (job.status === 'failed' ? 'overdue' : 'pending')}`} style={{ fontSize: '0.72rem' }}>
                    {job.status}
                  </span>
                </td>
                <td style={{ padding: '0.6rem', textAlign: 'center' }}>
                  {job.retry_count}
                </td>
                <td style={{ padding: '0.6rem', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: job.status === 'failed' ? '#dc2626' : 'var(--text-muted)' }} title={job.error_message || 'Simulated provider execution'}>
                  {job.error_message || (job.status === 'sent' ? 'Delivered via simulated gateway' : '-')}
                </td>
                <td style={{ padding: '0.6rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {job.status === 'failed' && (
                    <button
                      onClick={() => handleRetryJob(job.id)}
                      className="btn btn-secondary"
                      style={{ minHeight: 28, padding: '0.15rem 0.5rem', fontSize: '0.75rem' }}
                    >
                      Retry
                    </button>
                  )}
                  {job.status === 'pending' && (
                    <button
                      onClick={() => handleCancelJob(job.id)}
                      className="btn btn-outline"
                      style={{ minHeight: 28, padding: '0.15rem 0.5rem', fontSize: '0.75rem', color: '#dc2626' }}
                    >
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filteredJobs.length === 0 && (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No SMS notification jobs found matching filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
