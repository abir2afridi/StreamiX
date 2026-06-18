import React, { useState, useEffect } from 'react';
import { Search, Tv, Settings, ShieldAlert, Zap, Sun, Moon, ArrowLeft } from 'lucide-react';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string) => void;
  tvMode: boolean;
  setTvMode: (mode: boolean) => void;
  lightTheme: boolean;
  toggleTheme: () => void;
  viewTitle?: string;
  viewSubtitle?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  backTarget?: string;
}

export default function Header({ currentView, onNavigate, tvMode, setTvMode, lightTheme, toggleTheme, viewTitle, viewSubtitle, searchValue, onSearchChange, backTarget }: HeaderProps) {
  const [searchVal, setSearchVal] = useState('');

  const currentSearch = searchValue !== undefined ? searchValue : searchVal;
  const handleSearchChange = onSearchChange || setSearchVal;

  useEffect(() => {
    if (onSearchChange && searchValue !== undefined) return;
    if (currentView === 'home' || currentView === 'channels') return;
    setSearchVal('');
  }, [currentView]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentSearch.trim()) {
      onNavigate(`#/channels?q=${encodeURIComponent(currentSearch.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-carbon/80 backdrop-blur-xl border-b border-white/10 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => onNavigate('#/')}>
          <div className="p-1.5 bg-neon/10 border border-neon/30 flex items-center justify-center text-neon group-hover:bg-neon/20 transition-all duration-300">
            <Tv className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xs font-black font-display uppercase tracking-widest text-white flex items-center gap-1.5">
              STREAMIX
              <span className="px-1 py-0.5 text-[7px] bg-neon/10 text-neon font-black font-mono border border-neon/30">
                v2.4
              </span>
            </h1>
            <p className="text-[7px] text-white/30 font-mono uppercase tracking-[0.2em] leading-none">LIVE TELEVISION PROTOCOL</p>
          </div>
        </div>

        {backTarget && (
          <button
            onClick={() => onNavigate(backTarget)}
            className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="BACK"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}

        {viewTitle && (
          <>
            {!backTarget && <span className="w-px h-5 bg-white/10" />}
            <div>
              <h2 className="text-xs font-black font-display uppercase tracking-widest text-white">{viewTitle}</h2>
              {viewSubtitle && (
                <p className="text-[7px] text-white/30 font-mono uppercase tracking-[0.15em] leading-none">{viewSubtitle}</p>
              )}
            </div>
          </>
        )}
      </div>

      <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative w-64">
        <Search className="w-3 h-3 text-white/30 absolute left-2.5 pointer-events-none" />
        <input
          type="text"
          placeholder="SEARCH CHANNELS..."
          value={currentSearch}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full pl-8 pr-7 py-1.5 bg-carbon/50 border border-white/10 text-[10px] text-white placeholder-white/30 font-mono uppercase tracking-widest focus:border-neon/30 focus:shadow-[0_0_12px_rgba(0,212,255,0.08)] transition-all duration-300"
        />
        {currentSearch && (
          <button
            type="button"
            onClick={() => handleSearchChange('')}
            className="absolute right-2 text-white/30 hover:text-white text-[10px] p-0.5"
          >
            ✕
          </button>
        )}
      </form>

      <div className="flex items-center gap-1.5">
        <button
          onClick={toggleTheme}
          title={lightTheme ? 'DARK MODE' : 'LIGHT MODE'}
          className={`p-1.5 border transition-all duration-300 flex items-center justify-center ${
            lightTheme
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              : 'bg-carbon/50 border-white/10 text-white/40 hover:text-white hover:border-white/30'
          }`}
        >
          {lightTheme ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={() => setTvMode(!tvMode)}
          title="TOGGLE TV MODE"
          className={`p-1.5 border transition-all duration-300 relative flex items-center justify-center ${
            tvMode
              ? 'bg-neon/10 border-neon/30 text-neon'
              : 'bg-carbon/50 border-white/10 text-white/40 hover:text-white hover:border-white/30'
          }`}
        >
          <Zap className={`w-3.5 h-3.5 ${tvMode ? 'animate-pulse' : ''}`} />
          {tvMode && <span className="absolute -top-1 -right-1 text-[7px] px-0.5 bg-neon text-black font-black font-mono">TV</span>}
        </button>

        <button
          onClick={() => onNavigate('#/settings')}
          title="SETTINGS"
          className={`p-1.5 border bg-carbon/50 border-white/10 text-white/40 hover:text-white hover:border-white/30 transition-all duration-300 ${
            currentView === 'settings' ? 'border-neon/30 text-neon' : ''
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => onNavigate('#/admin')}
          title="ADMIN CONSOLE"
          className={`p-1.5 border bg-carbon/50 border-white/10 text-white/40 hover:text-white hover:border-white/30 transition-all duration-300 ${
            currentView === 'admin' ? 'border-crimson/30 text-crimson' : ''
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
}
