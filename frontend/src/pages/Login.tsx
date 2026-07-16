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
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      {/* Container */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 space-y-6">
        {/* Brand Logo header */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="p-3 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl">
            <Shield className="h-8 w-8 text-indigo-500 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            SecureVault <span className="text-indigo-400">AI</span>
          </h1>
          <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
            Enterprise Multi-Tenant Secrets & Certificates Platform
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => { setIsLogin(true); setError(''); }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              isLogin ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setError(''); }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              !isLogin ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Create Tenant
          </button>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/25 text-rose-400 px-3 py-2.5 rounded-lg text-xs leading-relaxed text-center">
            {error}
          </div>
        )}

        {/* Auth form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                placeholder="operator@tenant.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Registration fields */}
          {!isLogin && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Organization / Tenant Name</label>
                <div className="relative">
                  <Building className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-500" />
                  <input
                    type="text"
                    required={!isLogin}
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. Acme Corp"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Default Operator Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-400 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="operator">Operator (Read/Write)</option>
                  <option value="admin">Administrator (Full Access)</option>
                  <option value="security_auditor">Security Auditor (Read Only)</option>
                </select>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-all cursor-pointer shadow-[0_4px_20px_rgba(99,102,241,0.35)]"
          >
            {loading ? 'Authenticating...' : isLogin ? 'Access Control Center' : 'Provision Tenant Account'}
          </button>
        </form>
      </div>
    </div>
  );
};
export default Login;
