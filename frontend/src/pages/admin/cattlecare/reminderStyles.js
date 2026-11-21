// Pure helper: maps a reminder status to its card accent / badge colours.
export function getReminderColors(status) {
  const isOverdue = status === 'overdue';
  const isDueSoon = status === 'due_soon';
  const isCompleted = status === 'completed';
  const isCancelled = status === 'cancelled';

  let borderAccent = 'var(--status-pending)';
  let badgeBg = '#eff6ff';
  let badgeColor = '#1d4ed8';

  if (isOverdue) {
    borderAccent = '#dc2626';
    badgeBg = '#fee2e2';
    badgeColor = '#b91c1c';
  } else if (isDueSoon) {
    borderAccent = '#d97706';
    badgeBg = '#fef3c7';
    badgeColor = '#b45309';
  } else if (isCompleted) {
    borderAccent = '#10b981';
    badgeBg = '#d1fae5';
    badgeColor = '#065f46';
  } else if (isCancelled) {
    borderAccent = '#6b7280';
    badgeBg = '#f3f4f6';
    badgeColor = '#374151';
  }

  return { borderAccent, badgeBg, badgeColor };
}
