import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { t } from '../../i18n';
import { CattleIcon, CalendarIcon, CheckCircleIcon, AlertTriangleIcon, PlusIcon, SpeakerIcon } from '../../components/Icons';
import { Modal } from '../../components/Modal';

export function FarmerCattle() {
  const { user, language } = useAuth();
  const [cattleList, setCattleList] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [selectedCattle, setSelectedCattle] = useState(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestText, setRequestText] = useState('');
  const [requestSuccess, setRequestSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [cList, rList] = await Promise.all([
          api.getCattle(),
          api.getReminders()
        ]);
        setCattleList(cList);
        setReminders(rList);
      } catch (e) {
        console.error("Error loading cattle:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleSpeakReminder = (rem) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const text = language === 'kn'
      ? `${rem.title_kn || rem.title}. ದಿನಾಂಕ: ${rem.due_date}. ಸ್ಥಿತಿ: ${rem.status}.`
      : `${rem.title}. Due date: ${rem.due_date}. Status: ${rem.status}.`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'kn' ? 'kn-IN' : 'en-IN';
    window.speechSynthesis.speak(utterance);
  };

  const handleSubmitRequest = (e) => {
    e.preventDefault();
    if (!requestText.trim()) return;
    setRequestSuccess(
      language === 'kn'
        ? "ನಿಮ್ಮ ಕೋರಿಕೆಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಸಲ್ಲಿಸಲಾಗಿದೆ. ಕಾರ್ಯದರ್ಶಿ ಪರಿಶೀಲಿಸಿ ಅನುಮೋದಿಸುತ್ತಾರೆ."
        : "Your cattle update request has been submitted to the cooperative secretary for verification."
    );
    setRequestText('');
    setTimeout(() => {
      setIsRequestModalOpen(false);
      setRequestSuccess('');
    }, 2500);
  };

  return (
    <div className="container-narrow" style={{ padding: '1rem', animation: 'fadeIn 0.2s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
            {t("cattle_title", language)}
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {cattleList.length} {language === 'kn' ? 'ದಾಖಲಾದ ಹಸುಗಳು' : 'registered animals'}
          </p>
        </div>

        <button
          onClick={() => setIsRequestModalOpen(true)}
          className="btn btn-secondary touch-target"
          style={{ minHeight: 40, padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
        >
          <PlusIcon size={16} />
          <span>{language === 'kn' ? 'ಹೊಸ ಕೋರಿಕೆ' : 'Request Update'}</span>
        </button>
      </div>

      {/* Cattle Cards Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '2rem' }}>
        {cattleList.map((cow) => (
          <div
            key={cow.id}
            className="card"
            style={{
              padding: '1.1rem',
              cursor: 'pointer',
              border: selectedCattle?.id === cow.id ? '2px solid var(--primary)' : '1px solid var(--border)'
            }}
            onClick={() => setSelectedCattle(cow)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: 'var(--secondary-light)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <CattleIcon size={26} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    {cow.name}
                  </h3>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Tag: {cow.tag_number} | {cow.breed}
                  </div>
                </div>
              </div>
              <span className="badge badge-settled" style={{ fontSize: '0.75rem' }}>
                {cow.milking_status}
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.5rem',
              marginTop: '0.85rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid var(--border)',
              fontSize: '0.82rem'
            }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>Age</span>
                <strong>{cow.age_years ? `${cow.age_years} yrs` : 'N/A'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>Daily Yield</span>
                <strong>{cow.daily_yield_estimate ? `${cow.daily_yield_estimate} L/day` : '-'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>Gender</span>
                <strong>{cow.gender}</strong>
              </div>
            </div>

            {cow.health_notes && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Note: {cow.health_notes}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Cattle Care Reminders Section */}
      <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.85rem' }}>
        {t("reminders_title", language)}
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {reminders.map((rem) => {
          const isOverdue = rem.status === 'overdue';
          const isCompleted = rem.status === 'completed';

          return (
            <div
              key={rem.id}
              className="card"
              style={{
                padding: '1rem',
                borderLeft: `5px solid ${isOverdue ? 'var(--status-overdue)' : (isCompleted ? 'var(--status-settled)' : 'var(--status-pending)')}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                  <span className={`badge badge-${rem.status}`}>
                    {rem.status === 'overdue' ? t("overdue", language) : (rem.status === 'completed' ? t("completed", language) : t("upcoming", language))}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                    {rem.care_type}
                  </span>
                </div>
                <h4 style={{ fontSize: '0.98rem', fontWeight: 700, margin: '0.2rem 0' }}>
                  {language === 'kn' ? (rem.title_kn || rem.title) : rem.title}
                </h4>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {rem.cattle_name ? `Animal: ${rem.cattle_name} (${rem.cattle_tag}) | ` : ''} Due: <strong>{rem.due_date}</strong>
                </div>
                {rem.veterinarian_notes && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--primary)', marginTop: '0.2rem' }}>
                    Dr. Advisory: {rem.veterinarian_notes}
                  </div>
                )}
              </div>

              <button
                onClick={() => handleSpeakReminder(rem)}
                className="touch-target"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Listen to reminder"
                aria-label="Listen to reminder spoken aloud"
              >
                <SpeakerIcon size={18} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Cattle Request Modal */}
      <Modal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        title={language === 'kn' ? "ಹೊಸ ಹಸು ಅಥವಾ ತಿದ್ದುಪಡಿ ಕೋರಿಕೆ" : "Request Cattle Registration / Update"}
      >
        {requestSuccess ? (
          <div style={{
            padding: '1rem',
            backgroundColor: 'var(--status-settled-bg)',
            color: 'var(--status-settled)',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 600
          }}>
            {requestSuccess}
          </div>
        ) : (
          <form onSubmit={handleSubmitRequest}>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              {language === 'kn'
                ? 'ಹೊಸ ಹಸುವಿನ ಟ್ಯಾಗ್ ಸಂಖ್ಯೆ, ತಳಿ ಅಥವಾ ಆರೋಗ್ಯ ವಿವರಗಳನ್ನು ನಮೂದಿಸಿ. ಸಹಕಾರ ಸಂಘದ ಪರಿಶೀಲನೆ ನಂತರ ಅಧಿಕೃತ ದಾಖಲೆಗೆ ಸೇರಿಸಲಾಗುತ್ತದೆ.'
                : 'Enter details for a new cattle addition, tag number update, or health status correction. Official records are updated upon cooperative secretary approval.'}
            </p>
            <div className="form-group">
              <label className="form-label">
                {language === 'kn' ? 'ಕೋರಿಕೆಯ ವಿವರಗಳು *' : 'Request Details *'}
              </label>
              <textarea
                className="form-input"
                rows="4"
                required
                placeholder={language === 'kn' ? 'ಉದಾ: ಹೊಸ ಗಿರ್ ಹಸು ಸೇರ್ಪಡೆ, ಟ್ಯಾಗ್ ಸಂಖ್ಯೆ KA-14-GIR-10, ವಯಸ್ಸು 3 ವರ್ಷ...' : 'e.g. New Jersey cow added, Tag KA-14-JER-10, Age 3 years, est yield 12L/day...'}
                value={requestText}
                onChange={(e) => setRequestText(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', minHeight: 48 }}>
              {language === 'kn' ? 'ಕೋರಿಕೆ ಸಲ್ಲಿಸಿ' : 'Submit for Verification'}
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
}
