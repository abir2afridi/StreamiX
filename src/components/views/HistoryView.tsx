import React, { useEffect, useState } from 'react';
import { History, Trash2, Play } from 'lucide-react';
import { Channel } from '../../types';
import { ChannelService } from '../../lib/services/ChannelService';
import { LocalStorageHistoryRepository } from '../../lib/repositories/localStorage';

interface HistoryViewProps {
  onNavigate: (hash: string) => void;
}

export default function HistoryView({ onNavigate }: HistoryViewProps) {
  const channelService = new ChannelService();
  const historyRepo = new LocalStorageHistoryRepository();

  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const historyList = await historyRepo.getHistory();
      const all = await channelService.getChannels({ limit: 100 });
      
      const matched = historyList
        .map((h) => all.channels.find((c) => c.id === h.channelId))
        .filter(Boolean) as Channel[];
        
      setChannels(matched);
    } catch (e) {
      console.error('History fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleClearHistory = async () => {
    if (confirm('Clear watch history?')) {
      await historyRepo.clearHistory();
      setChannels([]);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 border-2 border-neon border-t-transparent animate-spin" />
        <p className="text-[10px] font-mono text-white/40 animate-pulse uppercase tracking-[0.2em]">LOADING HISTORY...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 px-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between border-b border-white/10 pb-5">
        <div>
          <h2 className="text-xl font-black font-display uppercase tracking-widest text-white flex items-center gap-2">
            <History className="w-5 h-5 text-neon" /> HISTORY
          </h2>
          <p className="text-[10px] text-white/30 font-mono uppercase tracking-[0.2em] mt-1">
            {channels.length} RECENT STREAMS
          </p>
        </div>

        {channels.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="px-4 py-2 bg-crimson/10 border border-crimson/30 text-crimson text-[10px] font-black uppercase tracking-widest hover:bg-crimson/20 transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 inline mr-1" /> CLEAR
          </button>
        )}
      </div>

      {channels.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-12 bg-carbon/50 border border-white/10 min-h-[40vh]">
          <History className="w-12 h-12 text-white/20 mb-4" />
          <h3 className="text-sm font-black uppercase tracking-widest text-white/50">HISTORY EMPTY</h3>
          <p className="text-[10px] text-white/30 max-w-sm mt-1.5 mb-6 font-mono uppercase tracking-[0.1em]">
            NO WATCH HISTORY YET
          </p>
          <button
            onClick={() => onNavigate('#/channels')}
            className="px-5 py-2.5 bg-white text-black text-[11px] font-black uppercase tracking-widest hover:bg-neon transition cursor-pointer"
          >
            START STREAMING
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {channels.map((chan) => (
            <div
              key={chan.id}
              onClick={() => onNavigate(`#/channels/${chan.slug}`)}
              className="p-5 bg-carbon/80 backdrop-blur-xl border border-white/10 hover:border-neon/30 hover:bg-white/5 flex items-center justify-between cursor-pointer group card-hover"
            >
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-obsidian border border-white/10 h-12 w-12 flex items-center justify-center shrink-0">
                  {chan.logo ? (
                    <img src={chan.logo} alt={chan.name} referrerPolicy="no-referrer" className="h-full w-full object-contain grayscale group-hover:grayscale-0 transition-all duration-300" />
                  ) : (
                    <span className="font-display font-black text-neon text-xs">{chan.name.slice(0, 3).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-white group-hover:text-neon transition-colors duration-250">
                    {chan.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[8px] font-mono font-black text-white/30 uppercase tracking-[0.2em]">{chan.category}</span>
                    <span className="text-white/10 text-[10px]">/</span>
                    <span className="text-[8px] font-mono text-white/30 uppercase tracking-[0.2em]">{chan.healthScore}%</span>
                  </div>
                </div>
              </div>

              <button className="p-3 bg-neon/10 border border-neon/20 text-neon hover:bg-neon hover:text-black transition-all duration-300 cursor-pointer">
                <Play className="w-4 h-4 fill-current" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
