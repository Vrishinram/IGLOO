import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Wrench, Wallet, Users, Bell, 
  Shield, ClipboardList, LogOut, ChevronDown, Menu, X, Hexagon
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const Layout = () => {
  const { user, logout, quickLogin } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavLinks = () => {
    if (!user) return [];
    switch (user.role) {
      case 'ADMIN':
        return [
          { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
          { to: '/admin/users', icon: Users, label: 'Users' },
          { to: '/admin/maintenance', icon: Wrench, label: 'Maintenance' },
          { to: '/admin/treasury', icon: Wallet, label: 'Treasury' },
          { to: '/admin/visitors', icon: Users, label: 'Visitors' },
          { to: '/admin/notices', icon: Bell, label: 'Notices' },
        ];
      case 'RESIDENT':
        return [
          { to: '/resident/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
          { to: '/resident/maintenance', icon: Wrench, label: 'Maintenance' },
          { to: '/resident/finances', icon: Wallet, label: 'Finances' },
          { to: '/resident/visitors', icon: Users, label: 'Visitors' },
          { to: '/resident/notices', icon: Bell, label: 'Notices' },
        ];
      case 'SECURITY':
        return [
          { to: '/security/gate', icon: Shield, label: 'Gate Terminal' },
          { to: '/security/walk-in', icon: Users, label: 'Walk-in' },
          { to: '/security/live-log', icon: ClipboardList, label: 'Live Log' },
        ];
      case 'TECHNICIAN':
        return [
          { to: '/technician/tasks', icon: Wrench, label: 'My Tasks' },
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  const roleColors: Record<string, string> = {
    ADMIN: 'bg-emerald-500',
    RESIDENT: 'bg-blue-500',
    SECURITY: 'bg-amber-500',
    TECHNICIAN: 'bg-purple-500'
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row">
      {/* Top Navbar */}
      <nav className="fixed top-0 w-full z-40 bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Hexagon className="w-8 h-8 text-primary-600 fill-primary-600/20" />
          <span className="text-xl font-bold tracking-tight text-slate-900">IGLOO</span>
        </div>

        <div className="flex items-center gap-4">
          {/* User Info Static Display */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 shadow-inner">
            <div className={twMerge("w-2 h-2 rounded-full", user ? roleColors[user.role] : 'bg-slate-400')} />
            <span className="text-xs font-bold text-slate-800 hidden sm:inline-block tracking-tight">
              {user?.name} ({user?.role})
            </span>
          </div>

          <button 
            onClick={handleLogout}
            className="p-2 text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* Sidebar (Desktop) / Bottom Nav (Mobile) */}
      <aside className={twMerge(
        "fixed md:static inset-x-0 bottom-0 md:inset-auto md:w-64 bg-white border-t md:border-t-0 md:border-r border-slate-200 z-30 transition-all pt-16 flex flex-col"
      )}>
        <div className="flex-1 overflow-y-auto py-2 flex flex-row md:flex-col justify-around md:justify-start px-2 md:px-4 gap-1 md:gap-2">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => twMerge(
                "flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-lg text-sm font-bold transition-colors flex-1 md:flex-none justify-center md:justify-start",
                isActive 
                  ? "bg-primary-50 text-primary-700" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <link.icon className="w-5 h-5 md:w-4 md:h-4" />
              <span className="hidden md:block">{link.label}</span>
            </NavLink>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pt-16 pb-16 md:pb-0 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
