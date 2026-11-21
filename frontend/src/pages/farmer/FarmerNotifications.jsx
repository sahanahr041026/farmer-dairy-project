import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {} from '../../i18n';
import { BellIcon, MilkIcon, CattleIcon, InfoIcon, SpeakerIcon } from '../../components/Icons';

export function FarmerNotifications() {
  const { language } = useAuth();
  const [activeTab, setActiveTab] = useState('schemes'); // 'schemes' | 'alerts'
  const [notifications, setNotifications] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [notifs, anncs] = await Promise.all([
        api.getNotifications().catch(() => []),
        api.getAnnouncements().catch(() => [])
      ]);
      setNotifications(notifs);
      setAnnouncements(anncs);
    } catch (e) {
      console.error("Failed to load notifications or schemes:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  
const handleMarkAllRead = async () => {
  try {
    await api.markAllNotificationsRead();
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, is_read: true }))
    );
  } catch (e) {
    console.error(e);
  }
};


  const handleSpeakText = (title, body) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const text = `${title}. ${body || ''}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'kn' ? 'kn-IN' : 'en-IN';
    window.speechSynthesis.speak(utterance);
  };

  const handleSpeakNotification = (n) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const title = language === 'kn' ? (n.title_kn || n.title) : n.title;
    const body = language === 'kn' ? (n.message_kn || n.message) : n.message;
    const utterance = new SpeechSynthesisUtterance(`${title}. ${body}`);
    utterance.lang = language === 'kn' ? 'kn-IN' : 'en-IN';
    window.speechSynthesis.speak(utterance);
  };

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'milk': return <MilkIcon size={20} color="var(--primary)" />;
      case 'cattle': return <CattleIcon size={20} color="var(--secondary)" />;
      default: return <BellIcon size={20} color="var(--status-pending)" />;
    }
  };

  const getSchemeCategoryBadge = (cat) => {
    switch (cat) {
      case 'subsidy':
        return { label: language === 'kn' ? 'ಸರ್ಕಾರಿ ಸಬ್ಸಿಡಿ' : 'Government Subsidy', bg: '#ecfdf5', color: '#065f46' };
      case 'procurement':
        return { label: language === 'kn' ? 'ಖರೀದಿ ಮಾಹಿತಿ' : 'Procurement Notice', bg: '#eff6ff', color: '#1e40af' };
      case 'health_camp':
        return { label: language === 'kn' ? 'ಆರೋಗ್ಯ ಶಿಬಿರ' : 'Health Camp', bg: '#fef3c7', color: '#92400e' };
      case 'meeting':
        return { label: language === 'kn' ? 'ಸಂಘದ ಸಭೆ' : 'General Meeting', bg: '#f3e8ff', color: '#6b21a8' };
      default:
        return { label: language === 'kn' ? 'ಸಾಮಾನ್ಯ ಪ್ರಕಟಣೆ' : 'Notice', bg: '#f3f4f6', color: '#374151' };
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="container-narrow" style={{ padding: '1rem', animation: 'fadeIn 0.2s ease' }}>
      {/* Page Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
            {language === 'kn' ? 'ಪ್ರಕಟಣೆಗಳು ಮತ್ತು ಸಂದೇಶಗಳು' : 'Schemes & Notifications'}
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {language === 'kn' ? 'ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು, ಹಾಲಿನ ಬಿಲ್ಲುಗಳು ಮತ್ತು ಸಂಘದ ಎಚ್ಚರಿಕೆಗಳು' : 'Government subsidies, milk payouts, and cooperative announcements'}
          </p>
        </div>

        {activeTab === 'alerts' && unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="btn btn-outline touch-target"
            style={{ minHeight: 38, padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}
          >
            {language === 'kn' ? 'ಎಲ್ಲವನ್ನೂ ಓದಲಾಗಿದೆ' : 'Mark all read'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        borderBottom: '2px solid var(--border)',
        marginBottom: '1.25rem'
      }}>
        <button
          onClick={() => setActiveTab('schemes')}
          style={{
            padding: '0.65rem 1.1rem',
            border: 'none',
            borderBottom: activeTab === 'schemes' ? '3px solid var(--primary)' : '3px solid transparent',
            background: 'none',
            fontWeight: activeTab === 'schemes' ? 800 : 600,
            color: activeTab === 'schemes' ? 'var(--primary)' : 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '0.92rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <span>{language === 'kn' ? 'ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು & ಸಂಘದ ಪ್ರಕಟಣೆಗಳು' : 'Cooperative Schemes & News'}</span>
          <span style={{
            fontSize: '0.72rem',
            padding: '0.1rem 0.45rem',
            borderRadius: 12,
            backgroundColor: activeTab === 'schemes' ? 'var(--primary-light)' : '#f3f4f6',
            color: activeTab === 'schemes' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 700
          }}>
            {announcements.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('alerts')}
          style={{
            padding: '0.65rem 1.1rem',
            border: 'none',
            borderBottom: activeTab === 'alerts' ? '3px solid var(--primary)' : '3px solid transparent',
            background: 'none',
            fontWeight: activeTab === 'alerts' ? 800 : 600,
            color: activeTab === 'alerts' ? 'var(--primary)' : 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '0.92rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <span>{language === 'kn' ? 'ವೈಯಕ್ತಿಕ ಎಚ್ಚರಿಕೆಗಳು & SMS' : 'My Alerts & SMS'}</span>
          {unreadCount > 0 && (
            <span style={{
              fontSize: '0.72rem',
              padding: '0.1rem 0.45rem',
              borderRadius: 12,
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              fontWeight: 700
            }}>
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading information...
        </div>
      ) : activeTab === 'schemes' ? (
        /* SCHEMES TAB */
        announcements.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {announcements.map((scheme) => {
              const badge = getSchemeCategoryBadge(scheme.category);
              const title = language === 'kn' && scheme.title_kn ? scheme.title_kn : scheme.title;
              const content = language === 'kn' && scheme.content_kn ? scheme.content_kn : scheme.content;

              return (
                <div
                  key={scheme.id}
                  className="card"
                  style={{
                    padding: '1.25rem',
                    borderLeft: '5px solid var(--primary)',
                    boxShadow: 'var(--shadow-sm)',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.6rem',
                        borderRadius: 6,
                        backgroundColor: badge.bg,
                        color: badge.color
                      }}>
                        {badge.label}
                      </span>
                      {scheme.expires_at && (
                        <span style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 600 }}>
                          {language === 'kn' ? 'ಅಂತಿಮ ದಿನಾಂಕ: ' : 'Valid until: '}
                          {new Date(scheme.expires_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleSpeakText(title, content)}
                      className="touch-target"
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary-light)',
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                      title={language === 'kn' ? 'ಧ್ವನಿಯಲ್ಲಿ ಕೇಳಿ' : 'Listen aloud'}
                      aria-label="Listen aloud"
                    >
                      <SpeakerIcon size={16} />
                    </button>
                  </div>

                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.65rem', marginBottom: '0.4rem' }}>
                    {title}
                  </h3>

                  <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.55, whiteSpace: 'pre-line' }}>
                    {content}
                  </p>

                  {(scheme.eligibility_criteria || scheme.benefits) && (
                    <div style={{
                      marginTop: '0.85rem',
                      padding: '0.75rem',
                      backgroundColor: 'var(--bg-page)',
                      borderRadius: 6,
                      fontSize: '0.82rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.4rem'
                    }}>
                      {scheme.eligibility_criteria && (
                        <div>
                          <strong>{language === 'kn' ? 'ಅರ್ಹತೆ: ' : 'Eligibility: '}</strong>
                          <span>{scheme.eligibility_criteria}</span>
                        </div>
                      )}
                      {scheme.benefits && (
                        <div>
                          <strong>{language === 'kn' ? 'ಪ್ರಯೋಜನಗಳು: ' : 'Benefits: '}</strong>
                          <span>{scheme.benefits}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {(scheme.contact_person || scheme.reference_link) && (
                    <div style={{
                      marginTop: '0.75rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.78rem',
                      color: 'var(--text-muted)',
                      flexWrap: 'wrap',
                      gap: '0.5rem'
                    }}>
                      {scheme.contact_person && (
                        <span>
                          {language === 'kn' ? 'ಸಂಪರ್ಕ ಕಚೇರಿ: ' : 'Contact: '}
                          <strong>{scheme.contact_person}</strong>
                        </span>
                      )}
                      {scheme.reference_link && (
                        <a
                          href={scheme.reference_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'underline' }}
                        >
                          {language === 'kn' ? 'ಹೆಚ್ಚಿನ ಮಾಹಿತಿ ಲಿಂಕ್' : 'View Official Notice →'}
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
            <InfoIcon size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem' }} />
            <p style={{ color: 'var(--text-muted)' }}>
              {language === 'kn' ? 'ಯಾವುದೇ ಸಕ್ರಿಯ ಪ್ರಕಟಣೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ.' : 'No active schemes or announcements at this time.'}
            </p>
          </div>
        )
      ) : (
        /* ALERTS TAB */
        notifications.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {notifications.map((n) => (
              <div
                key={n.id}
                className="card"
                style={{
                  padding: '1rem',
                  backgroundColor: n.is_read ? 'var(--bg-card)' : 'var(--primary-light)',
                  borderLeft: n.is_read ? '1px solid var(--border)' : '5px solid var(--primary)',
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'flex-start'
                }}
              >
                <div style={{ marginTop: '0.2rem' }}>
                  {getCategoryIcon(n.category)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                      {language === 'kn' ? (n.title_kn || n.title) : n.title}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {new Date(n.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      <button
                        onClick={() => handleSpeakText(
                          language === 'kn' ? (n.title_kn || n.title) : n.title,
                          language === 'kn' ? (n.message_kn || n.message) : n.message
                        )}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--primary)',
                          padding: '0.1rem'
                        }}
                        title={language === 'kn' ? 'ಕೇಳಿ' : 'Listen'}
                        aria-label="Listen aloud"
                      >
                        <SpeakerIcon size={14} />
                      </button>
                    </div>
                      <button
                      onClick={() => handleSpeakNotification(n)}
                      className="touch-target"
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        backgroundColor: 'var(--bg-main)',
                        color: 'var(--primary)',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                      title="Listen to notification"
                      aria-label="Listen to notification"
                    >
                      <SpeakerIcon size={16} />
                    </button>
                  </div>
                </div>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '0.25rem', lineHeight: 1.45 }}>
                    {language === 'kn' ? (n.message_kn || n.message) : n.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
            <BellIcon size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem' }} />
            <p style={{ color: 'var(--text-muted)' }}>
              {language === 'kn' ? 'ಯಾವುದೇ ಹೊಸ ಸಂದೇಶಗಳಿಲ್ಲ.' : 'No notifications yet.'}
            </p>
          </div>
        )
      )}
    </div>
  );
}
