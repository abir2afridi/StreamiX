import React, { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { Channel } from '../../types';
import { ChannelService } from '../../lib/services/ChannelService';
import { LocalStorageFavoriteRepository } from '../../lib/repositories/localStorage';
import { ChannelCard } from './HomeView';

interface FavoritesViewProps {
  onNavigate: (hash: string) => void;
}

export default function FavoritesView({ onNavigate }: FavoritesViewProps) {
  const channelService = new ChannelService();
  const favRepo = new LocalStorageFavoriteRepository();

  const [channels, setChannels] = useState<Channel[]>([]);
  const [favoritesList, setFavoritesList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const favs = await favRepo.getAllFavorites();
      setFavoritesList(favs);

      const all = await channelService.getChannels({ limit: 100 });
      const matched = all.channels.filter((chan) => favs.includes(chan.id));
      setChannels(matched);
    } catch (e) {
      console.error('Error fetching favorites:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  const handleFavoriteToggle = async (channelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await favRepo.removeFavorite(channelId);
    setFavoritesList((prev) => prev.filter((id) => id !== channelId));
    setChannels((prev) => prev.filter((c) => c.id !== channelId));
    window.dispatchEvent(new Event('favorites-sync'));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 border-2 border-neon border-t-transparent animate-spin" />
        <p className="text-[10px] font-mono text-white/40 animate-pulse uppercase tracking-[0.2em]">LOADING FAVORITES...</p>
      </div>
    );
  }

  return (
    <div className="pt-8 space-y-8 pb-20 px-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col border-b border-white/10 pb-5">
        <h2 className="text-xl font-black font-display uppercase tracking-widest text-white flex items-center gap-2">
          <Heart className="w-5 h-5 text-crimson fill-crimson" /> FAVORITES
        </h2>
        <p className="text-[10px] text-white/30 font-mono uppercase tracking-[0.2em] mt-1">
          {channels.length} SAVED CHANNELS
        </p>
      </div>

      {channels.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-12 bg-carbon/50 border border-white/10 min-h-[40vh]">
          <Heart className="w-12 h-12 text-white/20 mb-4" />
          <h3 className="text-sm font-black uppercase tracking-widest text-white/50">NO FAVORITES</h3>
          <p className="text-[10px] text-white/30 max-w-sm mt-1.5 mb-6 font-mono uppercase tracking-[0.1em]">
            YOU HAVEN'T SAVED ANY CHANNELS YET
          </p>
          <button
            onClick={() => onNavigate('#/channels')}
            className="px-5 py-2.5 bg-white text-black text-[11px] font-black uppercase tracking-widest hover:bg-neon transition cursor-pointer"
          >
            EXPLORE CHANNELS
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {channels.map((chan) => (
            <ChannelCard
              key={chan.id}
              channel={chan}
              isFav={true}
              onFavToggle={handleFavoriteToggle}
              onPlay={() => onNavigate(`#/channels/${chan.slug}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
