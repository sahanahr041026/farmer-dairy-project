import React, { createContext, useCallback, useContext, useState, useEffect } from 'react';
import { api, UNAUTHORIZED_EVENT } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('dairysathi_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('dairysathi_lang') || 'en';
  });

  const [loading, setLoading] = useState(true);

  // Clears local UI state only (also used when the server already rejected the session).
  const clearSession = useCallback(() => {
    localStorage.removeItem('dairysathi_user');
    setUser(null);
  }, []);

  // Explicit logout also asks the server to expire the httpOnly session cookie.
  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch (e) { /* cookie may already be gone; still clear local state */ }
    clearSession();
  }, [clearSession]);

  // api.js dispatches this when the server rejects the session (expired / deactivated account).
  useEffect(() => {
    window.addEventListener(UNAUTHORIZED_EVENT, clearSession);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, clearSession);
  }, [clearSession]);

  useEffect(() => {
    async function initAuth() {
      // The cached profile is only a hint that a session may exist; the cookie is the credential.
      if (localStorage.getItem('dairysathi_user')) {
        try {
          const profile = await api.getMe();
          setUser(profile);
          localStorage.setItem('dairysathi_user', JSON.stringify(profile));
          if (profile.language) {
            setLanguageState(profile.language);
            localStorage.setItem('dairysathi_lang', profile.language);
          }
        } catch (err) {
          // Only drop the session when the server rejected it; keep it on transient network errors.
          if (err.status === 401 || err.status === 403) {
            console.warn("Session expired or invalid, logging out:", err.message);
            clearSession();
          }
        }
      }
      setLoading(false);
    }
    initAuth();
  }, [clearSession]);

  const loginAdmin = async (credentials) => {
    const res = await api.loginAdmin(credentials);
    const profile = {
      role: 'admin',
      id: res.user_id,
      name: res.name,
      cooperative: {
        id: res.cooperative_id,
        name: res.cooperative_name,
        code: res.cooperative_code
      }
    };
    setUser(profile);
    localStorage.setItem('dairysathi_user', JSON.stringify(profile));
    return profile;
  };

  const loginFarmer = async (credentials) => {
    const res = await api.loginFarmer(credentials);
    const profile = {
      role: 'farmer',
      id: res.user_id,
      name: res.name,
      farmer_uid: res.farmer_uid,
      language: res.language || 'en',
      cooperative: {
        id: res.cooperative_id,
        name: res.cooperative_name,
        code: res.cooperative_code
      }
    };
    setUser(profile);
    localStorage.setItem('dairysathi_user', JSON.stringify(profile));
    if (res.language) {
      setLanguageState(res.language);
      localStorage.setItem('dairysathi_lang', res.language);
    }
    return profile;
  };

  const setLanguage = async (newLang) => {
    setLanguageState(newLang);
    localStorage.setItem('dairysathi_lang', newLang);
    if (user && user.role === 'farmer') {
      try {
        await api.setLanguage(newLang);
      } catch (e) {}
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      role: user?.role,
      isAuthenticated: !!user,
      loading,
      language,
      setLanguage,
      loginAdmin,
      loginFarmer,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
