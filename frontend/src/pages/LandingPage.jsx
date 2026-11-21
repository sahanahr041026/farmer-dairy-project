import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {} from '../i18n';
import { MilkIcon, ShieldCheckIcon, AssistantIcon, DownloadIcon, SMSIcon, ArrowRightIcon } from '../components/Icons';

export function LandingPage() {
  const { language, loginAdmin, loginFarmer } = useAuth();
  const navigate = useNavigate();

  const handleQuickDemoAdmin = async () => {
    try {
      await loginAdmin({
        cooperative_code: 'KMF-MLN-108',
        username_or_email: 'admin',
        password: 'admin123'
      });
      navigate('/admin');
    } catch (e) {
      alert("Demo login error: " + e.message);
    }
  };

  const handleQuickDemoFarmer = async () => {
    try {
      await loginFarmer({
        cooperative_code: 'KMF-MLN-108',
        farmer_uid_or_phone: 'DS-FARM-101',
        pin: '1234'
      });
      navigate('/farmer');
    } catch (e) {
      alert("Demo login error: " + e.message);
    }
  };

  return (
    <div className="container-wide" style={{ padding: '2rem 1rem' }}>
      {/* Hero Section */}
      <div style={{
        textAlign: 'center',
        maxWidth: 780,
        margin: '1.5rem auto 3rem',
        animation: 'fadeIn 0.3s ease'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.4rem 1rem',
          backgroundColor: 'var(--primary-light)',
          color: 'var(--primary)',
          borderRadius: 'var(--radius-full)',
          fontWeight: 700,
          fontSize: '0.85rem',
          marginBottom: '1rem'
        }}>
          <ShieldCheckIcon size={16} />
          <span>Dairy Cooperative Management & Cattle Care Platform</span>
        </div>

        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 2.75rem)',
          fontWeight: 800,
          color: 'var(--primary)',
          lineHeight: 1.2,
          marginBottom: '1rem'
        }}>
          {language === 'kn' ? 'ಡೈರಿಸಾಥಿ — ಹೈನುಗಾರರ ಡಿಜಿಟಲ್ ಮಿತ್ರ' : 'DairySathi — Connected Cooperative & Cattle Care'}
        </h1>

        <p style={{
          fontSize: '1.1rem',
          color: 'var(--text-muted)',
          lineHeight: 1.6,
          marginBottom: '2rem'
        }}>
          {language === 'kn'
            ? 'ರೈತರಿಗಾಗಿ ಸರಳ ಹಾಲು ಪಾಸ್‌ಬುಕ್ ಮತ್ತು ಪಶು ಆರೈಕೆ. ಡೈರಿ ಸಹಕಾರ ಸಂಘಗಳಿಗೆ ಸಂಪೂರ್ಣ ಆಡಳಿತ, ಹಾಲು ಸಂಗ್ರಹ ಹಾಗೂ ಪಾವತಿ ನಿರ್ವಹಣೆ.'
            : 'A transparent, accessible portal for Indian dairy farmers to track milk collections, earnings, cattle care reminders, and ask for cattle guidance; seamlessly connected with their dairy cooperative administration.'}
        </p>

        {/* Portal Entry Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
          textAlign: 'left',
          marginBottom: '2.5rem'
        }}>
          {/* Farmer Portal Card */}
          <div className="card" style={{
            border: '2px solid var(--secondary)',
            backgroundColor: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                backgroundColor: 'var(--secondary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}>
                <MilkIcon size={28} />
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem' }}>
                {language === 'kn' ? 'ರೈತರ ಪೋರ್ಟಲ್' : 'Farmer Portal'}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                {language === 'kn'
                  ? 'ದೈನಂದಿನ ಹಾಲಿನ ಸಂಗ್ರಹ, ಫ್ಯಾಟ್ %, ದರ, ಹಣದ ಜಮೆ, ಜಾನುವಾರು ಲಸಿಕೆ ಜ್ಞಾಪನೆಗಳು ಮತ್ತು ಡಿಜಿಟಲ್ ಪಾಸ್‌ಬುಕ್ PDF ಪಡೆಯಿರಿ.'
                  : 'Check morning/evening milk entries, fat & SNF %, earnings, download digital passbook PDF, view cattle health & ask cattle care assistant.'}
              </p>
            </div>
            <div>
              <Link to="/farmer-login" className="btn btn-primary" style={{ width: '100%', marginBottom: '0.5rem' }}>
                <span>{language === 'kn' ? 'ರೈತರ ಲಾಗಿನ್' : 'Farmer Log In'}</span>
                <ArrowRightIcon size={18} />
              </Link>
              <button
                onClick={handleQuickDemoFarmer}
                className="btn btn-outline"
                style={{ width: '100%', fontSize: '0.82rem', minHeight: 38 }}
              >
                Demo Farmer (Basavaraj Patil)
              </button>
            </div>
          </div>

          {/* Admin Portal Card */}
          <div className="card" style={{
            border: '2px solid var(--primary)',
            backgroundColor: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}>
                <ShieldCheckIcon size={28} />
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem' }}>
                {language === 'kn' ? 'ಡೈರಿ ಸಹಕಾರ ಸಂಘ ನಿರ್ವಾಹಕ' : 'Dairy Cooperative Admin'}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                {language === 'kn'
                  ? 'ಸದಸ್ಯ ರೈತರ ನಿರ್ವಹಣೆ, ಹಾಲು ತೂಕ, ಫ್ಯಾಟ್ ಪರೀಕ್ಷೆ, ದರ ನಿಯಮಗಳು, ಬಿಲ್ ಪಾವತಿ, ವರದಿಗಳು ಮತ್ತು ರೈತರಿಗೆ SMS ಪ್ರಕಟಣೆಗಳು.'
                  : 'Manage registered farmers, record milk collection with duplicate checks, configure rate rules, process settlements, track cattle camps & dispatch SMS announcements.'}
              </p>
            </div>
            <div>
              <Link to="/admin-login" className="btn btn-primary" style={{ width: '100%', marginBottom: '0.5rem', backgroundColor: 'var(--primary-dark)' }}>
                <span>{language === 'kn' ? 'ನಿರ್ವಾಹಕ ಲಾಗಿನ್' : 'Cooperative Admin Log In'}</span>
                <ArrowRightIcon size={18} />
              </Link>
              <button
                onClick={handleQuickDemoAdmin}
                className="btn btn-outline"
                style={{ width: '100%', fontSize: '0.82rem', minHeight: 38 }}
              >
                Demo Admin (Nandini Malnad Coop)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div style={{ marginTop: '3rem' }}>
        <h3 style={{ textAlign: 'center', fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '1.5rem' }}>
          {language === 'kn' ? 'ಡೈರಿಸಾಥಿ ಮುಖ್ಯ ಸೌಲಭ್ಯಗಳು' : 'Key Platform Capabilities'}
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.25rem'
        }}>
          <div className="card">
            <div style={{ color: 'var(--primary)', marginBottom: '0.75rem' }}><MilkIcon size={26} /></div>
            <h4 style={{ fontWeight: 700, marginBottom: '0.4rem' }}>Automatic Synchronization</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              When an admin records or corrects milk collections, the farmer portal and digital passbook update immediately with zero delay.
            </p>
          </div>
          <div className="card">
            <div style={{ color: 'var(--primary)', marginBottom: '0.75rem' }}><DownloadIcon size={26} /></div>
            <h4 style={{ fontWeight: 700, marginBottom: '0.4rem' }}>Official Digital E-Passbook</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Generate and download valid, printable PDF statements containing cooperative stamps, quality parameters, and settlement status.
            </p>
          </div>
          <div className="card">
            <div style={{ color: 'var(--primary)', marginBottom: '0.75rem' }}><AssistantIcon size={26} /></div>
            <h4 style={{ fontWeight: 700, marginBottom: '0.4rem' }}>Ask DairySathi (Bilingual)</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              English & Kannada cattle care assistant with optional voice input and spoken audio, with verified veterinary escalation.
            </p>
          </div>
          <div className="card">
            <div style={{ color: 'var(--primary)', marginBottom: '0.75rem' }}><SMSIcon size={26} /></div>
            <h4 style={{ fontWeight: 700, marginBottom: '0.4rem' }}>SMS Notifications & Schemes</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Broadcast announcements regarding government dairy subsidies, vaccination camps, and bill settlement alerts directly to farmers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
