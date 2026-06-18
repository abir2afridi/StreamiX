import React, { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Channel } from '../../types';
import { ChannelService } from '../../lib/services/ChannelService';
import { LocalStorageFavoriteRepository } from '../../lib/repositories/localStorage';
import { ChannelCard } from './HomeView';

interface SearchViewProps {
  onNavigate: (hash: string) => void;
}

export default function SearchView({ onNavigate }: SearchViewProps) {
  const channelService = new ChannelService();
  const favRepo = new LocalStorageFavoriteRepository();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Channel[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [favoritesList, setFavoritesList] = useState<string[]>([]);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
    favRepo.getAllFavorites().then(setFavoritesList);
    window.addEventListener('favorites-sync', handleSync);
    return () => window.removeEventListener('favorites-sync', handleSync);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setTotal(0);
      setSearched(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setSearched(true);
      const res = await channelService.getChannels({ q: query, limit: 50 });
      setResults(res.channels);
      setTotal(res.total);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSync = () => {
    favRepo.getAllFavorites().then(setFavoritesList);
  };

  const handleFavoriteToggle = async (channelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isFav = favoritesList.includes(channelId);
    if (isFav) {
      await favRepo.removeFavorite(channelId);
      setFavoritesList((prev) => prev.filter((id) => id !== channelId));
    } else {
      await favRepo.addFavorite(channelId);
      setFavoritesList((prev) => [...prev, channelId]);
    }
    window.dispatchEvent(new Event('favorites-sync'));
  };

  return (
    <div className="pt-8 space-y-6 pb-20 px-6 max-w-[1600px] mx-auto">
      <div className="flex items-center gap-3 bg-carbon/80 backdrop-blur-xl border border-white/10 p-4">
        <Search className="w-5 h-5 text-neon shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="TYPE TO SEARCH CHANNELS..."
          className="flex-1 bg-transparent border-none outline-none text-white text-sm font-mono uppercase tracking-widest placeholder:text-white/20"
        />
        {query && (
          <button onClick={() => setQuery('')} className="text-white/30 hover:text-white transition cursor-pointer p-1">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {!searched && !loading && (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
          <Search className="w-12 h-12 text-white/10" />
          <p className="text-[11px] font-mono text-white/30 uppercase tracking-[0.2em]">TYPE TO SEARCH</p>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center min-h-[30vh] gap-3">
          <div className="w-8 h-8 border-2 border-neon border-t-transparent animate-spin" />
          <p className="text-[10px] font-mono text-white/40 animate-pulse uppercase tracking-[0.2em]">SEARCHING...</p>
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="flex flex-col items-center justify-center min-h-[30vh] gap-4">
          <p className="text-[11px] font-mono text-white/30 uppercase tracking-[0.2em]">NO RESULTS FOUND</p>
          <p className="text-[9px] font-mono text-white/20">TRY A DIFFERENT SEARCH TERM</p>
        </div>
      )}

      {!loading && searched && results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em]">RESULTS</span>
            <span className="px-1.5 py-0.5 bg-neon/10 border border-neon/20 text-neon text-[9px] font-mono font-black">
              {total}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {results.map((channel) => (
              <ChannelCard
                key={channel.id}
                channel={channel}
                isFav={favoritesList.includes(channel.id)}
                onFavToggle={handleFavoriteToggle}
                onPlay={() => onNavigate(`#/channels/${channel.slug}`)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
