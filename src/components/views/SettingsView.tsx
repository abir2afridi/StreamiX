import React, { useEffect, useState } from 'react';
import { Settings, ShieldAlert, Cpu, Check, Sliders, Play, HardDrive, RefreshCw } from 'lucide-react';
import { UserSettings } from '../../types';
import { LocalStorageSettingsRepository } from '../../lib/repositories/localStorage';

interface SettingsViewProps {
  onNavigate: (hash: string) => void;
}

export default function SettingsView({ onNavigate }: SettingsViewProps) {
  const settingsRepo = new LocalStorageSettingsRepository();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const data = await settingsRepo.getSettings();
      setSettings(data);

      setStats({
        userAgent: navigator.userAgent.slice(0, 48) + '...',
        cookieEnabled: navigator.cookieEnabled ? 'ENABLED' : 'DISABLED',
        language: navigator.language,
        localStorageLimit: '5.0 MB',
        secureConnection: window.location.protocol === 'https:' ? 'SECURE' : 'UNSECURE',
      });
    };

    fetchSettings();
  }, []);

  const handleQualityChange = async (quality: 'auto' | '1080p' | '720p' | '480p') => {
    if (!settings) return;
    const updated = { ...settings, defaultQuality: quality };
    setSettings(updated);
    await settingsRepo.saveSettings(updated);
    triggerSaveAlert();
  };

  const handleBufferChange = async (size: 'low' | 'medium' | 'high') => {
    if (!settings) return;
    const updated = { ...settings, bufferSize: size };
    setSettings(updated);
    await settingsRepo.saveSettings(updated);
    triggerSaveAlert();
  };

  const handleAutoplayChange = async () => {
    if (!settings) return;
    const updated = { ...settings, autoplay: !settings.autoplay };
    setSettings(updated);
    await settingsRepo.saveSettings(updated);
    triggerSaveAlert();
  };

  const triggerSaveAlert = () => {
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  if (!settings) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 border-2 border-neon border-t-transparent animate-spin" />
        <p className="text-[10px] font-mono text-white/40 animate-pulse uppercase tracking-[0.2em]">LOADING CONFIG...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 px-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center border-b border-white/10 pb-5">
        <div>
          <h2 className="text-xl font-black font-display uppercase tracking-widest text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-neon" /> CONFIGURATION
          </h2>
          <p className="text-[10px] text-white/30 font-mono uppercase tracking-[0.2em] mt-0.5">
            STREAM QUALITY • BUFFER • SYSTEM
          </p>
        </div>

        {justSaved && (
          <span className="px-3.5 py-1.5 bg-neon/10 text-neon font-mono text-[9px] font-black border border-neon/30 flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> SAVED
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-carbon/80 backdrop-blur-xl border border-white/10 p-5 space-y-4">
            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-neon" /> DEFAULT QUALITY
            </h3>
            <p className="text-[10px] text-white/30 font-mono uppercase tracking-[0.05em]">
              SET PREFERRED STREAM RESOLUTION
            </p>
            <div className="grid grid-cols-4 gap-2">
              {(['auto', '1080p', '720p', '480p'] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => handleQualityChange(q)}
                  className={`py-2 px-1.5 text-[10px] font-black font-mono uppercase tracking-widest border transition-all duration-300 cursor-pointer ${
                    settings.defaultQuality === q
                      ? 'bg-neon text-black border-neon'
                      : 'bg-carbon/50 border-white/10 text-white/40 hover:text-white hover:border-white/30'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-carbon/80 backdrop-blur-xl border border-white/10 p-5 space-y-4">
            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
              <Cpu className="w-4 h-4 text-neon" /> BUFFER SIZE
            </h3>
            <p className="text-[10px] text-white/30 font-mono uppercase tracking-[0.05em]">
              LARGER BUFFER = STABLE • SMALLER = FASTER ZAPPING
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as const).map((b) => (
                <button
                  key={b}
                  onClick={() => handleBufferChange(b)}
                  className={`py-2 px-1.5 text-[10px] font-black font-mono uppercase tracking-widest border transition-all duration-300 cursor-pointer ${
                    settings.bufferSize === b
                      ? 'bg-neon text-black border-neon'
                      : 'bg-carbon/50 border-white/10 text-white/40 hover:text-white hover:border-white/30'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-carbon/80 backdrop-blur-xl border border-white/10 p-5 space-y-4">
            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
              <Play className="w-4 h-4 text-neon" /> AUTOPLAY
            </h3>
            <div className="flex items-center justify-between p-4 bg-obsidian border border-white/10">
              <div className="pr-4">
                <h4 className="text-[11px] font-black uppercase tracking-widest text-white">AUTOPLAY STREAMS</h4>
                <p className="text-[9px] text-white/30 font-mono uppercase tracking-[0.1em]">AUTO-START PLAYBACK ON CHANNEL OPEN</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settings.autoplay}
                  onChange={handleAutoplayChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none peer-checked:bg-neon after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white/20 after:border after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {stats && (
            <div className="bg-carbon/80 backdrop-blur-xl border border-white/10 p-5 space-y-4 font-mono text-[10px]">
              <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2 mb-1">
                <Cpu className="w-4 h-4 text-neon" /> DIAGNOSTICS
              </h3>
              <div className="space-y-3.5 border-t border-white/10 pt-3">
                <div>
                  <span className="text-white/30 font-black uppercase tracking-[0.2em] text-[8px]">CONNECTION</span>
                  <p className="text-white font-semibold mt-0.5 text-[11px]">{stats.secureConnection}</p>
                </div>
                <div>
                  <span className="text-white/30 font-black uppercase tracking-[0.2em] text-[8px]">STORAGE</span>
                  <p className="text-white font-semibold mt-0.5 text-[11px]">{stats.localStorageLimit}</p>
                </div>
                <div>
                  <span className="text-white/30 font-black uppercase tracking-[0.2em] text-[8px]">LANGUAGE</span>
                  <p className="text-white font-semibold mt-0.5 text-[11px]">{stats.language}</p>
                </div>
                <div>
                  <span className="text-white/30 font-black uppercase tracking-[0.2em] text-[8px]">AGENT</span>
                  <p className="text-white/40 leading-relaxed text-[9px] break-all mt-0.5">{stats.userAgent}</p>
                </div>
              </div>
            </div>
          )}

          <div className="p-5 bg-crimson/5 border border-crimron/20 space-y-2">
            <h4 className="text-[10px] font-black text-crimson flex items-center gap-1.5 font-display uppercase tracking-[0.2em]">
              <ShieldAlert className="w-4 h-4" /> RESET
            </h4>
            <p className="text-[9px] text-white/30 font-mono uppercase tracking-[0.05em]">
              CLEAR ALL LOCAL DATA • FAVORITES • HISTORY • SETTINGS
            </p>
            <button
              onClick={() => {
                if (confirm('Reset all settings and stored data?')) {
                  localStorage.clear();
                  window.location.reload();
                }
              }}
              className="mt-2 text-[9px] font-mono font-black bg-crimson/10 hover:bg-crimson/20 text-crimson border border-crimson/30 px-3.5 py-2 transition cursor-pointer uppercase tracking-[0.2em]"
            >
              FACTORY RESET
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
