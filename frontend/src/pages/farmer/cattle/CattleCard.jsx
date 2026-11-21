import React from 'react';
import { t } from '../../../i18n';
import { CattleIcon, EditIcon } from '../../../components/Icons';

export function CattleCard({ cow, language, onEdit }) {
  return (
    <div className="card" style={{ padding: '1.1rem', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div style={{
            width: 50,
            height: 50,
            borderRadius: 12,
            backgroundColor: 'var(--secondary-light)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <CattleIcon size={28} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              {cow.name}
            </h3>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Tag: <span style={{ color: 'var(--primary)' }}>{cow.tag_number}</span> | {cow.breed}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className={`badge ${cow.milking_status === 'Milking' ? 'badge-settled' : 'badge-pending'}`} style={{ fontSize: '0.75rem' }}>
            {cow.milking_status}
          </span>
          <button
            onClick={() => onEdit(cow)}
            className="btn btn-outline touch-target"
            style={{ minHeight: 36, padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
            title="Edit profile"
          >
            <EditIcon size={14} />
            <span>{language === 'kn' ? 'ತಿದ್ದುಪಡಿ' : 'Edit'}</span>
          </button>
        </div>
      </div>

      {/* Attributes Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))',
        gap: '0.5rem',
        marginTop: '0.85rem',
        paddingTop: '0.75rem',
        borderTop: '1px solid var(--border)',
        fontSize: '0.82rem'
      }}>
        <div>
          <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>{t("age", language)}</span>
          <strong>{cow.age_years ? `${cow.age_years} ${t("years", language)}` : 'N/A'}</strong>
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>{t("daily_yield", language)}</span>
          <strong>{cow.daily_yield_estimate ? `${cow.daily_yield_estimate} L/day` : '0 L'}</strong>
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>{t("gender", language)}</span>
          <strong>{cow.gender === 'Female' ? t("female", language) : t("male", language)}</strong>
        </div>
      </div>

      {cow.health_notes && (
        <div style={{ marginTop: '0.6rem', fontSize: '0.82rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-main)', padding: '0.4rem 0.6rem', borderRadius: 4 }}>
          💡 <strong>Note:</strong> {cow.health_notes}
        </div>
      )}

      {/* Cattle Reminders Mini List */}
      {cow.reminders && cow.reminders.length > 0 && (
        <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--border)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
            Active Reminders:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {cow.reminders.map((r) => (
              <span
                key={r.id}
                className={`badge badge-${r.status}`}
                style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
              >
                {language === 'kn' ? (r.title_kn || r.title) : r.title} (Due: {r.due_date})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
