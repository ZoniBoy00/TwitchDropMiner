import { useState, useEffect } from 'react';
import { Key, Shield, Copy, Check, Server, Lock, Eye, EyeOff, BookOpen, CheckCircle, XCircle } from 'lucide-react';
import type { Settings } from '../types';

export function APIPage({ settings, onSave }: {
  settings: Settings | null;
  onSave: (data: Record<string, unknown>) => void;
}) {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (settings) setApiKey(settings.api_key || '');
  }, [settings]);

  const handleSave = () => {
    onSave({ api_key: apiKey });
  };

  const handleCopy = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const headers: Record<string, string> = {};
      if (apiKey) headers['X-API-Key'] = apiKey;
      const res = await fetch('/api/status', { headers });
      const data = await res.json();
      if (res.ok) {
        setTestResult({ ok: true, text: `Server status: ${data.status || 'running'}, ${data.channels || 0} channels tracked` });
      } else {
        setTestResult({ ok: false, text: `HTTP ${res.status}: ${data.error || 'Unknown error'}` });
      }
    } catch (e) {
      setTestResult({ ok: false, text: `${(e as Error).message}` });
    }
    setTesting(false);
  };

  const endpoints = [
    { method: 'GET', path: '/api/status', desc: 'Server status, version, current channel, drops progress' },
    { method: 'GET', path: '/api/settings', desc: 'Get all current settings' },
    { method: 'POST', path: '/api/settings', desc: 'Update settings (partial update)' },
    { method: 'POST', path: '/api/login', desc: 'Login with username/password/2FA' },
    { method: 'POST', path: '/api/code', desc: 'Confirm OAuth device activation code' },
    { method: 'GET/POST', path: '/api/logout', desc: 'Logout and clear session' },
    { method: 'POST', path: '/api/restart', desc: 'Restart the miner' },
    { method: 'POST', path: '/api/action/reload', desc: 'Reload inventory and campaigns' },
    { method: 'POST', path: '/api/action/switch', desc: 'Switch to next channel' },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* API Key Settings */}
      <div className="space-y-4">
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Key size={14} className="text-accent" />
            <h3 className="text-xs font-semibold">API Key</h3>
          </div>
          <div className="mb-1">
            <div className="flex items-center gap-1.5 mb-1">
              <label className="text-[10px] text-dark-200 uppercase tracking-wider font-semibold">Authentication Key</label>
            </div>
            <div className="flex gap-1.5">
              <div className="relative flex-1">
                <input
                  type={showKey ? 'text' : 'password'}
                  className="input w-full pr-8"
                  placeholder="Leave empty to disable API authentication"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-dark-300 hover:text-dark-50"
                >
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {apiKey && (
                <button onClick={handleCopy} className="btn-secondary" title="Copy API Key">
                  {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                </button>
              )}
            </div>
          </div>
          <p className="text-[10px] text-dark-400 mb-3 leading-relaxed">
            When set, all API requests must include the <code className="text-accent">X-API-Key</code> header.
            Requests without a valid key receive <code className="text-danger">403 Forbidden</code>.
          </p>
          <div className="flex gap-2">
            <button className="btn-primary" onClick={handleSave}>
              <Lock size={13} /> Save API Key
            </button>
            <button className="btn-primary" onClick={handleTest} disabled={testing}>
              <Server size={13} /> {testing ? 'Testing...' : 'Test API'}
            </button>
          </div>
          {testResult && (
            <div className={`mt-2 flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-md border ${
              testResult.ok
                ? 'text-green-400 border-green-400/30 bg-green-400/10'
                : 'text-danger border-danger/30 bg-danger/10'
            }`}>
              {testResult.ok ? <CheckCircle size={13} className="shrink-0" /> : <XCircle size={13} className="shrink-0" />}
              {testResult.text}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Shield size={14} className="text-warning" />
            <h3 className="text-xs font-semibold">Authentication</h3>
          </div>
          <div className="space-y-2 text-[11px] text-dark-200 leading-relaxed">
            <p>API Key authentication protects the REST API from unauthorized access.</p>
            <div className="bg-dark-900 border border-dark-600 rounded-md p-2 font-mono text-[10px]">
              <div className="text-dark-300 mb-1"># Example usage:</div>
              <div className="text-dark-50">curl -H "X-API-Key: your-key" \<br />&nbsp;&nbsp;http://localhost:1337/api/status</div>
            </div>
            <p className="text-dark-300">Rate limit: <span className="text-dark-50">30 requests/minute/IP</span></p>
          </div>
        </div>
      </div>

      {/* API Endpoints Reference */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={14} className="text-accent" />
          <h3 className="text-xs font-semibold">API Endpoints</h3>
        </div>
        <div className="overflow-hidden rounded-md border border-dark-600">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-dark-800/80">
                <th className="text-left px-2.5 py-1.5 text-dark-300 font-semibold uppercase tracking-wider w-20">Method</th>
                <th className="text-left px-2.5 py-1.5 text-dark-300 font-semibold uppercase tracking-wider">Path</th>
                <th className="text-left px-2.5 py-1.5 text-dark-300 font-semibold uppercase tracking-wider hidden md:table-cell">Description</th>
              </tr>
            </thead>
            <tbody>
              {endpoints.map((ep, i) => (
                <tr key={i} className="border-t border-dark-600/50 hover:bg-dark-800/40 transition-colors">
                  <td className="px-2.5 py-1.5">
                    <span className={`font-mono font-bold text-[10px] ${
                      ep.method === 'GET' ? 'text-green-400' :
                      ep.method === 'POST' ? 'text-warning' :
                      'text-accent'
                    }`}>{ep.method}</span>
                  </td>
                  <td className="px-2.5 py-1.5 font-mono text-dark-50">{ep.path}</td>
                  <td className="px-2.5 py-1.5 text-dark-300 hidden md:table-cell">{ep.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-dark-400 mt-2">
          Base URL: <code className="text-dark-100">http://localhost:1337</code>
          &nbsp;·&nbsp; All endpoints return JSON
        </p>
      </div>
    </div>
  );
}
