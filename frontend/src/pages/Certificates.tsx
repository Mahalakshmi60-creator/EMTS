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

  // Master-detail selection
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

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
      if (selectedCert?.id === certId) setSelectedCert(null);
      fetchCerts();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Deletion failed');
    }
  };

  const getStatusBadge = (status: Certificate['status']) => {
    const base = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-none text-[10px] font-bold font-mono uppercase tracking-widest border";
    switch (status) {
      case 'active':
        return (
          <span className={`${base} bg-emerald-500/10 border-emerald-500/30 text-emerald-400`}>
            <ShieldCheck className="h-3 w-3" />
            ACTIVE
          </span>
        );
      case 'expiring_soon':
        return (
          <span className={`${base} bg-amber-500/10 border-amber-500/30 text-amber-400`}>
            <AlertTriangle className="h-3 w-3" />
            EXPIRING
          </span>
        );
      case 'expired':
        return (
          <span className={`${base} bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse`}>
            <ShieldAlert className="h-3 w-3" />
            EXPIRED
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Top action bar */}
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950 px-6 py-2.5 shrink-0">
        <div className="flex items-center gap-3">
          <Award className="h-4 w-4 text-zinc-500" />
          <span className="font-mono text-[10px] uppercase tracking-widest font-bold text-zinc-400">
            CERTIFICATES MONITOR
          </span>
          <span className="font-mono text-[10px] text-zinc-600">
            ({certs.length} TRACKED)
          </span>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 px-4 py-1.5 bg-white hover:bg-zinc-200 text-zinc-950 rounded-none text-[10px] font-bold font-mono uppercase tracking-widest transition-colors cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          REGISTER CERT
        </button>
      </div>

      {error && (
        <div className="bg-rose-500/10 border-b border-rose-500/30 text-rose-400 px-6 py-2.5 text-[10px] font-mono uppercase tracking-widest">
          {error}
        </div>
      )}

      {/* Main split-screen layout */}
      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <span className="font-mono text-xs text-zinc-500 uppercase tracking-widest animate-pulse">LOADING REGISTRY...</span>
        </div>
      ) : certs.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3">
          <Award className="h-8 w-8 text-zinc-700" />
          <h3 className="text-zinc-300 font-bold font-mono text-xs uppercase tracking-widest">NO CERTIFICATES TRACKED</h3>
          <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-widest max-w-sm">
            Input a TLS domain profile and certificate metadata to start scanning for expiration events.
          </p>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-12 gap-0 min-h-0 overflow-hidden">
          {/* Left Pane — Certificate List */}
          <div className="col-span-5 border-r border-zinc-800 bg-zinc-950/40 overflow-y-auto">
            <div className="divide-y divide-zinc-800/60">
              {certs.map((cert) => {
                const isActive = selectedCert?.id === cert.id;
                return (
                  <button
                    key={cert.id}
                    onClick={() => setSelectedCert(cert)}
                    className={`w-full text-left px-5 py-3.5 transition-colors cursor-pointer flex items-center gap-3 rounded-none ${
                      isActive
                        ? 'border-l-2 border-l-emerald-500 bg-zinc-900/80 text-white'
                        : 'border-l-2 border-l-transparent text-zinc-400 hover:bg-zinc-900/40 hover:text-zinc-200'
                    }`}
                  >
                    <Award className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-emerald-500' : 'text-zinc-600'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-xs font-bold truncate">{cert.domain_name}</div>
                      <div className="font-mono text-[10px] text-zinc-600 truncate mt-0.5">
                        {cert.issuer}
                      </div>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      {getStatusBadge(cert.status)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Pane — Inspection Panel */}
          <div className="col-span-7 bg-[#0a0c10] overflow-y-auto flex flex-col">
            {selectedCert ? (
              <div className="flex flex-col h-full">
                {/* Panel header */}
                <div className="border-b border-zinc-800 px-6 py-3 bg-zinc-950/50 flex items-center justify-between shrink-0">
                  <span className="font-mono text-[10px] uppercase tracking-widest font-bold text-zinc-500">
                    INSPECTION // {selectedCert.domain_name}
                  </span>
                  <span className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">
                    {selectedCert.id}
                  </span>
                </div>

                {/* Metadata fields */}
                <div className="flex-1 p-6 space-y-4 font-mono text-xs overflow-y-auto">
                  <div className="space-y-3">
                    <div className="border border-zinc-800 rounded-none">
                      <div className="px-4 py-2 bg-zinc-950 border-b border-zinc-800 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                        DOMAIN NAME
                      </div>
                      <div className="px-4 py-3 text-zinc-200 font-bold">{selectedCert.domain_name}</div>
                    </div>

                    <div className="border border-zinc-800 rounded-none">
                      <div className="px-4 py-2 bg-zinc-950 border-b border-zinc-800 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                        ISSUER CA
                      </div>
                      <div className="px-4 py-3 text-zinc-400">{selectedCert.issuer}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="border border-zinc-800 rounded-none">
                        <div className="px-4 py-2 bg-zinc-950 border-b border-zinc-800 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                          EXPIRY DATE
                        </div>
                        <div className="px-4 py-3 text-zinc-300 flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                          {new Date(selectedCert.expiry_date).toLocaleString()}
                        </div>
                      </div>
                      <div className="border border-zinc-800 rounded-none">
                        <div className="px-4 py-2 bg-zinc-950 border-b border-zinc-800 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                          STATUS
                        </div>
                        <div className="px-4 py-3">{getStatusBadge(selectedCert.status)}</div>
                      </div>
                    </div>

                    <div className="border border-zinc-800 rounded-none">
                      <div className="px-4 py-2 bg-zinc-950 border-b border-zinc-800 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                        REGISTERED
                      </div>
                      <div className="px-4 py-3 text-zinc-400">{new Date(selectedCert.created_at).toLocaleString()}</div>
                    </div>

                    <div className="border border-zinc-800 rounded-none">
                      <div className="px-4 py-2 bg-zinc-950 border-b border-zinc-800 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                        RESOURCE ID
                      </div>
                      <div className="px-4 py-3 text-zinc-500 select-all">{selectedCert.id}</div>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="border-t border-zinc-800 px-6 py-4 bg-zinc-950/50 flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => handleDelete(selectedCert.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold uppercase tracking-widest font-mono transition-colors cursor-pointer rounded-none ml-auto"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    REVOKE CERTIFICATE
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 p-6">
                <Award className="h-8 w-8 text-zinc-800" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-600 font-bold">
                  SELECT A CERTIFICATE TO INSPECT
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Certificate Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-lg rounded-none shadow-2xl relative">
            <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-800 bg-zinc-900/50">
              <h3 className="font-mono text-[10px] font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-2">
                <Award className="h-3.5 w-3.5 text-white" />
                REGISTER TLS CERTIFICATE
              </h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAddCert} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Domain Name</label>
                  <input
                    type="text"
                    required
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-none px-3 py-2 text-sm font-mono text-zinc-300 focus:outline-none focus:border-zinc-600"
                    placeholder="e.g. secure.acme.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Issuer CA</label>
                  <input
                    type="text"
                    required
                    value={issuer}
                    onChange={(e) => setIssuer(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-none px-3 py-2 text-sm font-mono text-zinc-300 focus:outline-none focus:border-zinc-600"
                    placeholder="e.g. Let's Encrypt"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Expiration Date</label>
                <input
                  type="datetime-local"
                  required
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-none px-3 py-2 text-sm font-mono text-zinc-300 focus:outline-none focus:border-zinc-600"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">PEM Format Chain Certificate</label>
                <textarea
                  required
                  value={pem}
                  onChange={(e) => setPem(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-none px-3 py-2 text-[10px] font-mono text-zinc-400 focus:outline-none focus:border-zinc-600 leading-relaxed"
                  placeholder="-----BEGIN CERTIFICATE-----\n..."
                  rows={6}
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-white hover:bg-zinc-200 text-zinc-950 rounded-none text-[10px] font-bold font-mono uppercase tracking-widest transition-colors cursor-pointer mt-2"
              >
                REGISTER & TRACK CERTIFICATE
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Certificates;
