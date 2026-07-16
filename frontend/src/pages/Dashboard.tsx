import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { KeyRound, ShieldCheck, HelpCircle, Activity, ShieldAlert } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
}

const MetricCard = ({ title, value, description, icon: Icon, color }: MetricCardProps) => (
  <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl hover:border-slate-700 transition-all hover:translate-y-[-2px] flex items-start justify-between">
    <div className="space-y-2">
      <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">{title}</p>
      <h3 className="text-3xl font-extrabold text-slate-100">{value}</h3>
      <p className="text-slate-500 text-xs">{description}</p>
    </div>
    <div className={`p-3 rounded-lg ${color} bg-opacity-10 border border-opacity-20`}>
      <Icon className="h-6 w-6" />
    </div>
  </div>
);

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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Security Overview</h1>
        <p className="text-slate-400 text-sm mt-1">
          Cryptographic posture and tenant compliance reporting.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Active Secrets"
          value={stats.secretsCount}
          description="Symmetrically encrypted credentials"
          icon={KeyRound}
          color="text-indigo-400 bg-indigo-500/10 border-indigo-500"
        />
        <MetricCard
          title="Certificates Tracked"
          value={stats.certsCount}
          description="Domain certificates under management"
          icon={ShieldCheck}
          color="text-emerald-400 bg-emerald-500/10 border-emerald-500"
        />
        <MetricCard
          title="Expired / Expiring"
          value={stats.certsExpiringCount}
          description="Requires rotation or renewal action"
          icon={ShieldAlert}
          color="text-amber-400 bg-amber-500/10 border-amber-500"
        />
        <MetricCard
          title="Audit Trail Entries"
          value={stats.logsCount}
          description="Append-only logs registered"
          icon={Activity}
          color="text-purple-400 bg-purple-500/10 border-purple-500"
        />
      </div>

      {/* Security Health Box */}
      <div className="bg-gradient-to-r from-indigo-900/20 to-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
        <h3 className="font-semibold text-slate-200">Tenant Posture Analysis</h3>
        <p className="text-sm text-slate-400 leading-relaxed max-w-3xl">
          SecureVault AI protects credentials with AES-256 (Fernet) symmetric encryption keys. All access
          is monitored via a append-only, tamper-evident audit ledger. Make sure to run the AI Exposure Scanner
          on raw source code snippets before checking secrets into external registries.
        </p>
        <div className="flex gap-4 text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded">
            Tenant Isolation: Strict
          </span>
          <span className="flex items-center gap-1.5 text-indigo-400 bg-indigo-500/10 border border-indigo-500/25 px-2.5 py-1 rounded">
            At-Rest Encryption: Fernet AES-256
          </span>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
