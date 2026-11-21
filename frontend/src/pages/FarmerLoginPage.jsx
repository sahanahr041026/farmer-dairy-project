import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {} from '../i18n';
import { MilkIcon, AlertTriangleIcon } from '../components/Icons';

export function FarmerLoginPage() {
  const [cooperatives, setCooperatives] = useState([]);
  const [coopCode, setCoopCode] = useState('KMF-MLN-108');
  const [farmerId, setFarmerId] = useState('DS-FARM-101');
  const [pin, setPin] = useState('1234');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { loginFarmer, language, _setLanguage } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchCoops() {
      try {
        const list = await api.getCooperatives();
        setCooperatives(list);
        if (list.length > 0 && !coopCode) {
          setCoopCode(list[0].code);
        }
      } catch (e) {
        console.error("Error fetching cooperatives:", e);
      }
    }
    fetchCoops();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await loginFarmer({
        cooperative_code: coopCode,
        farmer_uid_or_phone: farmerId,
        pin: pin
      });
      navigate('/farmer');
    } catch (err) {
      setError(err.message || (language === 'kn' ? 'ಲಾಗಿನ್ ವಿಫಲವಾಗಿದೆ. ದಯವಿಟ್ಟು ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.' : 'Login failed. Please check your credentials.'));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFarmer = (uid, defaultPin = "1234") => {
    setFarmerId(uid);
    setPin(defaultPin);
  };

  return (
    <div className="container-narrow" style={{ padding: '2.5rem 1rem' }}>
      <div className="card" style={{ padding: '2rem', animation: 'fadeIn 0.2s ease' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            width: 56,
            height: 56,
            backgroundColor: 'var(--secondary-light)',
            color: 'var(--primary)',
            borderRadius: '50%',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.75rem'
          }}>
            <MilkIcon size={28} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
            {language === 'kn' ? 'ರೈತರ ಸುಲಭ ಲಾಗಿನ್' : 'Farmer Easy Log In'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            {language === 'kn' ? 'ನಿಮ್ಮ ಹಾಲು ಮತ್ತು ಪಶು ಆರೈಕೆ ವಿವರಗಳನ್ನು ವೀಕ್ಷಿಸಿ' : 'View your milk collections, e-passbook and cattle records'}
          </p>
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.85rem',
            backgroundColor: 'var(--status-overdue-bg)',
            color: 'var(--status-overdue)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.9rem',
            marginBottom: '1.25rem'
          }}>
            <AlertTriangleIcon size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Cooperative Selection */}
          <div className="form-group">
            <label className="form-label" htmlFor="farmerCoop">
              {language === 'kn' ? 'ಹಾಲು ಸಹಕಾರ ಸಂಘ *' : 'Dairy Cooperative Society *'}
            </label>
            {cooperatives.length > 0 ? (
              <select
                id="farmerCoop"
                className="form-input"
                value={coopCode}
                onChange={(e) => setCoopCode(e.target.value)}
                required
              >
                {cooperatives.map(c => (
                  <option key={c.id} value={c.code}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            ) : (
              <input
                id="farmerCoop"
                type="text"
                className="form-input"
                value={coopCode}
                onChange={(e) => setCoopCode(e.target.value)}
                required
              />
            )}
          </div>

          {/* Farmer UID or Phone */}
          <div className="form-group">
            <label className="form-label" htmlFor="farmerId">
              {language === 'kn' ? 'ರೈತರ ಗುರುತಿನ ಸಂಖ್ಯೆ ಅಥವಾ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ *' : 'Farmer ID or Registered Mobile Number *'}
            </label>
            <input
              id="farmerId"
              type="text"
              className="form-input"
              placeholder={language === 'kn' ? 'ಉದಾ: DS-FARM-101 ಅಥವಾ 9845012345' : 'e.g. DS-FARM-101 or 9845012345'}
              value={farmerId}
              onChange={(e) => setFarmerId(e.target.value)}
              required
            />
          </div>

          {/* 4-digit PIN */}
          <div className="form-group">
            <label className="form-label" htmlFor="farmerPin">
              {language === 'kn' ? '4-ಅಂಕಿಯ ಸುರಕ್ಷಿತ ಪಿನ್ (PIN) *' : '4-Digit Security PIN *'}
            </label>
            <input
              id="farmerPin"
              type="password"
              maxLength="6"
              className="form-input"
              placeholder="••••"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem', minHeight: 48 }}
            disabled={loading}
          >
            {loading ? (language === 'kn' ? "ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ..." : "Logging in...") : (language === 'kn' ? "ನನ್ನ ಖಾತೆಗೆ ಪ್ರವೇಶಿಸಿ" : "Log In to My Account")}
          </button>
        </form>

        {/* Quick Demo Selector for Reviewers */}
        <div style={{
          marginTop: '1.75rem',
          padding: '0.85rem',
          backgroundColor: 'var(--bg-page)',
          borderRadius: 'var(--radius-sm)',
          border: '1px dashed var(--border)',
          fontSize: '0.82rem'
        }}>
          <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
            Quick Demo Sample Farmers (PIN: 1234):
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            <button
              type="button"
              onClick={() => handleSelectFarmer('DS-FARM-101')}
              style={{
                padding: '0.3rem 0.6rem',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                borderRadius: 4,
                fontSize: '0.8rem',
                fontWeight: 600
              }}
            >
              Basavaraj Patil (101)
            </button>
            <button
              type="button"
              onClick={() => handleSelectFarmer('DS-FARM-102')}
              style={{
                padding: '0.3rem 0.6rem',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                borderRadius: 4,
                fontSize: '0.8rem',
                fontWeight: 600
              }}
            >
              Manjula Gowda (102)
            </button>
            <button
              type="button"
              onClick={() => handleSelectFarmer('DS-FARM-103')}
              style={{
                padding: '0.3rem 0.6rem',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                borderRadius: 4,
                fontSize: '0.8rem',
                fontWeight: 600
              }}
            >
              Suresh Kumar (103)
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.88rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Cooperative Staff? </span>
          <Link to="/admin-login" style={{ color: 'var(--primary)', fontWeight: 700 }}>
            Go to Admin Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
