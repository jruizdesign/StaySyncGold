import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarRange,
  Users,
  BedDouble,
  Wrench,
  UserCog,
  CreditCard,
  MonitorPlay,
  Settings,
  LogOut,
  Hotel,
  Menu
} from 'lucide-react';
import { SmartAssistant } from './SmartAssistant';

interface SidebarLinkProps {
  to: string;
  icon: React.ElementType;
  label: string;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ to, icon: Icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname.startsWith(to) && to !== '/' || location.pathname === to;

  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
        ? 'bg-gold-500 text-white shadow-sm'
        : 'text-slate-400 hover:text-white hover:bg-slate-800'
        }`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </Link>
  );
};

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Hide standard layout for Kiosk, Login, and Landing modes including new Digital Services pages
  const publicPaths = ['/kiosk', '/login', '/', '/landing', '/it-security', '/digital-solutions'];
  const isPublicPath = publicPaths.includes(location.pathname) || publicPaths.some(path => path !== '/' && location.pathname.startsWith(path + '/'));

  if (isPublicPath) {
    return <>{children}</>;
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <Hotel className="w-8 h-8 text-gold-500 mr-3" />
          <span className="text-xl font-bold tracking-tight text-white truncate">
            {user?.propertyName || <span>StaySync<span className="text-gold-500">Gold</span></span>}
          </span>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          <SidebarLink to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
          <SidebarLink to="/reservations" icon={CalendarRange} label="Reservations" />
          <SidebarLink to="/guests" icon={Users} label="Guests" />
          <SidebarLink to="/housekeeping" icon={BedDouble} label="Rooms" />
          <SidebarLink to="/maintenance" icon={Wrench} label="Maintenance" />
          <SidebarLink to="/staff" icon={UserCog} label="Staff & Schedule" />
          <SidebarLink to="/financials" icon={CreditCard} label="Daily Overview" />
          <SidebarLink to="/kiosk" icon={MonitorPlay} label="Staff Kiosk Mode" />
          <div className="pt-4 mt-4 border-t border-slate-800">
            <SidebarLink to="/admin" icon={Settings} label="Settings" />
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8">
          <button
            className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex-1 px-4 lg:px-8">
            <h1 className="text-lg lg:text-xl font-semibold text-slate-800 capitalize">
              {location.pathname === '/' ? 'Dashboard' : location.pathname.split('/')[1].replace('-', ' ')}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-col items-end hidden sm:flex">
              <span className="text-sm font-medium text-slate-900">{user?.email || 'Guest User'}</span>
              <span className="text-xs text-slate-500 capitalize">{user?.role || 'Visitor'}</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-gold-100 flex items-center justify-center border-2 border-white shadow-sm">
              <span className="text-gold-700 font-bold text-sm">
                {user?.email?.charAt(0).toUpperCase() || 'G'}
              </span>
            </div>
          </div>
        </header>

        {/* Content Scroll Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}

            <footer className="pt-10 pb-6 text-center">
              <p className="text-sm text-slate-400">
                &copy; {new Date().getFullYear()} StaySync Gold. All rights reserved.
              </p>
            </footer>
          </div>
        </main>
      </div>

      <SmartAssistant />
    </div>
  );
};