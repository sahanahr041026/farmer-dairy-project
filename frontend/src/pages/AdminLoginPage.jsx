import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ShieldCheckIcon, AlertTriangleIcon } from '../components/Icons';

export function AdminLoginPage() {
  const [cooperatives, setCooperatives] = useState([]);
  const [coopCode, setCoopCode] = useState('KMF-MLN-108');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { loginAdmin } = useAuth();
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
      await loginAdmin({
        cooperative_code: coopCode,
        username_or_email: username,
        password: password
      });
      navigate('/admin');
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrefillDemo = () => {
    setCoopCode('KMF-MLN-108');
    setUsername('admin');
    setPassword('admin123');
  };

  return (
    <div className="container-narrow" style={{ padding: '3rem 1rem' }}>
      <div className="card" style={{ padding: '2rem', animation: 'fadeIn 0.2s ease' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            width: 56,
            height: 56,
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary)',
            borderRadius: '50%',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.75rem'
          }}>
            <ShieldCheckIcon size={28} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
            Dairy Cooperative Admin Login
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Authorized portal for dairy society management
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
          {/* Cooperative Code / Selection */}
          <div className="form-group">
            <label className="form-label" htmlFor="coopCode">
              Dairy Cooperative Society / Code *
            </label>
            {cooperatives.length > 0 ? (
              <select
                id="coopCode"
                className="form-input"
                value={coopCode}
                onChange={(e) => setCoopCode(e.target.value)}
                required
              >
                {cooperatives.map(c => (
                  <option key={c.id} value={c.code}>
                    {c.code} — {c.name} ({c.locality})
                  </option>
                ))}
              </select>
            ) : (
              <input
                id="coopCode"
                type="text"
                className="form-input"
                placeholder="e.g. KMF-MLN-108"
                value={coopCode}
                onChange={(e) => setCoopCode(e.target.value)}
                required
              />
            )}
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
              Identifies registered cooperative in database
            </span>
          </div>

          {/* Admin Username or Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="username">
              Admin Username or Registered Email *
            </label>
            <input
              id="username"
              type="text"
              className="form-input"
              placeholder="e.g. admin or admin@dairysathi.com"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password *
            </label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem', minHeight: 48 }}
            disabled={loading}
          >
            {loading ? "Authenticating..." : "Log In to Admin Dashboard"}
          </button>
        </form>

        {/* Development Helper Box */}
        <div style={{
          marginTop: '1.75rem',
          padding: '0.85rem',
          backgroundColor: 'var(--bg-page)',
          borderRadius: 'var(--radius-sm)',
          border: '1px dashed var(--border)',
          fontSize: '0.82rem'
        }}>
          <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
            Academic Demo Credentials (Pre-seeded):
          </div>
          <div style={{ color: 'var(--text-muted)', lineHeight: 1.4 }}>
            Coop Code: <code>KMF-MLN-108</code> | User: <code>admin</code> | Password: <code>admin123</code>
          </div>
          <button
            type="button"
            onClick={handlePrefillDemo}
            style={{
              color: 'var(--primary)',
              fontWeight: 700,
              textDecoration: 'underline',
              marginTop: '0.4rem',
              cursor: 'pointer',
              fontSize: '0.82rem'
            }}
          >
            Click to fill sample admin credentials
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.88rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Are you a farmer? </span>
          <Link to="/farmer-login" style={{ color: 'var(--primary)', fontWeight: 700 }}>
            Go to Farmer Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
