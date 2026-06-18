import React, { useEffect, useState } from 'react';
import { Globe, Radio, MapPin } from 'lucide-react';
import { Category, Country } from '../../types';
import { ChannelService } from '../../lib/services/ChannelService';

interface CategoriesViewProps {
  onNavigate: (hash: string) => void;
}

export default function CategoriesView({ onNavigate }: CategoriesViewProps) {
  const channelService = new ChannelService();

  const [categories, setCategories] = useState<Category[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const cats = await channelService.getCategories();
      const cntrs = await channelService.getCountries();
      setCategories(cats);
      setCountries(cntrs);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-8 h-8 border-2 border-neon border-t-transparent animate-spin" />
        <p className="text-[10px] font-mono text-white/40 animate-pulse uppercase tracking-[0.2em]">LOADING CATALOG...</p>
      </div>
    );
  }

  return (
    <div className="pt-8 space-y-12 pb-20 px-6 max-w-[1600px] mx-auto">
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

      <div className="space-y-4">
        <h3 className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
          <MapPin className="w-4 h-4 text-neon" /> COUNTRIES
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {countries.map((c) => (
            <div
              key={c.id}
              onClick={() => onNavigate(`#/channels?country=${c.id}`)}
              className="p-4 bg-carbon/80 backdrop-blur-xl border border-white/10 hover:border-neon/30 flex items-center gap-4 cursor-pointer group card-hover"
            >
              <div className="text-xl bg-neon/10 p-2.5 border border-neon/20 group-hover:bg-neon/20 transition-all">
                {c.flag || '🌍'}
              </div>
              <div className="min-w-0">
                <h4 className="text-[11px] font-black uppercase tracking-widest text-white group-hover:text-neon transition-all truncate">
                  {c.name}
                </h4>
                <p className="text-[9px] text-white/30 font-mono mt-0.5 uppercase tracking-[0.2em]">{c.code}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
