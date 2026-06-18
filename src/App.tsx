import React, { useState, useEffect } from 'react';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import HomeView from './components/views/HomeView';
import ChannelsView from './components/views/ChannelsView';
import ChannelPlayerView from './components/views/ChannelPlayerView';
import SearchView from './components/views/SearchView';
import CategoriesView from './components/views/CategoriesView';
import EPGView from './components/views/EPGView';
import FavoritesView from './components/views/FavoritesView';
import HistoryView from './components/views/HistoryView';
import SettingsView from './components/views/SettingsView';
import AdminView from './components/views/AdminView';
import ValidateView from './components/views/ValidateView';
import { Tv, Play, Monitor, ListCollapse, Radio, ChevronRight, Zap, Sun, Moon, Menu, X } from 'lucide-react';
import { Channel } from './types';
import { ChannelService } from './lib/services/ChannelService';

export default function App() {
  const [route, setRoute] = useState(window.location.hash || '#/');
  const [tvMode, setTvMode] = useState(false);
  const [lightTheme, setLightTheme] = useState(() => {
    return localStorage.getItem('streamix-theme') === 'light';
  });
  const [channels, setChannels] = useState<Channel[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const channelService = new ChannelService();

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(window.location.hash || '#/');
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => console.log('Service Worker Registered Successfully:', reg.scope))
          .catch((err) => console.warn('Service Worker Registration Failed:', err));
      });
    }
  }, []);

  useEffect(() => {
    if (tvMode) {
      channelService.getChannels({ limit: 100 }).then((res) => {
        setChannels(res.channels);
      });
    }
  }, [tvMode]);

  useEffect(() => {
    if (!tvMode || channels.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          setFocusedIndex((prev) => Math.min(prev + 1, channels.length - 1));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setFocusedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex((prev) => Math.max(prev - 4, 0));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex((prev) => Math.min(prev + 4, channels.length - 1));
          break;
        case 'Enter':
          e.preventDefault();
          const chan = channels[focusedIndex];
          if (chan) {
            window.location.hash = `#/channels/${chan.slug}`;
          }
          break;
        case 'Escape':
        case 'Backspace':
          e.preventDefault();
          window.location.hash = '#/';
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tvMode, channels, focusedIndex]);

  const handleNavigate = (hash: string) => {
    window.location.hash = hash;
  };

  const toggleTheme = () => {
    setLightTheme((prev) => {
      const next = !prev;
      localStorage.setItem('streamix-theme', next ? 'light' : 'dark');
      return next;
    });
  };

  const parseCurrentHash = () => {
    const raw = route.replace(/^#/, '');
    const [pathPart, queryPart] = raw.split('?');
    const parts = pathPart.split('/').filter(Boolean);

    const params = new URLSearchParams(queryPart || '');
    
    return {
      path: parts[0] || 'home',
      id: parts[1] || null,
      q: params.get('q') || '',
      category: params.get('category') || 'all',
    };
  };

  const parsed = parseCurrentHash();

  const renderActiveView = () => {
    switch (parsed.path) {
      case 'home':
        return <HomeView onNavigate={handleNavigate} />;
      case 'channels':
        if (parsed.id) {
          return <ChannelPlayerView slug={parsed.id} onNavigate={handleNavigate} />;
        }
        return (
          <ChannelsView
            initialQuery={parsed.q}
            initialCategory={parsed.category}
            onNavigate={handleNavigate}
          />
        );
      case 'favorites':
        return <FavoritesView onNavigate={handleNavigate} />;
      case 'history':
        return <HistoryView onNavigate={handleNavigate} />;
      case 'settings':
        return <SettingsView onNavigate={handleNavigate} />;
      case 'admin':
        return <AdminView />;
      case 'validate':
        return <ValidateView onNavigate={handleNavigate} />;
      case 'search':
        return <SearchView onNavigate={handleNavigate} />;
      case 'categories':
        return <CategoriesView onNavigate={handleNavigate} />;
      case 'epg':
        return <EPGView onNavigate={handleNavigate} />;
      default:
        return <HomeView onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className={`h-dvh lg:h-screen overflow-x-hidden overflow-y-hidden ${lightTheme ? 'light' : ''} bg-obsidian text-white flex flex-col font-sans antialiased selection:bg-neon/30 selection:text-white`}>
      
      {tvMode ? (
        <div className="flex-1 flex flex-col bg-obsidian p-8 space-y-8 overflow-y-auto">
          <div className="flex justify-between items-center bg-carbon/80 backdrop-blur-xl border border-white/10 p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-neon/10 border border-neon/30">
                <Tv className="w-6 h-6 text-neon" />
              </div>
              <div>
                <h1 className="text-lg font-black font-display tracking-widest uppercase text-white">STREAMIX TV PROTOCOL</h1>
                <p className="text-[10px] text-white/40 font-mono uppercase tracking-[0.2em]">10-FT VIEWPORT • ARROWS TO NAVIGATE</p>
              </div>
            </div>

            <button
              onClick={() => setTvMode(false)}
              className="px-4 py-2 bg-white text-black text-[11px] font-black uppercase tracking-widest hover:bg-neon transition cursor-pointer"
            >
              Exit TV View
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-3 space-y-4">
              <h2 className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
                <Radio className="w-4 h-4 text-neon" /> SELECT CHANNEL
              </h2>

              {channels.length === 0 ? (
                <p className="text-[11px] text-white/30 font-mono">NO CHANNELS LOADED</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {channels.map((chan, idx) => {
                    const isFocused = focusedIndex === idx;
                    return (
                      <div
                        key={chan.id}
                        onClick={() => handleNavigate(`#/channels/${chan.slug}`)}
                        className={`p-5 bg-carbon/80 border border-white/10 cursor-pointer text-center relative flex flex-col items-center justify-center transition-all duration-300 ${
                          isFocused ? 'tv-focused' : 'hover:border-neon/30'
                        }`}
                      >
                        {chan.logo ? (
                          <img src={chan.logo} alt={chan.name} referrerPolicy="no-referrer" className="h-10 w-20 object-contain mb-3 grayscale hover:grayscale-0 transition-all duration-300" />
                        ) : (
                          <span className="font-display font-black text-neon text-lg mb-3">{chan.name.slice(0, 3).toUpperCase()}</span>
                        )}
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-white truncate max-w-full">{chan.name}</h4>
                        {isFocused && (
                          <span className="absolute bottom-2 right-2 p-1 bg-neon text-black text-[8px] font-black font-mono">
                            SELECT
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-carbon/80 border border-white/10 p-5 h-fit space-y-4 backdrop-blur-xl">
              <h3 className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
                <ChevronRight className="w-3.5 h-3.5 text-neon" /> FOCUS
              </h3>
              {channels[focusedIndex] ? (
                <div className="space-y-4">
                  <div className="p-4 bg-obsidian border border-white/10 flex justify-center">
                    {channels[focusedIndex].logo && (
                      <img src={channels[focusedIndex].logo} alt={channels[focusedIndex].name} referrerPolicy="no-referrer" className="h-20 w-36 object-contain grayscale hover:grayscale-0 transition-all duration-300" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-widest text-white">{channels[focusedIndex].name}</h4>
                    <p className="text-[10px] text-white/40 font-mono uppercase mt-1">CATEGORY: {channels[focusedIndex].category}</p>
                    <p className="text-[10px] text-white/40 font-mono mt-0.5">HEALTH: {channels[focusedIndex].healthScore}%</p>
                  </div>
                  <div className="p-3 bg-neon/5 border border-neon/20">
                    <p className="text-[10px] text-neon font-mono leading-relaxed">
                      PRESS <kbd className="bg-obsidian px-1 py-0.5 text-white text-[9px]">ENTER</kbd> TO LAUNCH, <kbd className="bg-obsidian px-1 py-0.5 text-white text-[9px]">BACKSPACE</kbd> TO RESET
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-white/30 font-mono">D-PAD ACTIVE</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>


          <Header
            currentView={parsed.path}
            onNavigate={handleNavigate}
            tvMode={tvMode}
            setTvMode={setTvMode}
            lightTheme={lightTheme}
            toggleTheme={toggleTheme}
            viewTitle={parsed.path === 'channels' && !parsed.id ? 'CHANNEL DIRECTORY' : parsed.id ? 'CHANNEL PLAYER' : parsed.path === 'validate' ? 'STREAM VALIDATOR' : parsed.path === 'search' ? 'SEARCH' : parsed.path === 'categories' ? 'BROWSE' : parsed.path === 'epg' ? 'TV GUIDE' : parsed.path.toUpperCase()}
            backTarget={parsed.path !== 'home' ? (parsed.id ? '#/' + parsed.path : '#/') : undefined}
            mobileMenuOpen={mobileMenuOpen}
            onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
          />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar
              currentView={parsed.path}
              onNavigate={(hash) => { setMobileMenuOpen(false); handleNavigate(hash); }}
              mobileMenuOpen={mobileMenuOpen}
              onClose={() => setMobileMenuOpen(false)}
            />
            <div className="flex-1 flex flex-col overflow-hidden w-full max-w-full">
              <main className="flex-1 flex flex-col overflow-y-auto min-h-0 w-full max-w-full touch-pan-y">
                {renderActiveView()}
              </main>
          </div>
          </div>
        </>
      )}
    </div>
  );
}
