import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { t } from '../i18n';
import { MilkIcon, LogOutIcon, BellIcon, ShieldCheckIcon, SpeakerIcon } from './Icons';

export function Navbar() {
  const { user, role, logout, language, setLanguage } = useAuth();
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'kn' : 'en');
  };

  return (
    <header style={{
      backgroundColor: 'var(--bg-card)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div className="container-wide" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1rem',
        minHeight: 64
      }}>
        {/* Brand Logo & Name */}
        <Link to={role === 'admin' ? '/admin' : (role === 'farmer' ? '/farmer' : '/')} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem'
        }}>
          <div style={{
            width: 42,
            height: 42,
            backgroundColor: 'var(--primary)',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF'
          }}>
            <MilkIcon size={24} />
          </div>
          <div>
            <div style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              color: 'var(--primary)',
              letterSpacing: '-0.02em',
              lineHeight: 1.1
            }}>
              DairySathi
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              {language === 'kn' ? 'ಹೈನುಗಾರರ ಡಿಜಿಟಲ್ ಮಿತ್ರ' : 'Cattle Care & Dairy Cooperative'}
            </div>
          </div>
        </Link>

        {/* Center / Cooperative Badge */}
        {user?.cooperative && (
          <div style={{
            display: 'none',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.35rem 0.85rem',
            backgroundColor: 'var(--primary-light)',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: 'var(--primary)'
          }} className="coop-badge-desktop">
            <ShieldCheckIcon size={16} />
            <span>{user.cooperative.name} ({user.cooperative.code})</span>
          </div>
        )}

        {/* Right Tools: Connectivity, Language Toggle, Profile/Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Online/Offline status pill */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontSize: '0.75rem',
            fontWeight: 600,
            padding: '0.25rem 0.6rem',
            borderRadius: 20,
            backgroundColor: isOnline ? 'var(--status-settled-bg)' : 'var(--status-overdue-bg)',
            color: isOnline ? 'var(--status-settled)' : 'var(--status-overdue)'
          }} title={isOnline ? "Server connected" : "Working in offline cached mode"}>
            <span style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              backgroundColor: isOnline ? 'var(--status-settled)' : 'var(--status-overdue)'
            }}></span>
            <span>{isOnline ? (language === 'kn' ? 'ಆನ್‌ಲೈನ್' : 'Online') : (language === 'kn' ? 'ಆಫ್‌ಲೈನ್' : 'Offline')}</span>
          </div>

          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            className="touch-target"
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              border: '1.5px solid var(--border)',
              backgroundColor: 'var(--bg-card)',
              fontSize: '0.85rem',
              fontWeight: 700,
              color: 'var(--primary)',
              minHeight: 40
            }}
            aria-label="Toggle language between English and Kannada"
          >
            {language === 'en' ? 'ಕನ್ನಡ' : 'English'}
          </button>

          {/* User profile / Logout */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ textAlign: 'right', display: 'none' }} className="user-info-desktop">
                <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{user.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {role === 'admin' ? 'Administrator' : `ID: ${user.farmer_uid || 'Farmer'}`}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="btn btn-outline touch-target"
                style={{ minHeight: 40, padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
                title="Log out"
              >
                <LogOutIcon size={16} />
                <span className="logout-text">{language === 'kn' ? 'ನಿರ್ಗಮಿಸಿ' : 'Logout'}</span>
              </button>
            </div>
          ) : (
            <Link
              to="/farmer-login"
              className="btn btn-primary touch-target"
              style={{ minHeight: 40, padding: '0.4rem 1rem', fontSize: '0.85rem' }}
            >
              {language === 'kn' ? 'ಲಾಗಿನ್' : 'Log In'}
            </Link>
          )}
        </div>
      </div>
      <style>{`
        @media (min-width: 768px) {
          .coop-badge-desktop { display: inline-flex !important; }
          .user-info-desktop { display: block !important; }
        }
      `}</style>
    </header>
  );
}
