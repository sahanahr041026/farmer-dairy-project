import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HomeIcon, UsersIcon, MilkIcon, CalendarIcon,
  ShieldCheckIcon, LogOutIcon, SMSIcon, TrendingUpIcon
} from '../../components/Icons';

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Exactly structured navigation with SMS Notifications as the LAST ITEM
  const menuItems = [
    { to: "/admin", label: "Dashboard", icon: HomeIcon, end: true },
    { to: "/admin/farmers", label: "Farmer Management", icon: UsersIcon },
    { to: "/admin/milk", label: "Milk Collection", icon: MilkIcon },
    { to: "/admin/rates", label: "Rates & Pricing", icon: TrendingUpIcon },
    { to: "/admin/payments", label: "Payments & Settlements", icon: ShieldCheckIcon },
    { to: "/admin/cattle", label: "Cattle Care & Camps", icon: CalendarIcon },
    { to: "/admin/reports", label: "Reports & Analytics", icon: TrendingUpIcon },
    // LAST MENU ITEM: SMS Notifications
    { to: "/admin/sms", label: "SMS Notifications", icon: SMSIcon }
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-page)' }}>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 45
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          width: 260,
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 50,
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s ease'
        }}
        className="admin-sidebar"
      >
        <div>
          {/* Cooperative Header */}
          <div style={{
            padding: '1.25rem 1rem',
            borderBottom: '1px solid var(--border)',
            backgroundColor: 'var(--primary)',
            color: '#FFFFFF'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <MilkIcon size={20} />
              </div>
              <div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, lineHeight: 1.1 }}>DairySathi</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 600 }}>
                  Cooperative Admin
                </div>
              </div>
            </div>
            <div style={{
              marginTop: '0.75rem',
              padding: '0.35rem 0.5rem',
              backgroundColor: 'rgba(0,0,0,0.15)',
              borderRadius: 6,
              fontSize: '0.75rem'
            }}>
              <strong>{user?.cooperative?.name}</strong>
              <div style={{ opacity: 0.85 }}>Code: {user?.cooperative?.code}</div>
            </div>
          </div>

          {/* Navigation Items (SMS Notifications is LAST) */}
          <nav style={{ padding: '0.75rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            {menuItems.map((item) => {
              const IconComp = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setSidebarOpen(false)}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.88rem',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? 'var(--primary)' : 'var(--text-main)',
                    backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease'
                  })}
                >
                  <IconComp size={18} color="currentColor" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Admin Footer & Logout */}
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {user?.name || "Administrator"}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            Sec: {user?.username}
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-outline touch-target"
            style={{ width: '100%', minHeight: 38, padding: '0.4rem', fontSize: '0.82rem' }}
          >
            <LogOutIcon size={16} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, marginLeft: 0 }} className="admin-content-area">
        {/* Top Navbar */}
        <header style={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid var(--border)',
          padding: '0.75rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 40
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="touch-target mobile-menu-btn"
              style={{ padding: '0.5rem', display: 'flex' }}
              aria-label="Toggle navigation menu"
            >
              ☰
            </button>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary)' }}>
              {user?.cooperative?.name}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Locality: <strong>{user?.cooperative?.locality || 'Shivamogga'}</strong>
            </span>
            <Link to="/" style={{ fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 600 }}>
              Switch Portal
            </Link>
          </div>
        </header>

        {/* Nested Page Routes */}
        <main style={{ padding: '1.5rem' }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .admin-sidebar {
            transform: translateX(0) !important;
          }
          .admin-content-area {
            margin-left: 260px !important;
          }
          .mobile-menu-btn {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
