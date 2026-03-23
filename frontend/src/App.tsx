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
import DailyOverview from './pages/DailyOverview';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import EULA from './pages/EULA';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import LegalAgreement from './pages/LegalAgreement';
import AdminSettings from './pages/AdminSettings';
import Pricing from './pages/Pricing';
import { QuickBooksIntegration } from './pages/QuickBooksIntegration';
import Accounting from './pages/Accounting';
import ITSecurity from './pages/ITSecurity';
import DigitalSolutions from './pages/DigitalSolutions';
import ChannelManager from './pages/ChannelManager';
import CalendarPage from './pages/Calendar';

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
            <Route path="/signup" element={<Signup />} />

            {/* Public Landing Pages */}
            <Route path="/legal-agreement" element={<LegalAgreement />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/it-security" element={<ITSecurity />} />
            <Route path="/digital-solutions" element={<DigitalSolutions />} />
            <Route path="/eula" element={<EULA />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/pricing" element={<Pricing />} />

            {/* Protected Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} />
            <Route path="/reservations" element={<ProtectedRoute><Reservations /></ProtectedRoute>} />
            <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
            <Route path="/guests" element={<ProtectedRoute><Guests /></ProtectedRoute>} />
            <Route path="/housekeeping" element={<ProtectedRoute><Housekeeping /></ProtectedRoute>} />
            <Route path="/maintenance" element={<ProtectedRoute><Maintenance /></ProtectedRoute>} />
            <Route path="/staff" element={<ProtectedRoute><Staff /></ProtectedRoute>} />
            <Route path="/financials" element={<ProtectedRoute><Financials /></ProtectedRoute>} />
            <Route path="/quickbooks" element={<ProtectedRoute><QuickBooksIntegration /></ProtectedRoute>} />
            <Route path="/daily-overview" element={<ProtectedRoute><DailyOverview /></ProtectedRoute>} />
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