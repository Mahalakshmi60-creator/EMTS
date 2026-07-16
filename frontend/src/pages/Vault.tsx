import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { KeyRound, Eye, EyeOff, Trash2, RotateCw, Plus, X, Lock, FileText } from 'lucide-react';

interface Secret {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export const Vault = () => {
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modals / forms state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newDesc, setNewDesc] = useState('');
  
  // Reveal state mapping secret ID -> decrypted value
  const [revealedSecrets, setRevealedSecrets] = useState<Record<string, string>>({});
  const [revealLoading, setRevealLoading] = useState<Record<string, boolean>>({});

  // Rotation state mapping secret ID -> new value
  const [isRotateOpen, setIsRotateOpen] = useState(false);
  const [activeRotateSecret, setActiveRotateSecret] = useState<Secret | null>(null);
  const [rotateValue, setRotateValue] = useState('');

  const fetchSecrets = async () => {
    try {
      setLoading(true);
      const res = await api.get('/vault');
      setSecrets(res.data || []);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to query credentials database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecrets();
  }, []);

  const handleAddSecret = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newValue) return;
    try {
      await api.post('/vault', {
        name: newName,
        value: newValue,
        description: newDesc
      });
      setNewName('');
      setNewValue('');
      setNewDesc('');
      setIsAddOpen(false);
      fetchSecrets();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Secret insertion failed');
    }
  };

  const handleReveal = async (secretId: string) => {
    // If already revealed, toggle to hide it
    if (revealedSecrets[secretId]) {
      const updated = { ...revealedSecrets };
      delete updated[secretId];
      setRevealedSecrets(updated);
      return;
    }

    try {
      setRevealLoading(prev => ({ ...prev, [secretId]: true }));
      const res = await api.get(`/vault/${secretId}/reveal`);
      setRevealedSecrets(prev => ({ ...prev, [secretId]: res.data.value }));
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Decryption failed or unauthorized');
    } finally {
      setRevealLoading(prev => ({ ...prev, [secretId]: false }));
    }
  };

  const handleOpenRotate = (secret: Secret) => {
    setActiveRotateSecret(secret);
    setRotateValue('');
    setIsRotateOpen(true);
  };

  const handleRotateSecret = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRotateSecret || !rotateValue) return;
    try {
      await api.put(`/vault/${activeRotateSecret.id}/rotate`, {
        value: rotateValue
      });
      setIsRotateOpen(false);
      setActiveRotateSecret(null);
      setRotateValue('');
      // Invalidate revealed state for safety
      const updated = { ...revealedSecrets };
      delete updated[activeRotateSecret.id];
      setRevealedSecrets(updated);
      fetchSecrets();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Rotation attempt rejected');
    }
  };

  const handleDelete = async (secretId: string) => {
    if (!confirm('Are you sure you want to permanently delete this secret?')) return;
    try {
      await api.delete(`/vault/${secretId}`);
      fetchSecrets();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Deletion failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action block */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Secrets Vault</h1>
          <p className="text-slate-400 text-sm mt-1">
            Store, retrieve, and rotate symmetric credential assets safely.
          </p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-all cursor-pointer shadow-[0_4px_20px_rgba(99,102,241,0.3)]"
        >
          <Plus className="h-4.5 w-4.5" />
          Add Secret
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Main Table view */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
        </div>
      ) : secrets.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center space-y-4">
          <Lock className="h-12 w-12 text-slate-600 mx-auto" />
          <h3 className="text-slate-200 font-semibold text-lg">No Secrets Found</h3>
          <p className="text-slate-400 text-sm max-w-sm mx-auto">
            Get started by inserting your first encrypted credential asset into the zero-plaintext vault.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Secret Value</th>
                <th className="px-6 py-4">Created At</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {secrets.map((secret) => {
                const isRevealed = !!revealedSecrets[secret.id];
                const decryptedValue = revealedSecrets[secret.id] || '';
                const isRevealing = !!revealLoading[secret.id];

                return (
                  <tr key={secret.id} className="hover:bg-slate-800/30 text-slate-300 text-sm transition-all">
                    <td className="px-6 py-4 font-semibold text-slate-100 flex items-center gap-2">
                      <KeyRound className="h-4 w-4 text-indigo-400" />
                      {secret.name}
                    </td>
                    <td className="px-6 py-4 text-slate-400 max-w-[200px] truncate" title={secret.description}>
                      {secret.description || 'No description'}
                    </td>
                    <td className="px-6 py-4 font-mono">
                      {isRevealed ? (
                        <span className="text-emerald-400 select-all bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                          {decryptedValue}
                        </span>
                      ) : (
                        <span className="text-slate-500 tracking-widest">••••••••••••••••</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {new Date(secret.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleReveal(secret.id)}
                        disabled={isRevealing}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 text-xs font-semibold border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
                        title="Decrypt and reveal"
                      >
                        {isRevealing ? (
                          <div className="animate-spin h-3.5 w-3.5 border-t border-slate-300 rounded-full" />
                        ) : isRevealed ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                        {isRevealed ? 'Hide' : 'Reveal'}
                      </button>
                      <button
                        onClick={() => handleOpenRotate(secret)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
                        title="Rotate / update value"
                      >
                        <RotateCw className="h-3.5 w-3.5" />
                        Rotate
                      </button>
                      <button
                        onClick={() => handleDelete(secret.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold transition-all cursor-pointer"
                        title="Delete record"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Secret Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/60">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-xl shadow-2xl p-6 relative">
            <button
              onClick={() => setIsAddOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
              <Lock className="h-5 w-5 text-indigo-400" />
              Add Vault Credentials
            </h3>
            <form onSubmit={handleAddSecret} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Secret Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. AWS_STRIPE_KEY"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Value (Symmetrically Encrypted)</label>
                <input
                  type="password"
                  required
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  placeholder="Paste plaintext secret value"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Description</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  placeholder="Describe where this credential is used"
                  rows={3}
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-all cursor-pointer"
              >
                Encrypt & Save in Vault
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Rotate Secret Modal */}
      {isRotateOpen && activeRotateSecret && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/60">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-xl shadow-2xl p-6 relative">
            <button
              onClick={() => {
                setIsRotateOpen(false);
                setActiveRotateSecret(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-100 mb-2 flex items-center gap-2">
              <RotateCw className="h-5 w-5 text-indigo-400" />
              Rotate Secret Value
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Rotating secret: <span className="font-mono text-indigo-300 font-semibold">{activeRotateSecret.name}</span>
            </p>
            <form onSubmit={handleRotateSecret} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">New Secret Value</label>
                <input
                  type="password"
                  required
                  value={rotateValue}
                  onChange={(e) => setRotateValue(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  placeholder="Paste new plaintext value"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-all cursor-pointer"
              >
                Encrypt & Update Value
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Vault;
