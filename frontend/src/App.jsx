import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';

// Public Pages
import { LandingPage } from './pages/LandingPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { FarmerLoginPage } from './pages/FarmerLoginPage';

// Farmer Pages
import { FarmerHome } from './pages/farmer/FarmerHome';
import { FarmerPassbook } from './pages/farmer/FarmerPassbook';
import { FarmerCattle } from './pages/farmer/FarmerCattle';
import { FarmerAssistant } from './pages/farmer/FarmerAssistant';
import { FarmerNotifications } from './pages/farmer/FarmerNotifications';

// Admin Pages
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminFarmers } from './pages/admin/AdminFarmers';
import { AdminMilkCollection } from './pages/admin/AdminMilkCollection';
import { AdminRates } from './pages/admin/AdminRates';
import { AdminPayments } from './pages/admin/AdminPayments';
import { AdminCattleCare } from './pages/admin/AdminCattleCare';
import { AdminReports } from './pages/admin/AdminReports';
import { AdminSMSNotifications } from './pages/admin/AdminSMSNotifications';

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
    <AuthProvider>
      <BrowserRouter>
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
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
