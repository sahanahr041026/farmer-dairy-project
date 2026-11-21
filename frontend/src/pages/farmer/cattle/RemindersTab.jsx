import React from 'react';
import { t } from '../../../i18n';
import { CalendarIcon, CheckCircleIcon, SpeakerIcon } from '../../../components/Icons';

function ReminderItem({ rem, language, onSpeak, onComplete }) {
  const isOverdue = rem.status === 'overdue';
  const isCompleted = rem.status === 'completed';

  return (
    <div
      className="card"
      style={{
        padding: '1rem',
        borderLeft: `5px solid ${isOverdue ? 'var(--status-overdue)' : (isCompleted ? 'var(--status-settled)' : 'var(--status-pending)')}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '0.75rem'
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
          <span className={`badge badge-${rem.status}`}>
            {rem.status === 'overdue' ? t("overdue", language) : (rem.status === 'completed' ? t("completed", language) : t("upcoming", language))}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize', fontWeight: 600 }}>
            {rem.care_type}
          </span>
        </div>
        <h4 style={{ fontSize: '1.02rem', fontWeight: 700, margin: '0.2rem 0', color: 'var(--text-main)' }}>
          {language === 'kn' ? (rem.title_kn || rem.title) : rem.title}
        </h4>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          {rem.cattle_name ? `Animal: ${rem.cattle_name} (${rem.cattle_tag}) | ` : ''} Due: <strong>{rem.due_date}</strong>
        </div>
        {rem.veterinarian_notes && (
          <div style={{ fontSize: '0.78rem', color: 'var(--primary)', marginTop: '0.3rem', backgroundColor: 'var(--primary-light)', padding: '0.3rem 0.5rem', borderRadius: 4 }}>
            Dr. Advisory: {rem.veterinarian_notes}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'center' }}>
        <button
          onClick={() => onSpeak(rem)}
          className="touch-target"
          style={{
            width: 42,
            height: 42,
            borderRadius: '50%',
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
          title="Listen to reminder read aloud"
          aria-label="Listen to reminder read aloud"
        >
          <SpeakerIcon size={20} />
        </button>

        {!isCompleted && (
          <button
            onClick={() => onComplete(rem.id)}
            className="btn btn-outline touch-target"
            style={{ minHeight: 32, padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
            title="Mark completed"
          >
            <CheckCircleIcon size={14} />
            <span>{language === 'kn' ? 'ಆಗಿದೆ' : 'Done'}</span>
          </button>
        )}
      </div>
    </div>
  );
}

export function RemindersTab({ reminders, language, onSpeak, onComplete }) {
  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>
          {t("reminders_title", language)}
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {language === 'kn' ? 'ಲಸಿಕೆ ಶಿಬಿರಗಳು, ಜಂತುಹುಳು ನಿವಾರಣೆ ಮತ್ತು ಪಶುವೈದ್ಯರ ತಪಾಸಣೆ ವೇಳಾಪಟ್ಟಿ' : 'Vaccination camps, deworming, and veterinary health schedule'}
        </p>
      </div>

      {reminders.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <CalendarIcon size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.5rem' }} />
          <p style={{ color: 'var(--text-muted)' }}>No health reminders currently scheduled.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {reminders.map((rem) => (
            <ReminderItem key={rem.id} rem={rem} language={language} onSpeak={onSpeak} onComplete={onComplete} />
          ))}
        </div>
      )}
    </div>
  );
}
