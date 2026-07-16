import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Scroll, Terminal, ShieldAlert, KeyRound, Search, Globe, Clock, User } from 'lucide-react';

interface AuditLog {
  id: string;
  action: string;
  user_email: string;
  details: string;
  ip_address: string;
  created_at: string;
}

export const AuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search / Filtering state
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/audit');
      setLogs(res.data || []);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to query system audit database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'USER_REGISTER':
      case 'USER_LOGIN':
        return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{action}</span>;
      case 'CREATE_SECRET':
      case 'UPLOAD_CERTIFICATE':
        return <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{action}</span>;
      case 'REVEAL_SECRET':
        return <span className="bg-amber-500/10 text-amber-400 border border-amber-500/25 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{action}</span>;
      case 'ROTATE_SECRET':
        return <span className="bg-blue-500/10 text-blue-400 border border-blue-500/25 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{action}</span>;
      case 'DELETE_SECRET':
      case 'DELETE_CERTIFICATE':
        return <span className="bg-rose-500/10 text-rose-400 border border-rose-500/25 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{action}</span>;
      default:
        return <span className="bg-slate-500/10 text-slate-400 border border-slate-500/25 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{action}</span>;
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.details.toLowerCase().includes(search.toLowerCase()) || 
                          log.user_email.toLowerCase().includes(search.toLowerCase());
    const matchesAction = filterAction ? log.action === filterAction : true;
    return matchesSearch && matchesAction;
  });

  // Extract unique actions for the filter select list
  const uniqueActions = Array.from(new Set(logs.map(log => log.action)));

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Scroll className="h-6 w-6 text-indigo-400" />
            Audit Ledger
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Tamper-evident system activity log. User actions are append-only.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Search & Filter header bar */}
      <div className="flex flex-col md:flex-row gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            placeholder="Search logs by keyword or operator email..."
          />
        </div>
        <div className="w-full md:w-48">
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-400 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="">All Actions</option>
            {uniqueActions.map(action => (
              <option key={action} value={action}>{action}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table view */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center space-y-4">
          <Scroll className="h-12 w-12 text-slate-600 mx-auto" />
          <h3 className="text-slate-200 font-semibold text-lg">No Log Entries</h3>
          <p className="text-slate-400 text-sm max-w-sm mx-auto">
            Audit logs will be generated and appended here automatically as operators execute actions.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Operator</th>
                <th className="px-6 py-4">Details</th>
                <th className="px-6 py-4">IP Address</th>
                <th className="px-6 py-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30 transition-all">
                  <td className="px-6 py-4">
                    {getActionBadge(log.action)}
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-200">
                    <span className="flex items-center gap-1.5 text-xs">
                      <User className="h-3.5 w-3.5 text-slate-500" />
                      {log.user_email}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-slate-400 max-w-xs truncate" title={log.details}>
                    {log.details}
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Globe className="h-3.5 w-3.5 text-slate-500" />
                      {log.ip_address}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Clock className="h-3.5 w-3.5 text-slate-500" />
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
export default AuditLogs;
