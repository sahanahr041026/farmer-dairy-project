import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { t } from '../i18n';
import { HomeIcon, MilkIcon, CattleIcon, AssistantIcon, BellIcon } from './Icons';

export function BottomNav() {
  const { language } = useAuth();

  const navItems = [
    { to: "/farmer", label: t("home", language), icon: HomeIcon, end: true },
    { to: "/farmer/passbook", label: t("my_milk", language), icon: MilkIcon },
    { to: "/farmer/cattle", label: t("my_cows", language), icon: CattleIcon },
    { to: "/farmer/assistant", label: t("assistant", language), icon: AssistantIcon },
    { to: "/farmer/notifications", label: t("notifications", language), icon: BellIcon }
  ];

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'var(--bg-card)',
      borderTop: '1px solid var(--border)',
      boxShadow: '0 -2px 10px rgba(0,0,0,0.06)',
      zIndex: 50,
      height: 64,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      padding: '0 0.5rem'
    }}>
      {navItems.map((item) => {
        const IconComponent = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            style={({ isActive }) => ({
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 52,
              minWidth: 48,
              padding: '0.25rem 0',
              borderRadius: 'var(--radius-sm)',
              color: isActive ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: isActive ? 700 : 500,
              fontSize: '0.75rem',
              gap: '0.2rem',
              backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
              transition: 'all 0.15s ease'
            })}
          >
            <IconComponent size={20} />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
