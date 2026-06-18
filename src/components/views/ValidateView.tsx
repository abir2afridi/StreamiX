import React, { useState, useEffect, useRef } from 'react';
import { Link2, Check, AlertCircle } from 'lucide-react';
import { Channel } from '../../types';
import { ChannelService } from '../../lib/services/ChannelService';

interface ValidateViewProps {
  onNavigate: (hash: string) => void;
}

export default function ValidateView({ onNavigate }: ValidateViewProps) {
  const channelService = new ChannelService();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'working' | 'broken'>('working');
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    channelService.getChannels({ limit: 500 }).then((res) => {
      setChannels(res.channels);
      setLoading(false);
    });
  }, []);

  const working = channels.filter((c) => c.healthScore >= 40);
  const broken = channels.filter((c) => c.healthScore < 40);

  const filtered = (activeTab === 'working' ? working : broken).filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCopy = (key: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const getHealthColor = (score: number) => {
    if (score >= 75) return 'text-green-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getPriorityLabel = (p: 1 | 2 | 3) => {
    switch (p) {
      case 1: return 'PRIMARY';
      case 2: return 'BACKUP';
      case 3: return 'EMERGENCY';
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-neon text-[11px] font-mono animate-pulse">SCANNING CHANNELS...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-6 gap-6 overflow-y-auto">
      <div className="flex items-center gap-4">
        <input
          ref={inputRef}
          type="text"
          placeholder="FILTER CHANNELS..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-carbon/80 border border-white/10 px-4 py-2.5 text-[11px] font-mono text-white placeholder-white/20 outline-none focus:border-neon/50 transition-colors uppercase tracking-widest"
        />
        <div className="flex gap-2">
          <button
            onClick={() => { setActiveTab('working'); setSearch(''); }}
            className={`px-4 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'working'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'text-white/40 border border-white/10 hover:bg-white/5'
            }`}
          >
            WORKING ({working.length})
          </button>
          <button
            onClick={() => { setActiveTab('broken'); setSearch(''); }}
            className={`px-4 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'broken'
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'text-white/40 border border-white/10 hover:bg-white/5'
            }`}
          >
            BROKEN ({broken.length})
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="flex items-center justify-center h-32 text-white/20 text-[11px] font-mono gap-2">
            <AlertCircle className="w-4 h-4" />
            NO CHANNELS FOUND
          </div>
        )}
        {filtered.map((channel) => (
          <div
            key={channel.id}
            className="bg-carbon/80 backdrop-blur-xl border border-white/10 p-5 space-y-3"
          >
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="text-sm font-black uppercase tracking-widest text-white">
                {channel.name}
              </h3>
              <span className="px-2 py-0.5 bg-white/5 text-[9px] font-mono text-white/50 uppercase tracking-wider border border-white/10">
                {channel.category}
              </span>
              <span className={`text-[10px] font-mono font-black ${getHealthColor(channel.healthScore)}`}>
                {channel.healthScore}%
              </span>
            </div>

            <div className="space-y-2">
              {channel.streams.map((stream, idx) => {
                const key = `${channel.id}-${idx}`;
                const isWorking = activeTab === 'working';
                return (
                  <div key={key} className="flex items-center gap-2 group">
                    <span className={`text-[10px] font-mono truncate flex-1 ${
                      isWorking ? 'text-green-300/70' : 'text-red-300/70'
                    }`}>
                      {stream.url}
                    </span>
                    <span className="text-[8px] font-mono text-white/30 uppercase tracking-wider shrink-0">
                      {getPriorityLabel(stream.priority)}
                    </span>
                    {stream.tokenRequired && (
                      <span className="text-[8px] font-mono text-yellow-400/60 uppercase tracking-wider shrink-0">
                        TOKEN
                      </span>
                    )}
                    <button
                      onClick={() => handleCopy(key, stream.url)}
                      className="p-1 text-white/30 hover:text-neon transition-colors shrink-0"
                      title="Copy URL"
                    >
                      {copiedId === key ? (
                        <Check className="w-3 h-3 text-green-400" />
                      ) : (
                        <Link2 className="w-3 h-3" />
                      )}
                    </button>
                    {copiedId === key && (
                      <span className="text-[8px] font-mono text-green-400 shrink-0">
                        COPIED
                      </span>
                    )}
                  </div>
                );
              })}
              {channel.streams.length === 0 && (
                <p className="text-[10px] text-white/20 font-mono italic">NO STREAMS</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
