import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Scroll, Search, Globe, Clock, User } from 'lucide-react';

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
    const base = "px-2 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-widest font-mono border";
    switch (action) {
      case 'USER_REGISTER':
      case 'USER_LOGIN':
        return <span className={`${base} bg-emerald-500/10 text-emerald-400 border-emerald-500/30`}>{action}</span>;
      case 'CREATE_SECRET':
      case 'UPLOAD_CERTIFICATE':
        return <span className={`${base} bg-indigo-500/10 text-indigo-400 border-indigo-500/30`}>{action}</span>;
      case 'REVEAL_SECRET':
        return <span className={`${base} bg-amber-500/10 text-amber-400 border-amber-500/30`}>{action}</span>;
      case 'ROTATE_SECRET':
        return <span className={`${base} bg-blue-500/10 text-blue-400 border-blue-500/30`}>{action}</span>;
      case 'DELETE_SECRET':
      case 'DELETE_CERTIFICATE':
        return <span className={`${base} bg-rose-500/10 text-rose-400 border-rose-500/30`}>{action}</span>;
      default:
        return <span className={`${base} bg-zinc-500/10 text-zinc-400 border-zinc-500/30`}>{action}</span>;
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.details.toLowerCase().includes(search.toLowerCase()) || 
                          log.user_email.toLowerCase().includes(search.toLowerCase());
    const matchesAction = filterAction ? log.action === filterAction : true;
    return matchesSearch && matchesAction;
  });

  const uniqueActions = Array.from(new Set(logs.map(log => log.action)));

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950 px-6 py-2.5 shrink-0">
        <div className="flex items-center gap-3">
          <Scroll className="h-4 w-4 text-zinc-500" />
          <span className="font-mono text-[10px] uppercase tracking-widest font-bold text-zinc-400">
            AUDIT LEDGER
          </span>
          <span className="font-mono text-[10px] text-zinc-600">
            ({filteredLogs.length} ENTRIES)
          </span>
        </div>
        <span className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">
          APPEND-ONLY // TAMPER-EVIDENT
        </span>
      </div>

      {error && (
        <div className="bg-rose-500/10 border-b border-rose-500/30 text-rose-400 px-6 py-2.5 text-[10px] font-mono uppercase tracking-widest">
          {error}
        </div>
      )}

      {/* Search & Filter bar */}
      <div className="flex items-center gap-4 border-b border-zinc-800 bg-zinc-950/50 px-6 py-2.5 shrink-0">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-zinc-600" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black border border-zinc-800 rounded-none pl-9 pr-3 py-1.5 text-[11px] font-mono text-zinc-300 focus:outline-none focus:border-zinc-600 tracking-wider"
            placeholder="SEARCH BY KEYWORD OR OPERATOR EMAIL..."
          />
        </div>
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="bg-black border border-zinc-800 rounded-none px-3 py-1.5 text-[11px] font-mono text-zinc-400 focus:outline-none focus:border-zinc-600 cursor-pointer tracking-wider w-48"
        >
          <option value="">ALL ACTIONS</option>
          {uniqueActions.map(action => (
            <option key={action} value={action}>{action}</option>
          ))}
        </select>
      </div>

      {/* Table view */}
      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <span className="font-mono text-xs text-zinc-500 uppercase tracking-widest animate-pulse">QUERYING LEDGER...</span>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3">
          <Scroll className="h-8 w-8 text-zinc-700" />
          <h3 className="text-zinc-300 font-bold font-mono text-xs uppercase tracking-widest">NO LOG ENTRIES</h3>
          <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-widest max-w-sm">
            Audit logs will be generated and appended automatically as operators execute actions.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <table className="table-auto w-full text-left font-mono text-xs divide-y divide-zinc-800 border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-zinc-950 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                <th className="px-6 py-3 border-b border-zinc-800">ACTION</th>
                <th className="px-6 py-3 border-b border-zinc-800">OPERATOR</th>
                <th className="px-6 py-3 border-b border-zinc-800">DETAILS</th>
                <th className="px-6 py-3 border-b border-zinc-800">IP ADDRESS</th>
                <th className="px-6 py-3 border-b border-zinc-800">TIMESTAMP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-zinc-900/50 transition-colors">
                  <td className="px-6 py-3">
                    {getActionBadge(log.action)}
                  </td>
                  <td className="px-6 py-3 font-bold text-zinc-200">
                    <span className="flex items-center gap-1.5 text-[11px]">
                      <User className="h-3 w-3 text-zinc-600" />
                      {log.user_email}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-[11px] text-zinc-400 max-w-xs truncate" title={log.details}>
                    {log.details}
                  </td>
                  <td className="px-6 py-3">
                    <span className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                      <Globe className="h-3 w-3 text-zinc-600" />
                      {log.ip_address}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span className="flex items-center gap-1.5 text-[11px] text-zinc-600">
                      <Clock className="h-3 w-3 text-zinc-700" />
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
