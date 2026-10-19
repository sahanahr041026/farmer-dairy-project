import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { t } from '../../i18n';
import { BellIcon, CheckCircleIcon, MilkIcon, CattleIcon, InfoIcon } from '../../components/Icons';

export function FarmerNotifications() {
  const { language } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (e) {}
  };

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'milk': return <MilkIcon size={20} color="var(--primary)" />;
      case 'cattle': return <CattleIcon size={20} color="var(--secondary)" />;
      default: return <BellIcon size={20} color="var(--status-pending)" />;
    }
  };

  return (
    <div className="container-narrow" style={{ padding: '1rem', animation: 'fadeIn 0.2s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
            {t("notifications", language)}
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {language === 'kn' ? 'ಹಾಲು, ಪಾವತಿ ಮತ್ತು ಜಾನುವಾರು ಶಿಬಿರದ ಪ್ರಕಟಣೆಗಳು' : 'Milk, payment and cattle camp updates'}
          </p>
        </div>

        {notifications.some(n => !n.is_read) && (
          <button
            onClick={handleMarkAllRead}
            className="btn btn-outline touch-target"
            style={{ minHeight: 38, padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}
          >
            {language === 'kn' ? 'ಎಲ್ಲವನ್ನೂ ಓದಲಾಗಿದೆ' : 'Mark all read'}
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
          Loading notifications...
        </div>
      ) : notifications.length > 0 ? (
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
                gap: '0.75rem'
              }}
            >
              <div style={{ marginTop: '0.2rem' }}>
                {getCategoryIcon(n.category)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {language === 'kn' ? (n.title_kn || n.title) : n.title}
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(n.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
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
          <p style={{ color: 'var(--text-muted)' }}>No notifications yet.</p>
        </div>
      )}
    </div>
  );
}
