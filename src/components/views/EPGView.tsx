import React, { useEffect, useState } from 'react';
import { Calendar, Radio, Clock, ChevronRight } from 'lucide-react';
import { Channel, EPGProgram } from '../../types';
import { ChannelService } from '../../lib/services/ChannelService';
import { EPGService } from '../../lib/services/EPGService';

interface EPGViewProps {
  onNavigate: (hash: string) => void;
}

type TimeGroup = 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT';

function getTimeGroup(hour: number): TimeGroup {
  if (hour >= 6 && hour < 12) return 'MORNING';
  if (hour >= 12 && hour < 18) return 'AFTERNOON';
  if (hour >= 18 && hour < 22) return 'EVENING';
  return 'NIGHT';
}

function groupPrograms(programs: EPGProgram[]): Record<TimeGroup, EPGProgram[]> {
  const groups: Record<TimeGroup, EPGProgram[]> = {
    MORNING: [],
    AFTERNOON: [],
    EVENING: [],
    NIGHT: [],
  };
  for (const p of programs) {
    const h = new Date(p.startTime).getHours();
    groups[getTimeGroup(h)].push(p);
  }
  return groups;
}

export default function EPGView({ onNavigate }: EPGViewProps) {
  const channelService = new ChannelService();
  const epgService = new EPGService();

  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [programs, setPrograms] = useState<EPGProgram[]>([]);
  const [currentProgram, setCurrentProgram] = useState<EPGProgram | null>(null);
  const [loading, setLoading] = useState(true);
  const [epgLoading, setEpgLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const loadChannels = async () => {
      setLoading(true);
      const res = await channelService.getChannels({ limit: 200 });
      setChannels(res.channels);
      if (res.channels.length > 0) {
        setSelectedChannel(res.channels[0]);
      }
      setLoading(false);
    };
    loadChannels();
  }, []);

  useEffect(() => {
    if (!selectedChannel) return;

    const loadEPG = async () => {
      setEpgLoading(true);
      const data = await epgService.getEPG(selectedChannel.id);
      setPrograms(data.programs);
      setCurrentProgram(data.current);
      setEpgLoading(false);
    };
    loadEPG();
  }, [selectedChannel]);

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

  const grouped = groupPrograms(programs);

  const groupLabels: Record<TimeGroup, string> = {
    MORNING: 'MORNING (06:00 - 12:00)',
    AFTERNOON: 'AFTERNOON (12:00 - 18:00)',
    EVENING: 'EVENING (18:00 - 22:00)',
    NIGHT: 'NIGHT (22:00 - 06:00)',
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-8 h-8 border-2 border-neon border-t-transparent animate-spin" />
        <p className="text-[10px] font-mono text-white/40 animate-pulse uppercase tracking-[0.2em]">LOADING EPG...</p>
      </div>
    );
  }

  return (
    <div className="pt-8 space-y-6 pb-20 px-3 md:px-6 max-w-[1600px] mx-auto">
      <div className="bg-carbon/80 backdrop-blur-xl border border-white/10 p-4 flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex items-center gap-2 shrink-0">
          <Radio className="w-4 h-4 text-neon" />
          <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">CHANNEL</span>
        </div>
        <select
          value={selectedChannel?.id || ''}
          onChange={(e) => {
            const ch = channels.find((c) => c.id === e.target.value) || null;
            setSelectedChannel(ch);
          }}
          className="flex-1 bg-obsidian border border-white/10 text-white text-[11px] font-mono uppercase tracking-widest px-3 py-2 outline-none focus:border-neon/50 transition"
        >
          {channels.map((ch) => (
            <option key={ch.id} value={ch.id}>{ch.name} — {ch.category}</option>
          ))}
        </select>
      </div>

      {epgLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[30vh] gap-3">
          <div className="w-8 h-8 border-2 border-neon border-t-transparent animate-spin" />
          <p className="text-[10px] font-mono text-white/40 animate-pulse uppercase tracking-[0.2em]">LOADING SCHEDULE...</p>
        </div>
      ) : selectedChannel && programs.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[30vh] gap-4">
          <Calendar className="w-12 h-12 text-white/10" />
          <p className="text-[11px] font-mono text-white/30 uppercase tracking-[0.2em]">NO EPG DATA AVAILABLE</p>
        </div>
      ) : (
        selectedChannel && (
          <div className="space-y-8">
            {currentProgram && (
              <div className="bg-carbon/80 backdrop-blur-xl border border-white/10 p-5 space-y-4">
                <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-neon" /> NOW PLAYING
                </h3>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-start gap-4">
                    <h4 className="text-base font-black font-display uppercase tracking-widest text-white">
                      {currentProgram.title}
                    </h4>
                    <span className="px-1.5 py-0.5 bg-crimson text-white font-mono text-[8px] font-black animate-pulse shrink-0">
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
            )}

            {(Object.keys(groupLabels) as TimeGroup[]).map((group) => {
              const items = grouped[group];
              if (!items || items.length === 0) return null;
              return (
                <div key={group} className="space-y-3">
                  <h3 className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-neon" /> {groupLabels[group]}
                  </h3>
                  <div className="space-y-2">
                    {items.map((prog, idx) => {
                      const isCurrent = currentProgram?.startTime === prog.startTime && currentProgram?.title === prog.title;
                      return (
                        <div
                          key={idx}
                          className={`flex items-center justify-between p-3 bg-carbon/80 backdrop-blur-xl border transition ${
                            isCurrent
                              ? 'border-neon/30 bg-neon/5'
                              : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-4 min-w-0 flex-1">
                            <span className="text-[10px] font-mono text-neon font-black bg-neon/10 px-2 py-0.5 shrink-0">
                              {new Date(prog.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="text-[11px] font-black uppercase tracking-widest text-white truncate">
                                  {prog.title}
                                </h4>
                                {prog.category && (
                                  <span className="px-1.5 py-0.5 bg-white/10 text-white/50 font-mono text-[8px] font-black uppercase tracking-[0.2em] shrink-0">
                                    {prog.category}
                                  </span>
                                )}
                              </div>
                              {prog.description && (
                                <p className="text-[9px] text-white/30 font-mono mt-0.5 uppercase tracking-[0.05em] line-clamp-1">
                                  {prog.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0 ml-3">
                            <span className="text-[8px] font-mono text-white/30">
                              {new Date(prog.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(prog.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-white/20" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
