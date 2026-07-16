import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, KeyRound, FileSignature, Scan, Scroll, LogOut, User, Building } from 'lucide-react';

export const DashboardLayout = () => {
  const { organizationName, role, userEmail, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', label: 'Overview', icon: Shield },
    { to: '/vault', label: 'Secrets Vault', icon: KeyRound },
    { to: '/certificates', label: 'Certificates', icon: FileSignature },
    { to: '/scanner', label: 'AI Scanner', icon: Scan },
    { to: '/audit-logs', label: 'Audit Logs', icon: Scroll }
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0">
        <div>
          {/* Platform Branding */}
          <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800 bg-slate-900/50">
            <Shield className="h-6 w-6 text-indigo-500 animate-pulse" />
            <span className="font-bold text-lg tracking-wider text-slate-100">
              SecureVault <span className="text-indigo-400">AI</span>
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Tenant and User Metadata Footer */}
        <div className="p-4 border-t border-slate-800 space-y-3 bg-slate-950/40">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Building className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
              <span className="truncate font-semibold text-slate-300" title={organizationName || ''}>
                {organizationName || 'No Tenant'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <User className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span className="truncate text-slate-300" title={userEmail || ''}>
                {userEmail}
              </span>
            </div>
            <div className="mt-1">
              <span className="text-[10px] inline-block bg-slate-800 border border-slate-700 text-slate-300 px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                {role || 'operator'}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Contents view */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header Bar */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/20 flex items-center justify-between px-8 backdrop-blur-md z-10 shrink-0">
          <h2 className="text-lg font-semibold text-slate-200 tracking-wide">
            Enterprise Control Center
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono px-3 py-1 bg-slate-800/80 border border-slate-700 text-indigo-300 rounded-full select-all">
              ID: {localStorage.getItem('organization_id') || 'Null'}
            </span>
          </div>
        </header>

        {/* Dynamic Outlet */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
export default DashboardLayout;
