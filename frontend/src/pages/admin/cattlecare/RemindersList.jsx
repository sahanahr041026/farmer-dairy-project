import React from 'react';
import { ReminderCard } from './ReminderCard';

export function RemindersList({
  reminders, filteredReminders, statusFilter, setStatusFilter,
  openCompletionModal, handleSendReminderSMS, handleCancelReminder
}) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)' }}>
          Care Schedules ({filteredReminders.length})
        </h3>

        <select
          className="form-input"
          style={{ minHeight: 32, padding: '0.2rem 0.5rem', fontSize: '0.82rem', width: 'auto' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses ({reminders.length})</option>
          <option value="due_soon">Due Soon (&lt; 3 Days)</option>
          <option value="overdue">Overdue</option>
          <option value="upcoming">Upcoming</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: 520, overflowY: 'auto' }}>
        {filteredReminders.map((r) => (
          <ReminderCard
            key={r.id}
            r={r}
            openCompletionModal={openCompletionModal}
            handleSendReminderSMS={handleSendReminderSMS}
            handleCancelReminder={handleCancelReminder}
          />
        ))}

        {filteredReminders.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            No care schedules match the selected filter.
          </div>
        )}
      </div>
    </div>
  );
}
