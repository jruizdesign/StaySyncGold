import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import Dashboard from './pages/Dashboard';
import Reservations from './pages/Reservations';
import Housekeeping from './pages/Housekeeping';
import StaffKiosk from './pages/StaffKiosk';
import Staff from './pages/Staff';
import Financials from './pages/Financials';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import AdminSettings from './pages/AdminSettings';

// Placeholder components for brevity
import Guests from './pages/Guests';
import Maintenance from './pages/Maintenance';

const App: React.FC = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<AdminSettings />} />
            <Route path="/reservations" element={<Reservations />} />
            <Route path="/guests" element={<Guests />} />
            <Route path="/housekeeping" element={<Housekeeping />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/staff" element={<Staff />} />
            <Route path="/financials" element={<Financials />} />
            <Route path="/kiosk" element={<StaffKiosk />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </AuthProvider >
    </HashRouter >
  );
};

export default App;