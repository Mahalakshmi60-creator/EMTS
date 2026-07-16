import React, { useState } from 'react';
import api from '../services/api';
import { Scan, Terminal, AlertTriangle, ShieldCheck, RefreshCw, FileWarning } from 'lucide-react';

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

    // Frontend validation of payload size (500 KB)
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
    switch (s) {
      case 'CRITICAL':
        return <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded text-xs font-bold uppercase animate-pulse">Critical</span>;
      case 'HIGH':
        return <span className="bg-red-500/10 text-red-400 border border-red-500/25 px-2 py-0.5 rounded text-xs font-bold uppercase">High</span>;
      case 'MEDIUM':
        return <span className="bg-amber-500/10 text-amber-400 border border-amber-500/25 px-2 py-0.5 rounded text-xs font-bold uppercase">Medium</span>;
      default:
        return <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/25 px-2 py-0.5 rounded text-xs font-bold uppercase">Low</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Scan className="h-6 w-6 text-indigo-400" />
          AI Leak Scanner
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Scan source code snippets using Google Gemini 2.5 Flash for hardcoded API keys, tokens, or credential leaks.
        </p>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Main Input Form */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <form onSubmit={handleScan} className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
          <h3 className="font-semibold text-slate-200 flex items-center gap-2 text-sm uppercase tracking-wider">
            <Terminal className="h-4 w-4 text-indigo-400" />
            Scanner Input
          </h3>

          <div className="space-y-1">
            <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">File Name</label>
            <input
              type="text"
              required
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              placeholder="e.g. config.py, database.ts"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Source Code Snippet</label>
            <textarea
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-indigo-500 resize-none"
              placeholder="Paste raw script or config here..."
              rows={12}
            />
          </div>

          <div className="text-xs text-slate-500 flex justify-between items-center">
            <span>Rate limit: 5 / min per tenant</span>
            <span>Max payload size: 500 KB</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-all cursor-pointer shadow-[0_4px_20px_rgba(99,102,241,0.3)]"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Scanning Code with Gemini...
              </>
            ) : (
              <>
                <Scan className="h-4 w-4" />
                Run Threat Exposure Scan
              </>
            )}
          </button>
        </form>

        {/* Results Screen */}
        <div className="lg:col-span-3 space-y-6">
          {result ? (
            <div className="space-y-6 animate-fadeIn">
              {/* Score indicator */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-200">Analysis Completed</h3>
                  <p className="text-xs text-slate-500 mt-1">Resource ID: {result.id}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs text-slate-400 uppercase tracking-wider">Risk Index</span>
                    <h2 className={`text-3xl font-extrabold ${result.risk_score > 70 ? 'text-rose-500' : result.risk_score > 30 ? 'text-amber-500' : 'text-emerald-500'}`}>
                      {result.risk_score} / 100
                    </h2>
                  </div>
                </div>
              </div>

              {/* Findings list */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="px-6 py-4 bg-slate-900/50 border-b border-slate-800">
                  <h4 className="font-semibold text-slate-200 text-sm">Vulnerability Report Findings ({result.findings.length})</h4>
                </div>

                {result.findings.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 space-y-2">
                    <ShieldCheck className="h-10 w-10 text-emerald-500 mx-auto" />
                    <h4 className="font-semibold text-slate-200">No Secrets Detected</h4>
                    <p className="text-xs text-slate-500">Gemini did not locate any hardcoded authentication leaks in this snippet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-950/20 border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                          <th className="px-6 py-3">Line</th>
                          <th className="px-6 py-3">Type</th>
                          <th className="px-6 py-3">Severity</th>
                          <th className="px-6 py-3">Confidence</th>
                          <th className="px-6 py-3">Remediation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40 text-xs text-slate-300">
                        {result.findings.map((f, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/20">
                            <td className="px-6 py-4 font-mono font-bold text-indigo-400">#{f.line_number}</td>
                            <td className="px-6 py-4 font-semibold">{f.secret_type}</td>
                            <td className="px-6 py-4">{getSeverityBadge(f.severity)}</td>
                            <td className="px-6 py-4 font-mono">{(f.confidence_score * 100).toFixed(0)}%</td>
                            <td className="px-6 py-4 text-slate-400 leading-relaxed max-w-xs">{f.remediation}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl h-full min-h-[300px] flex flex-col items-center justify-center text-center p-12 text-slate-500 space-y-4">
              <FileWarning className="h-12 w-12 text-slate-700" />
              <div>
                <h4 className="font-semibold text-slate-300 text-sm">Vulnerability Report</h4>
                <p className="text-xs text-slate-500 max-w-sm mt-1 mx-auto">
                  Submit a source code snippet to generate an interactive compliance risk assessment.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default Scanner;
