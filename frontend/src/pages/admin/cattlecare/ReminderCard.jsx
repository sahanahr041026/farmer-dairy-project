import React from 'react';
import { SMSIcon } from '../../../components/Icons';
import { getReminderColors } from './reminderStyles';

export function ReminderCard({ r, openCompletionModal, handleSendReminderSMS, handleCancelReminder }) {
  const isOverdue = r.status === 'overdue';
  const isDueSoon = r.status === 'due_soon';
  const isCompleted = r.status === 'completed';
  const isCancelled = r.status === 'cancelled';

  const { borderAccent, badgeBg, badgeColor } = getReminderColors(r.status);

  return (
    <div
      style={{
        padding: '0.9rem',
        backgroundColor: 'var(--bg-page)',
        borderRadius: 8,
        borderLeft: `5px solid ${borderAccent}`,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '0.15rem 0.5rem',
              borderRadius: 4,
              backgroundColor: badgeBg,
              color: badgeColor,
              textTransform: 'uppercase'
            }}>
              {r.status.replace('_', ' ')}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
              {r.care_type}
            </span>
          </div>
          <h4 style={{ fontWeight: 700, fontSize: '0.98rem', margin: '0.2rem 0' }}>{r.title}</h4>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Farmer: <strong>{r.farmer_name || `Farmer #${r.farmer_id}`}</strong>
            {r.cattle_name ? ` • Animal: ${r.cattle_name} (${r.cattle_tag})` : ' • Herd-wide'}
          </div>
          <div style={{ fontSize: '0.82rem', marginTop: '0.2rem' }}>
            Due: <strong style={{ color: isOverdue ? '#dc2626' : (isDueSoon ? '#d97706' : 'var(--text-main)') }}>{r.due_date}</strong>
          </div>
        </div>
      </div>

      {isCompleted && (
        <div style={{ fontSize: '0.78rem', color: '#065f46', backgroundColor: '#d1fae5', padding: '0.3rem 0.5rem', borderRadius: 4 }}>
          ✓ Administered by: <strong>{r.administered_by || 'Veterinary Officer'}</strong>
          {r.next_due_date && <span> • Next booster: <strong>{r.next_due_date}</strong></span>}
        </div>
      )}

      {r.guidance && (
        <div style={{ fontSize: '0.78rem', color: '#92400e', backgroundColor: '#fef3c7', padding: '0.3rem 0.5rem', borderRadius: 4 }}>
          Guidance: {r.guidance}
        </div>
      )}

      {r.veterinarian_notes && (
        <div style={{ fontSize: '0.78rem', color: 'var(--primary)', fontStyle: 'italic' }}>
          Notes: {r.veterinarian_notes}
        </div>
      )}

      {/* Actions Bar */}
      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.25rem', paddingTop: '0.4rem', borderTop: '1px solid rgba(0,0,0,0.06)', flexWrap: 'wrap' }}>
        {!isCompleted && !isCancelled && (
          <>
            <button
              onClick={() => openCompletionModal(r)}
              className="btn btn-primary"
              style={{ minHeight: 30, padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
            >
              Record Administration
            </button>

            <button
              onClick={() => handleSendReminderSMS(r)}
              className="btn btn-outline"
              style={{ minHeight: 30, padding: '0.2rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              title="Queue SMS notification to farmer"
            >
              <SMSIcon size={12} />
              <span>Send SMS</span>
            </button>

            <button
              onClick={() => handleCancelReminder(r.id)}
              className="btn btn-outline"
              style={{ minHeight: 30, padding: '0.2rem 0.5rem', fontSize: '0.75rem', color: '#dc2626' }}
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}
