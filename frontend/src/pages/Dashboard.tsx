import React, { useEffect, useState } from 'react';
import api from '../services/api';

export const Dashboard = () => {
  const [stats, setStats] = useState({
    secretsCount: 0,
    certsCount: 0,
    certsExpiringCount: 0,
    logsCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [secretsRes, certsRes, logsRes] = await Promise.all([
          api.get('/vault'),
          api.get('/certificates'),
          api.get('/audit')
        ]);
        
        const certs = certsRes.data || [];
        const expiringCerts = certs.filter((c: any) => c.status === 'expiring_soon' || c.status === 'expired').length;

        setStats({
          secretsCount: (secretsRes.data || []).length,
          certsCount: certs.length,
          certsExpiringCount: expiringCerts,
          logsCount: (logsRes.data || []).length
        });
      } catch (err) {
        console.error("Failed to load dashboard metrics", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <div className="animate-spin rounded-none h-4 w-4 border-2 border-zinc-500 border-t-transparent"></div>
        <span className="ml-3 font-mono text-xs text-zinc-500 uppercase tracking-widest">INITIALIZING TELEMETRY...</span>
      </div>
    );
  }

  const tenantId = localStorage.getItem('organization_id') || 'UNKNOWN';

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Top Telemetry Bar */}
      <div className="flex items-center border-b border-zinc-800 bg-zinc-950/80 px-6 py-3 font-mono text-xs text-zinc-400 divide-x divide-zinc-800 tracking-wider">
        <div className="px-4 first:pl-0 flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-none animate-pulse"></span>
          <span className="text-zinc-100 font-bold">STATUS: ACTIVE</span>
        </div>
        <div className="px-4">
          <span className="text-zinc-500">VAULT SECRETS: </span>
          <span className="text-zinc-100 font-bold">{stats.secretsCount}</span>
        </div>
        <div className="px-4">
          <span className="text-zinc-500">CERTS TRACKED: </span>
          <span className="text-zinc-100 font-bold">{stats.certsCount}</span>
        </div>
        <div className="px-4">
          <span className="text-zinc-500">EXPIRING/EXPIRED: </span>
          <span className={`font-bold ${stats.certsExpiringCount > 0 ? 'text-amber-500' : 'text-zinc-100'}`}>
            {stats.certsExpiringCount}
          </span>
        </div>
        <div className="px-4">
          <span className="text-zinc-500">AUDIT LOGS: </span>
          <span className="text-zinc-100 font-bold">{stats.logsCount}</span>
        </div>
        <div className="px-4 last:pr-0">
          <span className="text-zinc-500">RLS TENANT: </span>
          <span className="text-zinc-300 font-bold">{tenantId}</span>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 p-6">
        {/* Security Health Box */}
        <div className="bg-zinc-950 border border-zinc-800 p-6 space-y-4 rounded-none">
          <h3 className="font-bold font-mono text-zinc-100 uppercase tracking-widest text-xs border-b border-zinc-800 pb-2">Tenant Posture Analysis</h3>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-3xl font-mono">
            SecureVault AI protects credentials with AES-256 (Fernet) symmetric encryption keys. All access
            is monitored via an append-only, tamper-evident audit ledger. Make sure to run the AI Exposure Scanner
            on raw source code snippets before checking secrets into external registries.
          </p>
          <div className="flex gap-4 text-[10px] font-mono font-bold tracking-widest pt-2">
            <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 uppercase rounded-none">
              Tenant Isolation: Strict
            </span>
            <span className="flex items-center gap-1.5 text-zinc-300 bg-zinc-900 border border-zinc-700 px-3 py-1.5 uppercase rounded-none">
              At-Rest Encryption: AES-256
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
