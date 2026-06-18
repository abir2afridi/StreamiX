import React, { useEffect, useState } from 'react';
import { Play, Heart, Flame, ShieldAlert, Award, Radio, Tv, Star, Users, Info } from 'lucide-react';
import { Channel, Category, HistoryEntry } from '../../types';
import { ChannelService } from '../../lib/services/ChannelService';
import { LocalStorageFavoriteRepository, LocalStorageHistoryRepository } from '../../lib/repositories/localStorage';
import { getChannelAccent } from '../../lib/utils/channelAccent';

interface HomeViewProps {
  onNavigate: (hash: string) => void;
}

export default function HomeView({ onNavigate }: HomeViewProps) {
  const channelService = new ChannelService();
  const favRepo = new LocalStorageFavoriteRepository();
  const historyRepo = new LocalStorageHistoryRepository();

  const [featured, setFeatured] = useState<Channel[]>([]);
  const [trending, setTrending] = useState<Channel[]>([]);
  const [bangladesh, setBangladesh] = useState<Channel[]>([]);
  const [sports, setSports] = useState<Channel[]>([]);
  const [movies, setMovies] = useState<Channel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [historyList, setHistoryList] = useState<Channel[]>([]);
  const [favoritesList, setFavoritesList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeFeaturedIndex, setActiveFeaturedIndex] = useState(0);

  useEffect(() => {
    const loadHomeData = async () => {
      setLoading(true);
      try {
        const cats = await channelService.getCategories();
        setCategories(cats);

        const feat = await channelService.getFeaturedChannels();
        setFeatured(feat.length ? feat : []);

        const trend = await channelService.getTrendingChannels();
        setTrending(trend.length ? trend : []);

        const favs = await favRepo.getAllFavorites();
        setFavoritesList(favs);

        const bdRes = await channelService.getChannels({ category: 'bangladesh', limit: 30 });
        setBangladesh(bdRes.channels);

        const spRes = await channelService.getChannels({ category: 'sports', limit: 30 });
        setSports(spRes.channels);

        const mvRes = await channelService.getChannels({ category: 'movies', limit: 30 });
        setMovies(mvRes.channels);

        const rawHistory = await historyRepo.getHistory();
        const allLocal = await channelService.getChannels({ limit: 100 });
        const matchedHistory = rawHistory
          .map((h) => allLocal.channels.find((c) => c.id === h.channelId))
          .filter(Boolean) as Channel[];
        setHistoryList(matchedHistory);
      } catch (e) {
        console.error('Home View Ingestion error:', e);
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-8 h-8 border-2 border-neon border-t-transparent animate-spin" />
        <p className="text-[10px] font-mono text-white/40 animate-pulse uppercase tracking-[0.2em]">INGESTING LIVE RAILS...</p>
      </div>
    );
  }

  const featuredChannel = featured[activeFeaturedIndex] || bangladesh[0] || sports[0];

  return (
    <div className="pt-8 space-y-12 pb-20 px-6 max-w-[1600px] mx-auto">
      {featuredChannel && (
        <div className="relative w-full aspect-[22/9] md:aspect-[3/1] overflow-hidden border border-white/10 bg-gradient-to-r from-obsidian via-carbon to-obsidian flex items-center justify-start group">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_right,rgba(0,212,255,0.05),transparent_70%)] z-0" />
          {featuredChannel.logo && (
            <div className="absolute right-12 md:right-24 top-0 bottom-0 my-auto h-36 w-36 md:h-52 md:w-52 flex items-center justify-center p-4 bg-white/[0.01] border border-white/10 group-hover:scale-105 transition-all duration-700">
              <img
                src={featuredChannel.logo}
                alt={featuredChannel.name}
                referrerPolicy="no-referrer"
                className="w-24 md:w-36 aspect-square object-contain opacity-30 group-hover:opacity-50 transition-opacity duration-700 grayscale group-hover:grayscale-0"
              />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-r from-obsidian via-obsidian/80 to-transparent z-0" />

          <div className="relative z-10 p-6 md:p-14 max-w-xl space-y-4">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-neon text-black text-[9px] font-black font-mono tracking-[0.2em]">
                SPOTLIGHT
              </span>
              <span className="text-[10px] text-white/40 font-mono tracking-[0.2em] flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-neon" /> {featuredChannel.viewCount + 150} WATCHING
              </span>
            </div>

            <h2 className="text-2xl md:text-4xl font-black font-display uppercase tracking-widest text-white">
              {featuredChannel.name}
            </h2>

            <p className="text-[11px] text-white/40 font-mono leading-relaxed line-clamp-2 md:line-clamp-3 uppercase tracking-[0.05em]">
              REAL-TIME LIVE BROADCAST • VERIFIED STREAM • LOW LATENCY
            </p>

            <div className="flex items-center gap-4 pt-2">
              <button
                onClick={() => onNavigate(`#/channels/${featuredChannel.slug}`)}
                className="px-6 py-3 bg-white text-black text-[11px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-neon hover:text-black transition cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-black" /> STREAM NOW
              </button>
              <button
                onClick={(e) => handleFavoriteToggle(featuredChannel.id, e)}
                className={`p-3 border transition-all duration-300 cursor-pointer ${
                  favoritesList.includes(featuredChannel.id)
                    ? 'bg-crimson/10 border-crimson/30 text-crimson'
                    : 'bg-carbon/50 border-white/10 text-white/40 hover:text-white hover:border-white/30'
                }`}
              >
                <Heart className="w-4 h-4" />
              </button>
            </div>
          </div>

          {featured.length > 1 && (
            <div className="absolute bottom-6 left-6 md:left-14 flex items-center gap-2 z-10">
              {featured.slice(0, 5).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveFeaturedIndex(idx)}
                  className={`h-0.5 transition-all duration-300 cursor-pointer ${
                    activeFeaturedIndex === idx ? 'w-8 bg-neon' : 'w-2 bg-white/10 hover:bg-white/30'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {categories.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
            <Radio className="w-4 h-4 text-neon" /> CATEGORIES
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {categories.map((cat) => (
              <div
                key={cat.id}
                onClick={() => onNavigate(`#/channels?category=${cat.id}`)}
                className="p-4 bg-carbon/80 backdrop-blur-xl border border-white/10 hover:border-neon/30 flex items-center gap-4 cursor-pointer group card-hover"
              >
                <div className="text-xl text-neon bg-neon/10 p-2.5 border border-neon/20 group-hover:bg-neon/20 transition-all">
                  {cat.icon || '🌐'}
                </div>
                <div className="min-w-0">
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-white group-hover:text-neon transition-all truncate">
                    {cat.name}
                  </h4>
                  <p className="text-[9px] text-white/30 font-mono mt-0.5 uppercase tracking-[0.2em]">{cat.count} CHANNELS</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {historyList.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
            <Flame className="w-4 h-4 text-neon" /> CONTINUE WATCHING
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {historyList.slice(0, 6).map((channel) => (
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

      {bangladesh.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-carbon/50 py-1.5 border border-white/5">
            <h3 className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
              <Star className="w-4 h-4 text-neon" /> BANGLADESH
            </h3>
            <button
              onClick={() => onNavigate('#/channels?category=bangladesh')}
              className="text-[9px] font-mono font-black text-neon hover:text-white transition tracking-[0.2em] uppercase p-1 cursor-pointer"
            >
              VIEW ALL ({bangladesh.length})
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {bangladesh.slice(0, 12).map((channel) => (
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

      {sports.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-carbon/50 py-1.5 border border-white/5">
            <h3 className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
              <Award className="w-4 h-4 text-neon" /> SPORTS
            </h3>
            <button
              onClick={() => onNavigate('#/channels?category=sports')}
              className="text-[9px] font-mono font-black text-neon hover:text-white transition tracking-[0.2em] uppercase p-1 cursor-pointer"
            >
              VIEW ALL ({sports.length})
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {sports.slice(0, 12).map((channel) => (
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

      {movies.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-carbon/50 py-1.5 border border-white/5">
            <h3 className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
              <Star className="w-4 h-4 text-neon" /> MOVIES
            </h3>
            <button
              onClick={() => onNavigate('#/channels?category=movies')}
              className="text-[9px] font-mono font-black text-neon hover:text-white transition tracking-[0.2em] uppercase p-1 cursor-pointer"
            >
              VIEW ALL ({movies.length})
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {movies.slice(0, 12).map((channel) => (
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

interface CardProps {
  key?: any;
  channel: Channel;
  isFav: boolean;
  onFavToggle: (id: string, e: React.MouseEvent) => void;
  onPlay: () => void;
}

export function ChannelCard({ channel, isFav, onFavToggle, onPlay }: CardProps) {
  const accent = getChannelAccent(channel.name);
  const isHealthy = channel.healthScore >= 75;

  return (
    <div
      onClick={onPlay}
      className="bg-carbon/80 backdrop-blur-xl border border-white/10 cursor-pointer flex flex-col group card-hover overflow-hidden"
    >
      <div
        className="relative w-full aspect-[16/9] flex items-center justify-center overflow-hidden"
        style={{ backgroundColor: `${accent}12` }}
      >
        {channel.logo ? (
          <img
            src={channel.logo}
            alt={channel.name}
            referrerPolicy="no-referrer"
            className="h-auto max-h-[60%] w-4/5 object-contain opacity-60 grayscale group-hover:opacity-100 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
          />
        ) : (
          <span
            className="font-display font-black text-2xl tracking-widest"
            style={{ color: accent }}
          >
            {channel.name.slice(0, 3).toUpperCase()}
          </span>
        )}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/40">
          <span className="p-3 text-white" style={{ backgroundColor: accent }}>
            <Play className="w-5 h-5 fill-white" />
          </span>
        </div>
        <div
          className="absolute top-2.5 left-2.5 h-2.5 w-2.5"
          style={{ backgroundColor: accent, boxShadow: isHealthy ? `0 0 6px ${accent}80` : 'none' }}
        />
        <button
          onClick={(e) => onFavToggle(channel.id, e)}
          style={{ '--fav-accent': accent } as React.CSSProperties}
          className="absolute top-2.5 right-2.5 p-1.5 bg-carbon/80 border border-white/10 text-white/30 hover:text-[var(--fav-accent)] hover:border-[var(--fav-accent)] transition cursor-pointer z-10"
        >
          <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-crimson text-crimson' : ''}`} />
        </button>
      </div>

      <div className="p-3.5 border-t border-white/10 flex items-center gap-3">
        {channel.logo && (
          <img
            src={channel.logo}
            alt={channel.name}
            referrerPolicy="no-referrer"
            className="h-9 w-16 object-contain shrink-0 opacity-80"
          />
        )}
        <div className="min-w-0 flex-1">
          <h4
            className="text-xs font-black uppercase tracking-widest truncate transition duration-300 text-white"
            style={{ '--hover-accent': accent } as React.CSSProperties}
          >
            <span className="group-hover:text-[var(--hover-accent)]">{channel.name}</span>
          </h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[9px] font-black font-mono text-white/30 uppercase tracking-[0.2em] truncate">
              {channel.category}
            </span>
            <span className="text-[8px] font-black font-mono text-white/40 px-1 bg-white/5 border border-white/10">
              {channel.isHD ? '1080P' : '720P'}
            </span>
            <span className="text-[8px] font-black font-mono text-white/30">
              {channel.healthScore}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
