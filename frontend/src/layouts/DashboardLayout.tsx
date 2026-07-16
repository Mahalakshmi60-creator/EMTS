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
    <div className="flex h-screen bg-zinc-950 text-zinc-300 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col justify-between shrink-0 z-20">
        <div>
          {/* Platform Branding */}
          <div className="h-[3.25rem] flex items-center gap-3 px-6 border-b border-zinc-800 bg-zinc-950">
            <Shield className="h-5 w-5 text-zinc-100" />
            <span className="font-bold text-base tracking-wider text-zinc-100 uppercase">
              SecureVault <span className="text-zinc-500 font-mono text-[10px] ml-1 tracking-widest">AI</span>
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col border-b border-zinc-800">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-6 py-3 rounded-none text-xs font-mono tracking-widest uppercase transition-colors border-b border-zinc-800 last:border-b-0 ${
                    isActive
                      ? 'bg-zinc-900 text-white border-l-2 border-l-emerald-500'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50 border-l-2 border-l-transparent'
                  }`
                }
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Tenant and User Metadata Footer */}
        <div className="p-4 border-t border-zinc-800 space-y-4 bg-zinc-950">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[10px] uppercase font-mono text-zinc-500 tracking-widest">
              <Building className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
              <span className="truncate font-bold text-zinc-300" title={organizationName || ''}>
                {organizationName || 'NO_TENANT'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] uppercase font-mono text-zinc-500 tracking-widest">
              <User className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
              <span className="truncate text-zinc-400" title={userEmail || ''}>
                {userEmail}
              </span>
            </div>
            <div className="mt-2">
              <span className="text-[10px] inline-block bg-zinc-900 border border-zinc-800 text-zinc-500 px-2 py-0.5 rounded-none font-mono uppercase tracking-widest font-bold">
                ROLE: {role || 'OPERATOR'}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-none text-xs font-bold font-mono tracking-widest uppercase text-zinc-950 bg-white hover:bg-zinc-200 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            SIGN OUT
          </button>
        </div>
      </aside>

      {/* Main Contents view */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header Bar */}
        <header className="h-[3.25rem] border-b border-zinc-800 bg-zinc-950 flex items-center justify-between px-6 z-10 shrink-0">
          <h2 className="text-[10px] uppercase font-mono tracking-widest font-bold text-zinc-500">
            ENTERPRISE CONTROL CENTER
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono px-3 py-1 bg-zinc-900 border border-zinc-800 text-zinc-500 font-bold uppercase tracking-widest rounded-none select-all">
              TENANT ID: {localStorage.getItem('organization_id') || 'Null'}
            </span>
          </div>
        </header>

        {/* Dynamic Outlet */}
        <main className="flex-1 overflow-y-auto bg-black relative z-0 p-0 m-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
export default DashboardLayout;
