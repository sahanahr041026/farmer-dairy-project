import React from 'react';
import { t } from '../../../i18n';
import { PlusIcon } from '../../../components/Icons';

export function CattleHeader({ language, user, cattleCount, onAdd }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '0.75rem',
      marginBottom: '1rem'
    }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
          {t("cattle_title", language)}
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {cattleCount} {language === 'kn' ? 'ದಾಖಲಾದ ಜಾನುವಾರುಗಳು' : 'registered animals'} | {user?.cooperative?.name}
        </p>
      </div>

      <button
        onClick={onAdd}
        className="btn btn-primary touch-target"
        style={{ minHeight: 42, padding: '0.45rem 1rem', fontSize: '0.9rem' }}
      >
        <PlusIcon size={18} />
        <span>{t("add_cattle", language)}</span>
      </button>
    </div>
  );
}
