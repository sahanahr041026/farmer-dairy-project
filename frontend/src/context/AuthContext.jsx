import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

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

  useEffect(() => {
    async function initAuth() {
      const token = localStorage.getItem('dairysathi_token');
      if (token) {
        try {
          const profile = await api.getMe();
          setUser(profile);
          localStorage.setItem('dairysathi_user', JSON.stringify(profile));
          if (profile.language) {
            setLanguageState(profile.language);
            localStorage.setItem('dairysathi_lang', profile.language);
          }
        } catch (err) {
          console.warn("Session expired or invalid, logging out:", err.message);
          logout();
        }
      }
      setLoading(false);
    }
    initAuth();
  }, []);

  const loginAdmin = async (credentials) => {
    const res = await api.loginAdmin(credentials);
    localStorage.setItem('dairysathi_token', res.access_token);
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
    localStorage.setItem('dairysathi_token', res.access_token);
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

  const logout = () => {
    localStorage.removeItem('dairysathi_token');
    localStorage.removeItem('dairysathi_user');
    setUser(null);
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
