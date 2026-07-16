import React, { useState } from 'react';
import api from '../services/api';
import { Scan, Terminal, ShieldCheck, RefreshCw, FileWarning } from 'lucide-react';

interface Finding {
  line_number: number;
  secret_type: string;
  severity: string;
  confidence_score: number;
  remediation: string;
}

interface ScanResult {
  id: string;
  file_name: string;
  findings: Finding[];
  risk_score: number;
}

export const Scanner = () => {
  const [fileName, setFileName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState('');

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName || !code) return;

    const codeSize = new Blob([code]).size;
    if (codeSize > 500 * 1024) {
      setError(`File size (${(codeSize / 1024).toFixed(2)} KB) exceeds the strict 500 KB limit.`);
      return;
    }

    try {
      setLoading(true);
      setError('');
      setResult(null);

      const res = await api.post('/scanner/scan', {
        code_snippet: code,
        file_name: fileName
      });

      setResult(res.data);
    } catch (err: any) {
      if (err.response?.status === 429) {
        setError("Rate limit reached. Each tenant is allowed a maximum of 5 AI scans per minute.");
      } else {
        setError(err.response?.data?.detail || "AI Scan failed. Check the Gemini API configuration.");
      }
    } finally {
      setLoading(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    const s = severity.toUpperCase();
    const base = "px-2 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-widest font-mono border";
    switch (s) {
      case 'CRITICAL':
        return <span className={`${base} bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse`}>CRITICAL</span>;
      case 'HIGH':
        return <span className={`${base} bg-red-500/10 text-red-400 border-red-500/30`}>HIGH</span>;
      case 'MEDIUM':
        return <span className={`${base} bg-amber-500/10 text-amber-400 border-amber-500/30`}>MEDIUM</span>;
      default:
        return <span className={`${base} bg-yellow-500/10 text-yellow-400 border-yellow-500/30`}>LOW</span>;
    }
  };

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Top scanner bar */}
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950 px-6 py-2.5 shrink-0">
        <div className="flex items-center gap-3">
          <Scan className="h-4 w-4 text-zinc-500" />
          <span className="font-mono text-[10px] uppercase tracking-widest font-bold text-zinc-400">
            AI LEAK SCANNER
          </span>
          <span className="font-mono text-[10px] text-zinc-600">
            // GEMINI 3.5 FLASH
          </span>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono text-zinc-600 tracking-wider">
          <span>LIMIT: 5/MIN</span>
          <span>MAX: 500KB</span>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border-b border-rose-500/30 text-rose-400 px-6 py-2.5 text-[10px] font-mono uppercase tracking-widest">
          {error}
        </div>
      )}

      {/* IDE Layout: Input Bench + Results */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Input Bench */}
        <form onSubmit={handleScan} className="border-b border-zinc-800 bg-zinc-950 flex flex-col shrink-0">
          {/* Terminal header bar */}
          <div className="flex items-center justify-between bg-zinc-900 px-4 py-2 border-b border-zinc-800">
            <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono tracking-widest uppercase">
              <Terminal className="h-3.5 w-3.5 text-zinc-500" />
              <span>INPUT:</span>
              <input
                type="text"
                required
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="bg-transparent border-none outline-none text-zinc-200 font-bold text-[10px] font-mono uppercase tracking-widest w-40"
                placeholder="RAW_SNIPPET.PY"
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-zinc-600 tracking-widest">BYOK GEMINI-2.5-FLASH</span>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-4 py-1 bg-white hover:bg-zinc-200 disabled:opacity-50 text-zinc-950 rounded-none text-[10px] font-bold font-mono uppercase tracking-widest transition-colors cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    SCANNING...
                  </>
                ) : (
                  <>
                    <Scan className="h-3 w-3" />
                    EXECUTE SCAN
                  </>
                )}
              </button>
            </div>
          </div>
          {/* Code textarea */}
          <textarea
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full bg-black border-none px-4 py-3 text-[11px] font-mono text-zinc-400 focus:outline-none resize-none leading-relaxed"
            placeholder="// Paste raw source code, config, or script here for threat analysis..."
            rows={8}
          />
        </form>

        {/* Threat Advisory Results */}
        <div className="flex-1 overflow-y-auto">
          {result ? (
            <div className="flex flex-col h-full">
              {/* Result summary bar */}
              <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950 px-6 py-2.5 shrink-0">
                <div className="flex items-center gap-4 text-[10px] font-mono text-zinc-500 tracking-widest uppercase">
                  <span>SCAN ID: <span className="text-zinc-300">{result.id}</span></span>
                  <span>FILE: <span className="text-zinc-300">{result.file_name}</span></span>
                  <span>FINDINGS: <span className="text-zinc-300">{result.findings.length}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">RISK INDEX:</span>
                  <span className={`text-lg font-mono font-bold tracking-tight ${result.risk_score > 70 ? 'text-rose-500' : result.risk_score > 30 ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {result.risk_score}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-600">/100</span>
                </div>
              </div>

              {/* Findings table */}
              {result.findings.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 p-6">
                  <ShieldCheck className="h-8 w-8 text-emerald-500" />
                  <span className="font-mono text-xs text-zinc-300 uppercase tracking-widest font-bold">NO SECRETS DETECTED</span>
                  <span className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">Gemini did not locate hardcoded authentication leaks in this snippet.</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table-auto w-full text-left font-mono text-xs divide-y divide-zinc-800 border-collapse">
                    <thead>
                      <tr className="bg-zinc-950 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                        <th className="px-6 py-3 border-b border-zinc-800">LINE</th>
                        <th className="px-6 py-3 border-b border-zinc-800">SECRET TYPE</th>
                        <th className="px-6 py-3 border-b border-zinc-800">SEVERITY</th>
                        <th className="px-6 py-3 border-b border-zinc-800">CONFIDENCE</th>
                        <th className="px-6 py-3 border-b border-zinc-800">REMEDIATION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                      {result.findings.map((f, idx) => (
                        <tr key={idx} className="hover:bg-zinc-900/50 transition-colors">
                          <td className="px-6 py-3 font-bold text-white">#{f.line_number}</td>
                          <td className="px-6 py-3 font-bold text-zinc-300">{f.secret_type}</td>
                          <td className="px-6 py-3">{getSeverityBadge(f.severity)}</td>
                          <td className="px-6 py-3 text-zinc-400">{(f.confidence_score * 100).toFixed(0)}%</td>
                          <td className="px-6 py-3 text-[11px] text-zinc-400 leading-relaxed max-w-xs">{f.remediation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 p-12 h-full">
              <FileWarning className="h-8 w-8 text-zinc-800" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-600 font-bold">
                THREAT ADVISORY REPORT
              </span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-700 max-w-sm">
                Submit a source code snippet above to generate an interactive compliance risk assessment.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default Scanner;
