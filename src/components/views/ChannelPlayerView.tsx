import React, { useEffect, useState } from 'react';
import { Heart, Share2, AlertCircle, Info, Calendar, Radio, Sparkles, Check, ChevronRight } from 'lucide-react';
import { Channel, EPGProgram } from '../../types';
import { ChannelService } from '../../lib/services/ChannelService';
import { EPGService } from '../../lib/services/EPGService';
import { LocalStorageFavoriteRepository, LocalStorageHistoryRepository } from '../../lib/repositories/localStorage';
import VideoPlayer from '../player/VideoPlayer';

interface ChannelPlayerViewProps {
  slug: string;
  onNavigate: (hash: string) => void;
}

export default function ChannelPlayerView({ slug, onNavigate }: ChannelPlayerViewProps) {
  const channelService = new ChannelService();
  const epgService = new EPGService();
  const favRepo = new LocalStorageFavoriteRepository();
  const historyRepo = new LocalStorageHistoryRepository();

  const [channel, setChannel] = useState<Channel | null>(null);
  const [epgData, setEpgData] = useState<EPGProgram[]>([]);
  const [currentProgram, setCurrentProgram] = useState<EPGProgram | null>(null);
  const [related, setRelated] = useState<Channel[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);

  const [theaterMode, setTheaterMode] = useState(false);
  const [shared, setShared] = useState(false);
  const [reported, setReported] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const fetchAllChannelData = async () => {
      setLoading(true);
      try {
        const chan = await channelService.getChannelBySlug(slug);
        if (!chan) {
          setChannel(null);
          return;
        }
        setChannel(chan);

        const fav = await favRepo.isFavorite(chan.id);
        setIsFavorite(fav);

        const { programs, current } = await epgService.getEPG(chan.id);
        setEpgData(programs);
        setCurrentProgram(current);

        await historyRepo.addEntry({
          channelId: chan.id,
          watchedAt: new Date().toISOString(),
          duration: 0,
        });

        const relRes = await channelService.getChannels({ category: chan.category, limit: 12 });
        setRelated(relRes.channels.filter((c) => c.slug !== slug).slice(0, 8));
      } catch (e) {
        console.error('Core player loader error:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchAllChannelData();
  }, [slug]);

  useEffect(() => {
    if (!currentProgram) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const start = new Date(currentProgram.startTime).getTime();
      const end = new Date(currentProgram.endTime).getTime();
      
      const total = end - start;
      const elapsed = now - start;
      const percent = Math.min(Math.max((elapsed / total) * 100, 0), 100);
      setProgress(percent);
    }, 1000);

    return () => clearInterval(interval);
  }, [currentProgram]);

  const handleFavoriteToggle = async () => {
    if (!channel) return;
    if (isFavorite) {
      await favRepo.removeFavorite(channel.id);
      setIsFavorite(false);
    } else {
      await favRepo.addFavorite(channel.id);
      setIsFavorite(true);
    }
    window.dispatchEvent(new Event('favorites-sync'));
  };

  const handleWebShare = async () => {
    if (!channel) return;
    const shareUrl = `${window.location.origin}${window.location.pathname}#/channels/${channel.slug}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Watch ${channel.name} on STREAMIX`,
          text: `Streaming: ${currentProgram?.title || 'Live Broadcast'}`,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setShared(true);
        setTimeout(() => setShared(false), 3000);
      }
    } catch {
      navigator.clipboard.writeText(shareUrl);
      setShared(true);
      setTimeout(() => setShared(false), 3000);
    }
  };

  const handleReportBroken = () => {
    setReported(true);
    setTimeout(() => setReported(false), 5000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-8 h-8 border-2 border-neon border-t-transparent animate-spin" />
        <p className="text-[10px] font-mono text-white/40 animate-pulse uppercase tracking-[0.2em]">ESTABLISHING STREAM...</p>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-12 space-y-4">
        <AlertCircle className="w-16 h-16 text-crimson" />
        <h3 className="text-lg font-black font-display uppercase tracking-widest text-white">CHANNEL NOT FOUND</h3>
        <p className="text-[10px] text-white/40 font-mono uppercase tracking-[0.1em] max-w-sm">
          THIS CHANNEL MAY HAVE BEEN REMOVED OR IS CURRENTLY UNAVAILABLE
        </p>
        <button
          onClick={() => onNavigate('#/channels')}
          className="px-5 py-2 bg-white text-black text-[11px] font-black uppercase tracking-widest hover:bg-neon transition cursor-pointer"
        >
          RETURN TO CATALOG
        </button>
      </div>
    );
  }

  const upcomingPrograms = epgData.filter((p) => new Date(p.startTime) > new Date()).slice(0, 5);

  return (
    <div className={`pt-8 space-y-6 pb-20 ${theaterMode ? 'px-0' : 'px-6'}`}>
      <VideoPlayer
        streams={channel.streams}
        channelName={channel.name}
        autoplay={true}
        theaterMode={theaterMode}
        setTheaterMode={setTheaterMode}
      />

      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 ${theaterMode ? 'px-6' : ''}`}>
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-carbon/80 backdrop-blur-xl border border-white/10 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-obsidian border border-white/10 h-18 w-18 flex items-center justify-center overflow-hidden shrink-0">
                {channel.logo ? (
                  <img src={channel.logo} alt={channel.name} referrerPolicy="no-referrer" className="h-full w-full object-contain grayscale hover:grayscale-0 transition-all duration-300" />
                ) : (
                  <span className="font-display font-black text-neon text-lg">{channel.name.slice(0, 2).toUpperCase()}</span>
                )}
              </div>
              <div>
                <h2 className="text-xl font-black font-display uppercase tracking-widest text-white">{channel.name}</h2>
                <div className="flex items-wrap gap-2 mt-1.5">
                  <span className="px-2 py-0.5 bg-white/10 text-white/60 font-mono text-[9px] font-black uppercase tracking-[0.2em]">
                    {channel.category}
                  </span>
                  <span className="px-2 py-0.5 bg-white/5 text-white/40 font-mono text-[9px] font-black uppercase tracking-[0.2em]">
                    {channel.country}
                  </span>
                  <span className={`px-2 py-0.5 font-mono text-[9px] font-black uppercase tracking-[0.2em] ${
                    channel.healthScore >= 80 
                      ? 'bg-neon/10 text-neon border border-neon/20' 
                      : 'bg-crimson/10 text-crimson border border-crimson/20'
                  }`}>
                    {channel.healthScore >= 80 ? 'OPTIMAL' : 'DEGRADED'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleFavoriteToggle}
                className={`flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest border transition ${
                  isFavorite
                    ? 'bg-crimson/10 border-crimson/30 text-crimson'
                    : 'bg-carbon/50 border-white/10 text-white/40 hover:text-white hover:border-white/30'
                } cursor-pointer`}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-crimson text-crimson' : ''}`} />
                {isFavorite ? 'SAVED' : 'FAVORITE'}
              </button>

              <button
                onClick={handleWebShare}
                className={`flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest border transition ${
                  shared
                    ? 'bg-neon/10 border-neon/30 text-neon'
                    : 'bg-carbon/50 border-white/10 text-white/40 hover:text-white hover:border-white/30'
                } cursor-pointer`}
              >
                {shared ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                {shared ? 'COPIED' : 'SHARE'}
              </button>

              <button
                onClick={handleReportBroken}
                className={`p-2 border transition ${
                  reported
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    : 'bg-carbon/50 border-white/10 text-white/40 hover:text-white'
                } cursor-pointer`}
                title="REPORT"
              >
                <AlertCircle className="w-4 h-4" />
              </button>
            </div>
          </div>

          {reported && (
            <div className="p-4 bg-crimson/10 border border-crimson/30 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-crimson shrink-0" />
              <p className="text-[10px] text-crimson font-mono uppercase tracking-[0.1em]">
                REPORT LOGGED • ENGINE TESTING FAILOVERS
              </p>
            </div>
          )}

          <div className="bg-carbon/80 backdrop-blur-xl border border-white/10 p-5 space-y-4">
            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-neon" /> PROGRAM GUIDE
            </h3>

            {currentProgram ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-start gap-4">
                    <h4 className="text-base font-black font-display uppercase tracking-widest text-white">
                      {currentProgram.title}
                    </h4>
                    <span className="px-1.5 py-0.5 bg-crimson text-white font-mono text-[8px] font-black animate-pulse">
                      LIVE
                    </span>
                  </div>
                  {currentProgram.description && (
                    <p className="text-[11px] text-white/40 font-mono leading-relaxed uppercase tracking-[0.05em]">
                      {currentProgram.description}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="w-full bg-obsidian h-1">
                    <div className="bg-neon h-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="flex justify-between text-[9px] font-mono text-white/30 font-black uppercase tracking-[0.2em]">
                    <span>{new Date(currentProgram.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span>{Math.round(progress)}%</span>
                    <span>{new Date(currentProgram.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-white/30 font-mono uppercase tracking-[0.1em]">NO EPG DATA AVAILABLE</p>
            )}

            {upcomingPrograms.length > 0 && (
              <div className="pt-4 border-t border-white/10 space-y-3">
                <label className="text-[8px] font-mono font-black text-white/30 uppercase tracking-[0.3em]">UPCOMING</label>
                <div className="space-y-2">
                  {upcomingPrograms.map((prog, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 hover:bg-white/5 transition border border-transparent hover:border-white/10">
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] font-mono text-neon font-black bg-neon/10 px-1.5 py-0.5">
                          {new Date(prog.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/60 line-clamp-1">{prog.title}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/20 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-carbon/80 backdrop-blur-xl border border-white/10 p-5">
            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
              <Radio className="w-4 h-4 text-neon" /> RELATED
            </h3>

            {related.length > 0 ? (
              <div className="space-y-3.5">
                {related.map((chan) => (
                  <div
                    key={chan.id}
                    onClick={() => onNavigate(`#/channels/${chan.slug}`)}
                    className="flex items-center justify-between p-2.5 bg-carbon/50 border border-white/10 cursor-pointer hover:border-neon/30 hover:bg-white/5 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-obsidian border border-white/10 h-9 w-9 flex items-center justify-center shrink-0">
                        {chan.logo ? (
                          <img src={chan.logo} alt={chan.name} referrerPolicy="no-referrer" className="h-full w-full object-contain grayscale group-hover:grayscale-0 transition-all duration-300" />
                        ) : (
                          <span className="text-[10px] font-display font-black text-neon">{chan.name.slice(0, 2).toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-white group-hover:text-neon transition truncate w-36">
                          {chan.name}
                        </h4>
                        <span className="text-[7px] font-mono text-white/30 uppercase tracking-[0.2em]">
                          {chan.category}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[7px] font-mono text-white/50 bg-white/5 border border-white/10 px-1 py-0.5 font-black">
                        {chan.isHD ? 'HD' : 'SD'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-white/30 font-mono uppercase tracking-[0.1em]">NO RELATED CHANNELS</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
