import React, { useEffect, useState } from 'react';
import { ShieldCheck, Eye, Trash2, ShieldAlert, KeyRound, RefreshCw, Plus, Play, Info, Check, AlertTriangle, Activity } from 'lucide-react';
import { Source } from '../../types';

export default function AdminView() {
  const [pin, setPin] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [authError, setAuthError] = useState(false);

  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncReport, setSyncReport] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newType, setNewType] = useState<'m3u' | 'json'>('m3u');
  const [newPriority, setNewPriority] = useState<number>(2);
  const [newDesc, setNewDesc] = useState('');

  const [testUrl, setTestUrl] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '1234') {
      setAuthenticated(true);
      setAuthError(false);
    } else {
      setAuthError(true);
    }
  };

  const fetchSources = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sources');
      if (res.ok) {
        const data = await res.json();
        setSources(data);
      }
    } catch (e) {
      console.error('Error fetching admin sources:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authenticated) {
      fetchSources();
    }
  }, [authenticated]);

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newUrl) return;

    try {
      const res = await fetch('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          url: newUrl,
          type: newType,
          priority: newPriority,
          description: newDesc,
        }),
      });

      if (res.ok) {
        setNewName('');
        setNewUrl('');
        setNewDesc('');
        fetchSources();
      }
    } catch (e) {
      console.error('Error adding admin source:', e);
    }
  };

  const handleDeleteSource = async (id: string) => {
    if (!confirm('Delete this source?')) return;
    try {
      const res = await fetch(`/api/sources/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchSources();
      }
    } catch (e) {
      console.error('Error deleting source:', e);
    }
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    setSyncReport(null);
    try {
      const res = await fetch('/api/admin/sync-sources', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setSyncReport(data.message);
        fetchSources();
      } else {
        setSyncReport(`SYNC FAILED: ${data.message}`);
      }
    } catch (err: any) {
      setSyncReport(`SYNC FAILED: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleValidateTestStream = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testUrl) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/validate-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: testUrl }),
      });
      if (res.ok) {
        const data = await res.json();
        setTestResult(data);
      } else {
        setTestResult({ valid: false, status: 'API ERROR' });
      }
    } catch {
      setTestResult({ valid: false, status: 'CONNECTION ERROR' });
    } finally {
      setTesting(false);
    }
  };

  if (!authenticated) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] px-6">
        <form onSubmit={handleAuthSubmit} className="w-full max-w-sm bg-carbon/80 backdrop-blur-xl border border-white/10 p-6 text-center space-y-4">
          <KeyRound className="w-12 h-12 text-neon mx-auto" />
          <h3 className="text-base font-black font-display uppercase tracking-widest text-white">ADMIN LOCK</h3>
          <p className="text-[10px] text-white/30 font-mono uppercase tracking-[0.1em]">
            ENTER PIN: <code className="bg-obsidian px-1.5 py-0.5 text-neon font-mono">1234</code>
          </p>
          <div className="space-y-1">
            <input
              type="password"
              placeholder="PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full px-4 py-2.5 bg-obsidian border border-white/10 text-[11px] text-center text-white font-mono uppercase tracking-widest focus:border-neon/30 focus:shadow-[0_0_12px_rgba(0,212,255,0.08)]"
            />
            {authError && <p className="text-[9px] text-crimson font-mono uppercase tracking-[0.1em]">INVALID PIN • TRY 1234</p>}
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-white text-black text-[11px] font-black uppercase tracking-widest hover:bg-neon transition cursor-pointer"
          >
            ACCESS
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="pt-8 space-y-8 pb-16 px-3 md:px-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl font-black font-display uppercase tracking-widest text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-neon" /> ADMIN CONSOLE
          </h2>
          <p className="text-[10px] text-white/30 font-mono uppercase tracking-[0.2em] mt-0.5">
            SOURCE MANAGEMENT • SYNC • DIAGNOSTICS
          </p>
        </div>

        <button
          onClick={handleSyncNow}
          disabled={syncing}
          className="px-4 py-2 bg-white text-black text-[11px] font-black uppercase tracking-widest hover:bg-neon disabled:opacity-30 flex items-center gap-2 transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'SYNCING...' : 'SYNC ALL'}
        </button>
      </div>

      {syncReport && (
        <div className="p-4 bg-neon/10 border border-neon/30 flex items-center gap-3">
          <Info className="w-5 h-5 text-neon shrink-0" />
          <p className="text-[10px] text-neon font-mono uppercase tracking-[0.05em]">{syncReport}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-carbon/80 backdrop-blur-xl border border-white/10 p-5 space-y-4">
            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">CONFIGURED SOURCES</h3>

            {loading ? (
              <p className="text-[10px] font-mono text-white/30 animate-pulse uppercase tracking-[0.1em]">LOADING...</p>
            ) : sources.length === 0 ? (
              <p className="text-[10px] text-white/30 font-mono uppercase tracking-[0.1em]">NO SOURCES CONFIGURED</p>
            ) : (
              <div className="space-y-3">
                {sources.map((src) => (
                  <div key={src.id} className="p-4 bg-obsidian border border-white/10 space-y-2 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`h-1.5 w-1.5 ${src.enabled ? 'bg-neon' : 'bg-crimson'}`} />
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-white">{src.name}</h4>
                        <span className="px-1.5 py-0.5 bg-white/10 text-white/40 font-mono text-[7px] font-black uppercase tracking-[0.2em]">
                          {src.type}
                        </span>
                      </div>
                      {src.description && <p className="text-[9px] text-white/30 font-mono uppercase tracking-[0.05em]">{src.description}</p>}
                      <p className="text-[8px] text-white/20 font-mono truncate max-w-sm">{src.url}</p>
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                      <div className="text-right font-mono text-[9px]">
                        <p className="text-white/30 uppercase tracking-[0.1em]">CH: <strong className="text-white">{src.channelCount}</strong></p>
                        <p className="text-white/30 uppercase tracking-[0.1em]">SYNC: <strong className="text-white/40">{src.lastSynced ? new Date(src.lastSynced).toLocaleDateString() : 'NEVER'}</strong></p>
                      </div>

                      <button
                        onClick={() => handleDeleteSource(src.id)}
                        className="p-1.5 bg-carbon border border-white/10 hover:border-crimson/30 text-white/30 hover:text-crimson transition cursor-pointer"
                        title="DELETE"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-carbon/80 backdrop-blur-xl border border-white/10 p-5 space-y-4">
            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
              <Activity className="w-4 h-4 text-neon" /> STREAM DIAGNOSTIC
            </h3>
            <p className="text-[10px] text-white/30 font-mono uppercase tracking-[0.05em]">
              TEST STREAM URL LATENCY
            </p>

            <form onSubmit={handleValidateTestStream} className="flex gap-2">
              <input
                type="url"
                placeholder="https://...stream.m3u8"
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                className="flex-1 px-3 py-2 bg-obsidian border border-white/10 text-[11px] text-white placeholder-white/20 font-mono uppercase tracking-widest focus:border-neon/30 focus:shadow-[0_0_12px_rgba(0,212,255,0.08)]"
              />
              <button
                type="submit"
                disabled={testing}
                className="px-4 py-2 bg-white text-black text-[11px] font-black uppercase tracking-widest hover:bg-neon transition cursor-pointer disabled:opacity-30"
              >
                {testing ? 'TESTING...' : 'CHECK'}
              </button>
            </form>

            {testResult && (
              <div className="p-4 bg-obsidian border border-white/10 space-y-2.5 font-mono text-[9px]">
                <div className="flex items-center gap-2 font-black font-display text-[10px] uppercase tracking-widest">
                  {testResult.valid ? <span className="text-neon flex items-center gap-1"><Check className="w-4 h-4" /> ONLINE</span> : <span className="text-crimson flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> OFFLINE</span>}
                  <span className="text-white/30 uppercase tracking-[0.1em]">| STATUS: {testResult.status}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-2.5 leading-relaxed">
                  <div><span className="text-white/30">FORMAT:</span> {testResult.contentType}</div>
                  <div><span className="text-white/30">LATENCY:</span> {testResult.latencyMs}ms</div>
                  <div><span className="text-neon font-black">HEALTH:</span> {testResult.healthScore}%</div>
                  <div><span className="text-neon font-black">QUALITY:</span> {testResult.qualityScore}%</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-carbon/80 backdrop-blur-xl border border-white/10 p-5 space-y-4">
            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
              <Plus className="w-4 h-4 text-neon" /> ADD SOURCE
            </h3>

            <form onSubmit={handleAddSource} className="space-y-3 text-[11px]">
              <div className="space-y-1">
                <label className="text-[8px] uppercase font-mono font-black text-white/30 tracking-[0.3em]">NAME</label>
                <input
                  type="text"
                  placeholder="BANGLADESH M3U"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-obsidian border border-white/10 text-[11px] text-white placeholder-white/20 font-mono uppercase tracking-widest focus:border-neon/30 focus:shadow-[0_0_12px_rgba(0,212,255,0.08)]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[8px] uppercase font-mono font-black text-white/30 tracking-[0.3em]">TYPE</label>
                  <select
                    value={newType}
                    onChange={(e: any) => setNewType(e.target.value)}
                    className="w-full px-3 py-2 bg-obsidian border border-white/10 text-[11px] text-white focus:border-neon/30 cursor-pointer font-mono uppercase tracking-widest"
                  >
                    <option value="m3u">M3U</option>
                    <option value="json">JSON</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] uppercase font-mono font-black text-white/30 tracking-[0.3em]">PRIORITY</label>
                  <select
                    value={newPriority}
                    onChange={(e: any) => setNewPriority(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-obsidian border border-white/10 text-[11px] text-white focus:border-neon/30 cursor-pointer font-mono uppercase tracking-widest"
                  >
                    <option value="1">PRIMARY</option>
                    <option value="2">BACKUP</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[8px] uppercase font-mono font-black text-white/30 tracking-[0.3em]">URL</label>
                <input
                  type="url"
                  placeholder="https://...file.m3u"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-obsidian border border-white/10 text-[11px] text-white placeholder-white/20 font-mono uppercase tracking-widest focus:border-neon/30 focus:shadow-[0_0_12px_rgba(0,212,255,0.08)]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[8px] uppercase font-mono font-black text-white/30 tracking-[0.3em]">DESCRIPTION</label>
                <textarea
                  placeholder="SOURCE DESCRIPTION"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-obsidian border border-white/10 text-[11px] text-white placeholder-white/20 font-mono uppercase tracking-widest focus:border-neon/30 focus:shadow-[0_0_12px_rgba(0,212,255,0.08)]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-white text-black text-[11px] font-black uppercase tracking-widest hover:bg-neon transition cursor-pointer"
              >
                ADD SOURCE
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
