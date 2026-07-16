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

  // Master-detail selection
  const [selectedSecret, setSelectedSecret] = useState<Secret | null>(null);

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
      if (selectedSecret?.id === secretId) setSelectedSecret(null);
      fetchSecrets();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Deletion failed');
    }
  };

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Top action bar */}
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950 px-6 py-2.5 shrink-0">
        <div className="flex items-center gap-3">
          <KeyRound className="h-4 w-4 text-zinc-500" />
          <span className="font-mono text-[10px] uppercase tracking-widest font-bold text-zinc-400">
            SECRETS VAULT
          </span>
          <span className="font-mono text-[10px] text-zinc-600">
            ({secrets.length} ENTRIES)
          </span>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 px-4 py-1.5 bg-white hover:bg-zinc-200 text-zinc-950 rounded-none text-[10px] font-bold font-mono uppercase tracking-widest transition-colors cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          INSERT SECRET
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
          <span className="font-mono text-xs text-zinc-500 uppercase tracking-widest animate-pulse">DECRYPTING INDEX...</span>
        </div>
      ) : secrets.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3">
          <Lock className="h-8 w-8 text-zinc-700" />
          <h3 className="text-zinc-300 font-bold font-mono text-xs uppercase tracking-widest">NO SECRETS FOUND</h3>
          <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-widest max-w-sm">
            Insert your first encrypted credential asset into the zero-plaintext vault.
          </p>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-12 gap-0 min-h-0 overflow-hidden">
          {/* Left Pane — Secret List */}
          <div className="col-span-5 border-r border-zinc-800 bg-zinc-950/40 overflow-y-auto">
            <div className="divide-y divide-zinc-800/60">
              {secrets.map((secret) => {
                const isActive = selectedSecret?.id === secret.id;
                return (
                  <button
                    key={secret.id}
                    onClick={() => setSelectedSecret(secret)}
                    className={`w-full text-left px-5 py-3.5 transition-colors cursor-pointer flex items-center gap-3 rounded-none ${
                      isActive
                        ? 'border-l-2 border-l-emerald-500 bg-zinc-900/80 text-white'
                        : 'border-l-2 border-l-transparent text-zinc-400 hover:bg-zinc-900/40 hover:text-zinc-200'
                    }`}
                  >
                    <KeyRound className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-emerald-500' : 'text-zinc-600'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-xs font-bold truncate">{secret.name}</div>
                      <div className="font-mono text-[10px] text-zinc-600 truncate mt-0.5">
                        {secret.description || 'No description'}
                      </div>
                    </div>
                    <span className="font-mono text-[10px] text-zinc-600 shrink-0">
                      {new Date(secret.created_at).toLocaleDateString()}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Pane — Inspection Panel */}
          <div className="col-span-7 bg-[#0a0c10] overflow-y-auto flex flex-col">
            {selectedSecret ? (
              <div className="flex flex-col h-full">
                {/* Panel header */}
                <div className="border-b border-zinc-800 px-6 py-3 bg-zinc-950/50 flex items-center justify-between shrink-0">
                  <span className="font-mono text-[10px] uppercase tracking-widest font-bold text-zinc-500">
                    INSPECTION // {selectedSecret.name}
                  </span>
                  <span className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">
                    {selectedSecret.id}
                  </span>
                </div>

                {/* Metadata fields */}
                <div className="flex-1 p-6 space-y-4 font-mono text-xs overflow-y-auto">
                  <div className="space-y-3">
                    <div className="border border-zinc-800 rounded-none">
                      <div className="px-4 py-2 bg-zinc-950 border-b border-zinc-800 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                        SECRET NAME
                      </div>
                      <div className="px-4 py-3 text-zinc-200 font-bold">{selectedSecret.name}</div>
                    </div>

                    <div className="border border-zinc-800 rounded-none">
                      <div className="px-4 py-2 bg-zinc-950 border-b border-zinc-800 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                        DESCRIPTION
                      </div>
                      <div className="px-4 py-3 text-zinc-400">{selectedSecret.description || 'No description provided'}</div>
                    </div>

                    <div className="border border-zinc-800 rounded-none">
                      <div className="px-4 py-2 bg-zinc-950 border-b border-zinc-800 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                        CIPHERTEXT VALUE
                      </div>
                      <div className="px-4 py-3">
                        {revealedSecrets[selectedSecret.id] ? (
                          <span className="text-emerald-400 select-all bg-emerald-500/10 px-2 py-1 border border-emerald-500/30 break-all">
                            {revealedSecrets[selectedSecret.id]}
                          </span>
                        ) : (
                          <span className="text-zinc-600 tracking-[0.3em]">•••••••••••••••••••••••••</span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="border border-zinc-800 rounded-none">
                        <div className="px-4 py-2 bg-zinc-950 border-b border-zinc-800 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                          CREATED
                        </div>
                        <div className="px-4 py-3 text-zinc-400">{new Date(selectedSecret.created_at).toLocaleString()}</div>
                      </div>
                      <div className="border border-zinc-800 rounded-none">
                        <div className="px-4 py-2 bg-zinc-950 border-b border-zinc-800 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                          LAST MODIFIED
                        </div>
                        <div className="px-4 py-3 text-zinc-400">{new Date(selectedSecret.updated_at).toLocaleString()}</div>
                      </div>
                    </div>

                    <div className="border border-zinc-800 rounded-none">
                      <div className="px-4 py-2 bg-zinc-950 border-b border-zinc-800 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                        RESOURCE ID
                      </div>
                      <div className="px-4 py-3 text-zinc-500 select-all">{selectedSecret.id}</div>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="border-t border-zinc-800 px-6 py-4 bg-zinc-950/50 flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => handleReveal(selectedSecret.id)}
                    disabled={!!revealLoading[selectedSecret.id]}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-[10px] font-bold uppercase tracking-widest font-mono border border-zinc-800 transition-colors cursor-pointer disabled:opacity-50 rounded-none"
                  >
                    {revealLoading[selectedSecret.id] ? (
                      <div className="animate-spin h-3 w-3 border border-zinc-300 border-t-transparent" />
                    ) : revealedSecrets[selectedSecret.id] ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                    {revealedSecrets[selectedSecret.id] ? 'HIDE' : 'REVEAL'}
                  </button>
                  <button
                    onClick={() => handleOpenRotate(selectedSecret)}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-[10px] font-bold uppercase tracking-widest font-mono border border-zinc-800 transition-colors cursor-pointer rounded-none"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                    ROTATE KEY
                  </button>
                  <button
                    onClick={() => handleDelete(selectedSecret.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold uppercase tracking-widest font-mono transition-colors cursor-pointer rounded-none ml-auto"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    REVOKE
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 p-6">
                <FileText className="h-8 w-8 text-zinc-800" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-600 font-bold">
                  SELECT A SECRET TO INSPECT
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Secret Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-md rounded-none shadow-2xl relative">
            <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-800 bg-zinc-900/50">
              <h3 className="font-mono text-[10px] font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-white" />
                INSERT VAULT CREDENTIAL
              </h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAddSecret} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Secret Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-none px-3 py-2 text-sm font-mono text-zinc-300 focus:outline-none focus:border-zinc-600"
                  placeholder="e.g. AWS_STRIPE_KEY"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Value (Symmetrically Encrypted)</label>
                <input
                  type="password"
                  required
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-none px-3 py-2 text-sm font-mono text-zinc-300 focus:outline-none focus:border-zinc-600"
                  placeholder="Paste plaintext secret value"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Description</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-none px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-zinc-600"
                  placeholder="Describe where this credential is used"
                  rows={3}
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-white hover:bg-zinc-200 text-zinc-950 rounded-none text-[10px] font-bold font-mono uppercase tracking-widest transition-colors cursor-pointer mt-2"
              >
                ENCRYPT & SAVE IN VAULT
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Rotate Secret Modal */}
      {isRotateOpen && activeRotateSecret && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-md rounded-none shadow-2xl relative">
            <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-800 bg-zinc-900/50">
              <h3 className="font-mono text-[10px] font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-2">
                <RotateCw className="h-3.5 w-3.5 text-white" />
                ROTATE SECRET VALUE
              </h3>
              <button
                onClick={() => {
                  setIsRotateOpen(false);
                  setActiveRotateSecret(null);
                }}
                className="text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-6 pt-4 pb-2">
              <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">TARGET: </span>
              <span className="font-mono text-[10px] text-zinc-100 font-bold bg-zinc-900 px-2 py-1 border border-zinc-800 ml-1">{activeRotateSecret.name}</span>
            </div>
            <form onSubmit={handleRotateSecret} className="px-6 pb-6 pt-2 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">New Secret Value</label>
                <input
                  type="password"
                  required
                  value={rotateValue}
                  onChange={(e) => setRotateValue(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-none px-3 py-2 text-sm font-mono text-zinc-300 focus:outline-none focus:border-zinc-600"
                  placeholder="Paste new plaintext value"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-white hover:bg-zinc-200 text-zinc-950 rounded-none text-[10px] font-bold font-mono uppercase tracking-widest transition-colors cursor-pointer mt-2"
              >
                ENCRYPT & UPDATE VALUE
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Vault;
