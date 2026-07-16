import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Shield, KeyRound, Building, User, Lock, Mail } from 'lucide-react';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [role, setRole] = useState('operator');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Sign In
        const res = await api.post('/auth/login', { email, password });
        const { access_token, user_email, organization_id, organization_name, role: userRole } = res.data;
        login(access_token, user_email, organization_id, organization_name, userRole);
      } else {
        // Sign Up / Register
        const res = await api.post('/auth/register', {
          email,
          password,
          organization_name: orgName,
          role
        });
        const { access_token, user_email, organization_id, organization_name, role: userRole } = res.data;
        login(access_token, user_email, organization_id, organization_name, userRole);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Subtle background glow effect (optional for cyber feel) */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-[150px] pointer-events-none"></div>

      {/* Container */}
      <div className="w-full max-w-md bg-zinc-900/50 backdrop-blur-md border border-zinc-800/80 p-8 space-y-6 z-10 rounded-sm">
        {/* Brand Logo header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="p-3 bg-zinc-950 border border-zinc-800/80 rounded-sm shadow-inner">
            <Shield className="h-8 w-8 text-zinc-100" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            SecureVault <span className="text-zinc-500 font-mono text-sm ml-1">AI</span>
          </h1>
          <p className="text-xs font-mono text-zinc-500 max-w-xs leading-relaxed uppercase tracking-wider">
            Enterprise Zero-Trust Platform
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-zinc-950 p-1 rounded-sm border border-zinc-800/80">
          <button
            type="button"
            onClick={() => { setIsLogin(true); setError(''); }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-sm transition-colors cursor-pointer ${
              isLogin ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setError(''); }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-sm transition-colors cursor-pointer ${
              !isLogin ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Create Tenant
          </button>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-3 py-2.5 rounded-sm text-xs leading-relaxed text-center font-mono">
            {error}
          </div>
        )}

        {/* Auth form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-600" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800/80 rounded-sm pl-10 pr-3 py-2 text-sm font-mono text-zinc-300 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-colors"
                placeholder="operator@tenant.com"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-600" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800/80 rounded-sm pl-10 pr-3 py-2 text-sm font-mono text-zinc-300 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Registration fields */}
          {!isLogin && (
            <>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider">Organization / Tenant Name</label>
                <div className="relative">
                  <Building className="absolute left-3 top-2.5 h-4 w-4 text-zinc-600" />
                  <input
                    type="text"
                    required={!isLogin}
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800/80 rounded-sm pl-10 pr-3 py-2 text-sm font-mono text-zinc-300 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-colors"
                    placeholder="e.g. Acme Corp"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider">Default Operator Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800/80 rounded-sm px-3 py-2 text-sm font-mono text-zinc-400 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 cursor-pointer transition-colors"
                >
                  <option value="operator">Operator (Read/Write)</option>
                  <option value="admin">Administrator (Full Access)</option>
                  <option value="security_auditor">Security Auditor (Read Only)</option>
                </select>
              </div>
            </>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-2.5 bg-white hover:bg-zinc-200 disabled:opacity-50 text-zinc-950 rounded-sm text-sm font-bold transition-colors cursor-pointer"
            >
              {loading ? 'Authenticating...' : isLogin ? 'Access Control Center' : 'Provision Tenant Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default Login;
