import React from 'react';
import { t } from '../../../i18n';

function tabStyle(active) {
  return {
    padding: '0.5rem 1rem',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    backgroundColor: active ? 'var(--primary)' : 'transparent',
    color: active ? '#FFFFFF' : 'var(--text-main)',
    fontWeight: 700,
    fontSize: '0.9rem',
    cursor: 'pointer',
    whiteSpace: 'nowrap'
  };
}

export function CattleTabs({ activeTab, setActiveTab, language, cattleCount, pendingReminderCount }) {
  return (
    <div style={{
      display: 'flex',
      gap: '0.5rem',
      borderBottom: '2px solid var(--border)',
      paddingBottom: '0.5rem',
      marginBottom: '1.25rem',
      overflowX: 'auto'
    }}>
      <button
        onClick={() => setActiveTab('cows')}
        className="touch-target"
        style={tabStyle(activeTab === 'cows')}
      >
        {t("tab_my_cows", language)} ({cattleCount})
      </button>

      <button
        onClick={() => setActiveTab('reminders')}
        className="touch-target"
        style={tabStyle(activeTab === 'reminders')}
      >
        {t("tab_reminders", language)} ({pendingReminderCount})
      </button>

      <button
        onClick={() => setActiveTab('breeds')}
        className="touch-target"
        style={tabStyle(activeTab === 'breeds')}
      >
        {t("tab_breed_guide", language)}
      </button>
    </div>
  );
}
