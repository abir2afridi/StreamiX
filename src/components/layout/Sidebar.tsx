import React, { useState, useEffect } from 'react';
import { Home, Grid, Heart, History, Settings, ShieldAlert, Search, List, Calendar, Link2 } from 'lucide-react';
import { LocalStorageFavoriteRepository } from '../../lib/repositories/localStorage';

interface SidebarProps {
  currentView: string;
  onNavigate: (hash: string) => void;
  mobileMenuOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ currentView, onNavigate, mobileMenuOpen, onClose }: SidebarProps) {
  const [favCount, setFavCount] = useState(0);
  const favRepo = new LocalStorageFavoriteRepository();

  useEffect(() => {
    const updateCount = async () => {
      const favs = await favRepo.getAllFavorites();
      setFavCount(favs.length);
    };

    updateCount();
    window.addEventListener('favorites-sync', updateCount);
    const interval = setInterval(updateCount, 2000);
    return () => {
      window.removeEventListener('favorites-sync', updateCount);
      clearInterval(interval);
    };
  }, []);

  const navItems = [
    { id: 'home', label: 'HOME', icon: Home, hash: '#/' },
    { id: 'channels', label: 'CHANNELS', icon: Grid, hash: '#/channels' },
    { id: 'validate', label: 'VALIDATE', icon: Link2, hash: '#/validate' },
    { id: 'search', label: 'SEARCH', icon: Search, hash: '#/search' },
    { id: 'categories', label: 'CATEGORIES', icon: List, hash: '#/categories' },
    { id: 'epg', label: 'EPG', icon: Calendar, hash: '#/epg' },
    { id: 'favorites', label: 'FAV', icon: Heart, hash: '#/favorites', badge: favCount },
    { id: 'history', label: 'HISTORY', icon: History, hash: '#/history' },
    { id: 'settings', label: 'SETTINGS', icon: Settings, hash: '#/settings' },
    { id: 'admin', label: 'ADMIN', icon: ShieldAlert, hash: '#/admin' },
  ];

  const isActive = (id: string) => currentView === id;

  const sidebarContent = (
    <>
      <div className="px-3 mb-2 lg:hidden">
        <span className="text-[9px] font-mono text-white/30 uppercase tracking-[0.3em] font-black">NAV</span>
      </div>
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onNavigate(item.hash)}
          className={`relative flex items-center gap-2.5 px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
            isActive(item.id)
              ? 'bg-neon text-black'
              : 'text-white/40 hover:text-white hover:bg-white/5'
          }`}
        >
          <item.icon className={`w-3 h-3 ${isActive(item.id) ? '' : ''}`} />
          <span>{item.label}</span>
          {item.badge && item.badge > 0 && (
            <span className="ml-auto px-1.5 py-0.5 bg-crimson text-white font-mono text-[8px] font-black">
              {item.badge}
            </span>
          )}
        </button>
      ))}
    </>
  );

  return (
    <>
      <aside className="hidden lg:flex w-44 bg-carbon/50 border-r border-white/10 flex-col py-6 px-3 gap-1 shrink-0 overflow-y-auto">
        {sidebarContent}
      </aside>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden pointer-events-none">
          <div className="absolute inset-0 top-[44px] bg-black/60 backdrop-blur-sm animate-fade-in pointer-events-auto" onClick={onClose} />
          <aside className="absolute left-0 top-[44px] bottom-0 w-52 bg-carbon/90 border-r border-white/10 flex flex-col py-3 px-2 gap-0.5 overflow-y-auto backdrop-blur-xl shadow-2xl animate-slide-in-left pointer-events-auto">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
