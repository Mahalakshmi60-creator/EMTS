import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { ShieldCheck, Plus, X, Trash2, Calendar, Award, AlertTriangle, ShieldAlert } from 'lucide-react';

interface Certificate {
  id: string;
  domain_name: string;
  issuer: string;
  expiry_date: string;
  status: 'active' | 'expiring_soon' | 'expired';
  created_at: string;
}

export const Certificates = () => {
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Add modal state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [domain, setDomain] = useState('');
  const [issuer, setIssuer] = useState('');
  const [expiry, setExpiry] = useState('');
  const [pem, setPem] = useState('');

  const fetchCerts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/certificates');
      setCerts(res.data || []);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to query certificate registry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCerts();
  }, []);

  const handleAddCert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain || !issuer || !expiry || !pem) return;
    try {
      // Ensure date is correctly formatted as ISO string
      const isoExpiry = new Date(expiry).toISOString();
      await api.post('/certificates', {
        domain_name: domain,
        issuer: issuer,
        expiry_date: isoExpiry,
        pem_content: pem
      });
      setDomain('');
      setIssuer('');
      setExpiry('');
      setPem('');
      setIsAddOpen(false);
      fetchCerts();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Certificate registration failed');
    }
  };

  const handleDelete = async (certId: string) => {
    if (!confirm('Are you sure you want to delete this certificate record?')) return;
    try {
      await api.delete(`/certificates/${certId}`);
      fetchCerts();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Deletion failed');
    }
  };

  const getStatusBadge = (status: Certificate['status']) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
            <ShieldCheck className="h-3 w-3" />
            Active
          </span>
        );
      case 'expiring_soon':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/25 text-amber-400">
            <AlertTriangle className="h-3 w-3" />
            Expiring Soon
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 border border-rose-500/25 text-rose-400 animate-pulse">
            <ShieldAlert className="h-3 w-3" />
            Expired
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Head section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Certificates Monitor</h1>
          <p className="text-slate-400 text-sm mt-1">
            Track SSL/TLS keys, monitor domain expirations, and secure public assets.
          </p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-all cursor-pointer shadow-[0_4px_20px_rgba(99,102,241,0.3)]"
        >
          <Plus className="h-4.5 w-4.5" />
          Add Certificate
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Main Grid View */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
        </div>
      ) : certs.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center space-y-4">
          <Award className="h-12 w-12 text-slate-600 mx-auto" />
          <h3 className="text-slate-200 font-semibold text-lg">No Certificates Tracked</h3>
          <p className="text-slate-400 text-sm max-w-sm mx-auto">
            Input a TLS domain profile and certificate metadata to start scanning for expiration events.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="px-6 py-4">Domain Name</th>
                <th className="px-6 py-4">Issuer CA</th>
                <th className="px-6 py-4">Expiration Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {certs.map((cert) => (
                <tr key={cert.id} className="hover:bg-slate-800/30 text-slate-300 text-sm transition-all">
                  <td className="px-6 py-4 font-semibold text-slate-100 flex items-center gap-2">
                    <Award className="h-4 w-4 text-indigo-400" />
                    {cert.domain_name}
                  </td>
                  <td className="px-6 py-4 text-slate-400">
                    {cert.issuer}
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-2 text-xs">
                      <Calendar className="h-3.5 w-3.5 text-slate-500" />
                      {new Date(cert.expiry_date).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(cert.status)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(cert.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold transition-all cursor-pointer"
                      title="Remove domain profile"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Certificate Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/60">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-xl shadow-2xl p-6 relative">
            <button
              onClick={() => setIsAddOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
              <Award className="h-5 w-5 text-indigo-400" />
              Register TLS Certificate
            </h3>
            <form onSubmit={handleAddCert} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Domain Name</label>
                  <input
                    type="text"
                    required
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. secure.acme.com"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Issuer CA</label>
                  <input
                    type="text"
                    required
                    value={issuer}
                    onChange={(e) => setIssuer(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. Let's Encrypt"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Expiration Date</label>
                <input
                  type="datetime-local"
                  required
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">PEM Format Chain Certificate</label>
                <textarea
                  required
                  value={pem}
                  onChange={(e) => setPem(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-400 focus:outline-none focus:border-indigo-500"
                  placeholder="-----BEGIN CERTIFICATE-----\n..."
                  rows={6}
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-all cursor-pointer"
              >
                Register & Track Certificate
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Certificates;
