import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import Dashboard from './pages/Dashboard';
import Reservations from './pages/Reservations';
import Housekeeping from './pages/Housekeeping';
import StaffKiosk from './pages/StaffKiosk';
import ManagerTimeTracking from './pages/ManagerTimeTracking';
import Staff from './pages/Staff';
import Financials from './pages/Financials';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import AdminSettings from './pages/AdminSettings';
import Accounting from './pages/Accounting';
import ITSecurity from './pages/ITSecurity';
import DigitalSolutions from './pages/DigitalSolutions';
import ChannelManager from './pages/ChannelManager';

// Placeholder components for brevity
import Guests from './pages/Guests';
import Maintenance from './pages/Maintenance';
import ProtectedRoute from './components/ProtectedRoute';

const App: React.FC = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />

            {/* Public Landing Pages */}
            <Route path="/it-security" element={<ITSecurity />} />
            <Route path="/digital-solutions" element={<DigitalSolutions />} />

            {/* Protected Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} />
            <Route path="/reservations" element={<ProtectedRoute><Reservations /></ProtectedRoute>} />
            <Route path="/guests" element={<ProtectedRoute><Guests /></ProtectedRoute>} />
            <Route path="/housekeeping" element={<ProtectedRoute><Housekeeping /></ProtectedRoute>} />
            <Route path="/maintenance" element={<ProtectedRoute><Maintenance /></ProtectedRoute>} />
            <Route path="/staff" element={<ProtectedRoute><Staff /></ProtectedRoute>} />
            <Route path="/financials" element={<ProtectedRoute><Financials /></ProtectedRoute>} />
            <Route path="/accounting" element={<ProtectedRoute><Accounting /></ProtectedRoute>} />
            <Route path="/kiosk" element={<ProtectedRoute><StaffKiosk /></ProtectedRoute>} />
            <Route path="/time-tracking" element={<ProtectedRoute><ManagerTimeTracking /></ProtectedRoute>} />
            <Route path="/channel-manager" element={<ProtectedRoute><ChannelManager /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </AuthProvider >
    </HashRouter >
  );
};

export default App;