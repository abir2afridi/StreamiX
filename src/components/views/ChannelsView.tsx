import React, { useEffect, useState } from 'react';
import { Search, Grid, List, SlidersHorizontal, Eye, Heart, RefreshCw, Star } from 'lucide-react';
import { Channel, Category, Country } from '../../types';
import { ChannelService } from '../../lib/services/ChannelService';
import { LocalStorageFavoriteRepository } from '../../lib/repositories/localStorage';
import { ChannelCard } from './HomeView';

interface ChannelsViewProps {
  initialQuery?: string;
  initialCategory?: string;
  onNavigate: (hash: string) => void;
}

export default function ChannelsView({ initialQuery = '', initialCategory = 'all', onNavigate }: ChannelsViewProps) {
  const channelService = new ChannelService();
  const favRepo = new LocalStorageFavoriteRepository();

  const [channels, setChannels] = useState<Channel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [favoritesList, setFavoritesList] = useState<string[]>([]);

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [activeCountry, setActiveCountry] = useState('all');
  const [onlyHD, setOnlyHD] = useState(false);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 24;

  useEffect(() => {
    setSearchQuery(initialQuery);
    setActiveCategory(initialCategory);
  }, [initialQuery, initialCategory]);

  useEffect(() => {
    const loadSideOptions = async () => {
      try {
        const cats = await channelService.getCategories();
        setCategories(cats);
        const countriesList = await channelService.getCountries();
        setCountries(countriesList);
        const favs = await favRepo.getAllFavorites();
        setFavoritesList(favs);
      } catch (err) {
        console.error('Failure loading grid configs:', err);
      }
    };
    loadSideOptions();
  }, []);

  const loadGridChannels = async () => {
    setLoading(true);
    try {
      const result = await channelService.getChannels({
        category: activeCategory,
        country: activeCountry,
        q: searchQuery,
        page,
        limit,
      });

      let loaded = result.channels;
      if (onlyHD) {
        loaded = loaded.filter((c) => c.isHD);
      }

      setChannels(loaded);
      setTotalPages(result.totalPages || 1);
    } catch (e) {
      console.error('Error fetching grid channels:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGridChannels();
  }, [activeCategory, activeCountry, searchQuery, onlyHD, page]);

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

  const handleClearFilters = () => {
    setSearchQuery('');
    setActiveCategory('all');
    setActiveCountry('all');
    setOnlyHD(false);
    setPage(1);
  };

  return (
    <div className="space-y-8 pb-20 px-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 border-b border-white/10 pb-5">
        <div>
          <h2 className="text-xl font-black font-display uppercase tracking-widest text-white">CHANNEL DIRECTORY</h2>
          <p className="text-[10px] text-white/30 font-mono uppercase tracking-[0.2em] mt-1">
            {channels.length} VERIFIED STREAMS
          </p>
        </div>

        <div className="flex items-center gap-2 relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-white/30 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            placeholder="SEARCH..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-carbon/50 border border-white/10 text-[11px] text-white placeholder-white/30 font-mono uppercase tracking-widest focus:border-neon/30 focus:shadow-[0_0_12px_rgba(0,212,255,0.08)] transition-all duration-300"
          />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <aside className="w-full lg:w-64 space-y-6 bg-carbon/80 backdrop-blur-xl border border-white/10 p-5 h-fit">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
              <SlidersHorizontal className="w-3 h-3 text-neon" /> FILTERS
            </h3>
            <button
              onClick={handleClearFilters}
              className="text-[9px] font-mono font-black text-white/30 hover:text-neon transition uppercase tracking-[0.2em] cursor-pointer"
            >
              RESET
            </button>
          </div>

          <hr className="border-white/10" />

          <div className="space-y-2.5">
            <label className="text-[8px] font-mono font-black text-white/30 uppercase tracking-[0.3em]">CATEGORY</label>
            <div className="space-y-px max-h-56 overflow-y-auto pr-1">
              <button
                onClick={() => {
                  setActiveCategory('all');
                  setPage(1);
                }}
                className={`w-full text-left px-3 py-2 text-[11px] font-black uppercase tracking-widest flex items-center justify-between transition-all duration-250 cursor-pointer ${
                  activeCategory === 'all' 
                    ? 'bg-neon text-black' 
                    : 'text-white/40 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span>ALL STREAMS</span>
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setPage(1);
                  }}
                  className={`w-full text-left px-3 py-2 text-[11px] font-black uppercase tracking-widest flex items-center justify-between transition-all duration-250 cursor-pointer ${
                    activeCategory === cat.id 
                      ? 'bg-neon text-black' 
                      : 'text-white/40 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="truncate">{cat.name}</span>
                  <span className={`text-[8px] font-black font-mono px-1.5 py-0.5 ${activeCategory === cat.id ? 'bg-black/20 text-black' : 'bg-white/10 text-white/30'}`}>
                    {cat.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <hr className="border-white/10" />

          <div className="space-y-2.5">
            <label className="text-[8px] font-mono font-black text-white/30 uppercase tracking-[0.3em]">REGION</label>
            <div className="space-y-px max-h-56 overflow-y-auto pr-1">
              <button
                onClick={() => {
                  setActiveCountry('all');
                  setPage(1);
                }}
                className={`w-full text-left px-3 py-2 text-[11px] font-black uppercase tracking-widest flex items-center gap-2.5 transition-all duration-255 cursor-pointer ${
                  activeCountry === 'all' 
                    ? 'bg-neon text-black' 
                    : 'text-white/40 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span>ALL REGIONS</span>
              </button>
              {countries.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setActiveCountry(c.id);
                    setPage(1);
                  }}
                  className={`w-full text-left px-3 py-2 text-[11px] font-black uppercase tracking-widest flex items-center gap-2.5 transition-all duration-255 cursor-pointer ${
                    activeCountry === c.id 
                      ? 'bg-neon text-black' 
                      : 'text-white/40 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span>{c.flag}</span>
                  <span className="truncate">{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          <hr className="border-white/10" />

          <div className="space-y-3">
            <label className="text-[8px] font-mono font-black text-white/30 uppercase tracking-[0.3em]">FORMAT</label>
            <label className="flex items-center gap-3 px-1.5 py-1 text-[11px] text-white/40 hover:text-white cursor-pointer select-none group">
              <input
                type="checkbox"
                checked={onlyHD}
                onChange={(e) => {
                  setOnlyHD(e.target.checked);
                  setPage(1);
                }}
                className="accent-neon h-4 w-4 bg-carbon border-white/20"
              />
              <span className="group-hover:text-white transition-colors uppercase tracking-widest font-black text-[10px]">HD ONLY</span>
            </label>
          </div>
        </aside>

        <main className="flex-1 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
              <div className="w-8 h-8 border-2 border-neon border-t-transparent animate-spin" />
              <p className="text-[10px] font-mono text-white/40 animate-pulse uppercase tracking-[0.2em]">FILTERING STREAMS...</p>
            </div>
          ) : channels.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-12 bg-carbon/50 border border-white/10 min-h-[40vh]">
              <Eye className="w-12 h-12 text-white/20 mb-4" />
              <h3 className="text-sm font-black uppercase tracking-widest text-white/50">NO MATCHES</h3>
              <p className="text-[10px] text-white/30 max-w-sm mt-1.5 mb-6 leading-relaxed font-mono uppercase tracking-[0.1em]">
                NO CHANNELS MATCH YOUR FILTERS
              </p>
              <button
                onClick={handleClearFilters}
                className="px-5 py-2.5 bg-white text-black text-[11px] font-black uppercase tracking-widest hover:bg-neon transition cursor-pointer"
              >
                CLEAR FILTERS
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {channels.map((chan) => (
                  <ChannelCard
                    key={chan.id}
                    channel={chan}
                    isFav={favoritesList.includes(chan.id)}
                    onFavToggle={handleFavoriteToggle}
                    onPlay={() => onNavigate(`#/channels/${chan.slug}`)}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 pt-6 border-t border-white/10">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    className="px-4 py-2 bg-carbon/50 border border-white/10 disabled:opacity-30 text-[11px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:border-white/30 disabled:pointer-events-none transition cursor-pointer"
                  >
                    PREV
                  </button>
                  <span className="text-[10px] font-mono text-white/30 font-black bg-white/5 px-3 py-1 border border-white/10">
                    {page} / {totalPages}
                  </span>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                    className="px-4 py-2 bg-carbon/50 border border-white/10 disabled:opacity-30 text-[11px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:border-white/30 disabled:pointer-events-none transition cursor-pointer"
                  >
                    NEXT
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
