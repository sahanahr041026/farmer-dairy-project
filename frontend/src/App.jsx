import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { ErrorBoundary } from './components/ErrorBoundary';

// Pages are code-split per route so the landing/login bundle stays small.
const named = (loader, name) => lazy(() => loader().then((m) => ({ default: m[name] })));

// Public Pages
const LandingPage = named(() => import('./pages/LandingPage'), 'LandingPage');
const AdminLoginPage = named(() => import('./pages/AdminLoginPage'), 'AdminLoginPage');
const FarmerLoginPage = named(() => import('./pages/FarmerLoginPage'), 'FarmerLoginPage');

// Farmer Pages
const FarmerHome = named(() => import('./pages/farmer/FarmerHome'), 'FarmerHome');
const FarmerPassbook = named(() => import('./pages/farmer/FarmerPassbook'), 'FarmerPassbook');
const FarmerCattle = named(() => import('./pages/farmer/FarmerCattle'), 'FarmerCattle');
const FarmerAssistant = named(() => import('./pages/farmer/FarmerAssistant'), 'FarmerAssistant');
const FarmerNotifications = named(() => import('./pages/farmer/FarmerNotifications'), 'FarmerNotifications');

// Admin Pages
const AdminLayout = named(() => import('./pages/admin/AdminLayout'), 'AdminLayout');
const AdminDashboard = named(() => import('./pages/admin/AdminDashboard'), 'AdminDashboard');
const AdminFarmers = named(() => import('./pages/admin/AdminFarmers'), 'AdminFarmers');
const AdminMilkCollection = named(() => import('./pages/admin/AdminMilkCollection'), 'AdminMilkCollection');
const AdminRates = named(() => import('./pages/admin/AdminRates'), 'AdminRates');
const AdminPayments = named(() => import('./pages/admin/AdminPayments'), 'AdminPayments');
const AdminCattleCare = named(() => import('./pages/admin/AdminCattleCare'), 'AdminCattleCare');
const AdminReports = named(() => import('./pages/admin/AdminReports'), 'AdminReports');
const AdminSMSNotifications = named(() => import('./pages/admin/AdminSMSNotifications'), 'AdminSMSNotifications');

function PageFallback() {
  return (
    <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--primary)' }}>Loading…</div>
  );
}

// Farmer Layout wrapper
function FarmerLayoutWrapper() {
  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}

// Public Layout wrapper
function PublicLayoutWrapper() {
  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content" style={{ paddingBottom: '2rem' }}>
        <Outlet />
      </main>
    </div>
  );
}

// Protected Route Guard
function ProtectedRoute({ allowedRole, children }) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
        Loading DairySathi...
      </div>
    );
  }

  if (!user) {
    return <Navigate to={allowedRole === 'admin' ? '/admin-login' : '/farmer-login'} replace />;
  }

  if (allowedRole && role !== allowedRole) {
    return <Navigate to={role === 'admin' ? '/admin' : '/farmer'} replace />;
  }

  return children;
}

export function App() {
  return (
    <ErrorBoundary>
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageFallback />}>
        <Routes>
          {/* Public Portal */}
          <Route element={<PublicLayoutWrapper />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/farmer-login" element={<FarmerLoginPage />} />
            <Route path="/admin-login" element={<AdminLoginPage />} />
          </Route>

          {/* Farmer Portal (Mobile-First, Accessible) */}
          <Route
            path="/farmer"
            element={
              <ProtectedRoute allowedRole="farmer">
                <FarmerLayoutWrapper />
              </ProtectedRoute>
            }
          >
            <Route index element={<FarmerHome />} />
            <Route path="passbook" element={<FarmerPassbook />} />
            <Route path="cattle" element={<FarmerCattle />} />
            <Route path="assistant" element={<FarmerAssistant />} />
            <Route path="notifications" element={<FarmerNotifications />} />
          </Route>

          {/* Admin Portal (Professional Dashboard) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="farmers" element={<AdminFarmers />} />
            <Route path="milk" element={<AdminMilkCollection />} />
            <Route path="rates" element={<AdminRates />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="cattle" element={<AdminCattleCare />} />
            <Route path="reports" element={<AdminReports />} />
            {/* LAST MENU ITEM: SMS Notifications */}
            <Route path="sms" element={<AdminSMSNotifications />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
