import React from 'react';
import { t } from '../../../i18n';
import { CattleIcon, PlusIcon } from '../../../components/Icons';
import { CattleCard } from './CattleCard';

export function CattleListTab({ loading, cattleList, language, onAdd, onEdit }) {
  return (
    <div>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
          Loading registered cattle...
        </div>
      ) : cattleList.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
          <CattleIcon size={44} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.4rem' }}>
            {language === 'kn' ? 'ಯಾವುದೇ ಹಸು ನೋಂದಣಿಯಾಗಿಲ್ಲ' : 'No cattle registered yet'}
          </h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            {language === 'kn' ? 'ನಿಮ್ಮ ಮೊದಲ ಹಸು ಅಥವಾ ಎಮ್ಮೆಯನ್ನು ನೋಂದಾಯಿಸಿ.' : 'Register your cows and buffaloes to track milk yield and health schedules.'}
          </p>
          <button
            onClick={onAdd}
            className="btn btn-primary touch-target"
            style={{ margin: '0 auto' }}
          >
            <PlusIcon size={18} />
            <span>{t("add_cattle", language)}</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {cattleList.map((cow) => (
            <CattleCard key={cow.id} cow={cow} language={language} onEdit={onEdit} />
          ))}
        </div>
      )}
    </div>
  );
}
