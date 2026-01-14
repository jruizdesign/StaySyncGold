import { useState } from 'react';
import './App.css'
import ReservationsPage from './components/pages/Reservations.jsx';
import BillingPage from './components/pages/Billing.jsx';
import GuestsPage from './components/pages/Guests.jsx';
import HousekeepingPage from './components/pages/Housekeeping.jsx';
import MaintenancePage from './components/pages/Maintenance.jsx';
import StaffKioskPage from './components/pages/StaffKiosk.jsx';
import StaffManagementPage from './components/pages/StaffManagement.jsx';
import StaffSchedulePage from './components/pages/StaffSchedule.jsx';
import StaffClockHistoryPage from './components/pages/StaffClockHistory.jsx';
import FinancialReportsPage from './components/pages/FinancialReports.jsx';
import DailyRoomCostsPage from './components/pages/DailyRoomCosts.jsx';
import AdminControlCenterPage from './components/pages/AdminControlCenter.jsx';

function App() {
  const [page, setPage] = useState('reservations');

  return (
    <div className="container mx-auto p-4">
      <nav className="mb-4 flex flex-wrap gap-2">
        <button
          className={`px-4 py-2 rounded ${page === 'reservations' ? 'bg-primary text-white' : 'bg-gray-200'}`}
          onClick={() => setPage('reservations')}
        >
          Reservations
        </button>
        <button
          className={`px-4 py-2 rounded ${page === 'billing' ? 'bg-primary text-white' : 'bg-gray-200'}`}
          onClick={() => setPage('billing')}
        >
          Billing
        </button>
        <button
          className={`px-4 py-2 rounded ${page === 'guests' ? 'bg-primary text-white' : 'bg-gray-200'}`}
          onClick={() => setPage('guests')}
        >
          Guests
        </button>
        <button
          className={`px-4 py-2 rounded ${page === 'housekeeping' ? 'bg-primary text-white' : 'bg-gray-200'}`}
          onClick={() => setPage('housekeeping')}
        >
          Housekeeping
        </button>
        <button
          className={`px-4 py-2 rounded ${page === 'maintenance' ? 'bg-primary text-white' : 'bg-gray-200'}`}
          onClick={() => setPage('maintenance')}
        >
          Maintenance
        </button>
        <button
          className={`px-4 py-2 rounded ${page === 'staff-kiosk' ? 'bg-primary text-white' : 'bg-gray-200'}`}
          onClick={() => setPage('staff-kiosk')}
        >
          Staff Kiosk
        </button>
        <button
          className={`px-4 py-2 rounded ${page === 'staff-management' ? 'bg-primary text-white' : 'bg-gray-200'}`}
          onClick={() => setPage('staff-management')}
        >
          Staff Management
        </button>
        <button
          className={`px-4 py-2 rounded ${page === 'staff-schedule' ? 'bg-primary text-white' : 'bg-gray-200'}`}
          onClick={() => setPage('staff-schedule')}
        >
          Staff Schedule
        </button>
        <button
          className={`px-4 py-2 rounded ${page === 'staff-clock-history' ? 'bg-primary text-white' : 'bg-gray-200'}`}
          onClick={() => setPage('staff-clock-history')}
        >
          Clock History
        </button>
        <button
          className={`px-4 py-2 rounded ${page === 'financial-reports' ? 'bg-primary text-white' : 'bg-gray-200'}`}
          onClick={() => setPage('financial-reports')}
        >
          Financial Reports
        </button>
        <button
          className={`px-4 py-2 rounded ${page === 'daily-room-costs' ? 'bg-primary text-white' : 'bg-gray-200'}`}
          onClick={() => setPage('daily-room-costs')}
        >
          Daily Room Costs
        </button>
        <button
          className={`px-4 py-2 rounded ${page === 'admin-control-center' ? 'bg-primary text-white' : 'bg-gray-200'}`}
          onClick={() => setPage('admin-control-center')}
        >
          Admin Control Center
        </button>
      </nav>
      {page === 'reservations' && <ReservationsPage />}
      {page === 'billing' && <BillingPage />}
      {page === 'guests' && <GuestsPage />}
      {page === 'housekeeping' && <HousekeepingPage />}
      {page === 'maintenance' && <MaintenancePage />}
      {page === 'staff-kiosk' && <StaffKioskPage />}
      {page === 'staff-management' && <StaffManagementPage />}
      {page === 'staff-schedule' && <StaffSchedulePage />}
      {page === 'staff-clock-history' && <StaffClockHistoryPage />}
      {page === 'financial-reports' && <FinancialReportsPage />}
      {page === 'daily-room-costs' && <DailyRoomCostsPage />}
      {page === 'admin-control-center' && <AdminControlCenterPage />}
    </div>
  )
}

export default App
