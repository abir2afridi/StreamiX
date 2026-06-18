import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  Tv,
  Camera,
  Info,
  RotateCcw,
  SkipForward,
  Activity,
  Minimize2,
} from 'lucide-react';
import { Stream } from '../../types';

interface VideoPlayerProps {
  streams: Stream[];
  channelName: string;
  autoplay?: boolean;
  onEnded?: () => void;
  onFailover?: (streamIndex: number) => void;
  theaterMode?: boolean;
  setTheaterMode?: (mode: boolean) => void;
}

export default function VideoPlayer({
  streams,
  channelName,
  autoplay = true,
  onFailover,
  theaterMode = false,
  setTheaterMode,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const failoverLockRef = useRef(false);
  const mountedRef = useRef(true);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [miniPlayer, setMiniPlayer] = useState(false);
  const [activeStreamIndex, setActiveStreamIndex] = useState(0);
  const [buffering, setBuffering] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [showControls, setShowControls] = useState(false);

  const [stats, setStats] = useState({
    format: 'HLS',
    resolution: '0x0',
    bitrate: 'N/A',
    fps: 0,
    droppedFrames: 0,
    latency: '0ms',
  });

  const [levels, setLevels] = useState<string[]>([]);
  const [currentLevel, setCurrentLevel] = useState<number>(-1);
  const [showSettings, setShowSettings] = useState(false);

  const activeStream = streams[activeStreamIndex] || streams[0];

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    failoverLockRef.current = false;

    if (!streams.length) {
      setBuffering(false);
      setErrorMsg('NO STREAMS AVAILABLE FOR THIS CHANNEL');
      return;
    }

    if (!video || !activeStream) return;

    setErrorMsg(null);
    setBuffering(true);

    const bufferingTimeout = setTimeout(() => {
      if (mountedRef.current && !errorMsg) {
        setBuffering(false);
        setErrorMsg('STREAM LOAD TIMEOUT • CHECK CONNECTION');
      }
    }, 15000);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const { url, format } = activeStream;

    const handleLoadSuccess = () => {
      clearTimeout(bufferingTimeout);
      if (!mountedRef.current) return;
      setBuffering(false);
    };

    const handleError = () => {
      clearTimeout(bufferingTimeout);
      if (!mountedRef.current || failoverLockRef.current) return;
      failoverLockRef.current = true;
      if (activeStreamIndex < streams.length - 1) {
        const nextIdx = activeStreamIndex + 1;
        setActiveStreamIndex(nextIdx);
        if (onFailover) onFailover(nextIdx);
      } else {
        setBuffering(false);
        setErrorMsg('STREAM UNAVAILABLE • NO BACKUP FOUND');
      }
    };

    if (format === 'hls' && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        maxBufferLength: 10,
        maxMaxBufferLength: 20,
      });
      hlsRef.current = hls;

      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        handleLoadSuccess();
        const resolvedLevels = data.levels.map(
          (lvl) => `${lvl.height ? lvl.height + 'p' : 'AUTO'}`
        );
        setLevels(['AUTO', ...resolvedLevels]);
        if (autoplay) {
          video.play().catch(() => setPlaying(false));
        }
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        const levelData = hls.levels[data.level];
        if (levelData) {
          setStats((prev) => ({
            ...prev,
            resolution: `${levelData.width}x${levelData.height}`,
            bitrate: `${Math.round(levelData.bitrate / 1000)} KBPS`,
          }));
        }
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          console.warn('Fatal stream error:', data);
          handleError();
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      const onLoaded = () => {
        handleLoadSuccess();
        setStats((prev) => ({
          ...prev,
          resolution: `${video.videoWidth}x${video.videoHeight}`,
          format: 'NATIVE HLS',
        }));
        if (autoplay) {
          video.play().catch(() => setPlaying(false));
        }
      };
      video.addEventListener('loadedmetadata', onLoaded);
      video.addEventListener('error', handleError);
    } else {
      video.src = url;
      const onLoaded = () => {
        handleLoadSuccess();
        setStats((prev) => ({
          ...prev,
          resolution: `${video.videoWidth}x${video.videoHeight}`,
          format: format.toUpperCase(),
        }));
        if (autoplay) {
          video.play().catch(() => setPlaying(false));
        }
      };
      video.addEventListener('loadeddata', onLoaded);
      video.addEventListener('error', handleError);
    }

    const interval = setInterval(() => {
      if (video && video.readyState >= 2) {
        const videoQuality = (video as any).getVideoPlaybackQuality?.() || {};
        setStats((prev) => ({
          ...prev,
          fps: Math.round(videoQuality.fps || 30),
          droppedFrames: videoQuality.droppedVideoFrames || 0,
        }));
      }
    }, 2000);

    return () => {
      clearTimeout(bufferingTimeout);
      clearInterval(interval);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      video.removeAttribute('src');
      video.load();
    };
  }, [streams, activeStreamIndex]);

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (playing) {
      video.pause();
      setPlaying(false);
    } else {
      video.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  };

  const handleMuteUnmute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !muted;
    setMuted(!muted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const val = parseFloat(e.target.value);
    video.volume = val;
    setVolume(val);
    setMuted(val === 0);
  };

  const handleFullscreenToggle = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!fullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      }
      setFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setFullscreen(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as any).tagName)) return;

      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'f':
          e.preventDefault();
          handleFullscreenToggle();
          break;
        case 't':
          e.preventDefault();
          setTheaterMode?.(!theaterMode);
          break;
        case 'm':
          e.preventDefault();
          handleMuteUnmute();
          break;
        case 'arrowup':
          e.preventDefault();
          setVolume((prev) => {
            const next = Math.min(prev + 0.1, 1);
            if (videoRef.current) videoRef.current.volume = next;
            return next;
          });
          break;
        case 'arrowdown':
          e.preventDefault();
          setVolume((prev) => {
            const next = Math.max(prev - 0.1, 0);
            if (videoRef.current) {
              videoRef.current.volume = next;
              videoRef.current.muted = next === 0;
            }
            return next;
          });
          break;
        case 'i':
          e.preventDefault();
          handlePictureInPicture();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [playing, muted, theaterMode, fullscreen]);

  const handlePictureInPicture = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setMiniPlayer(false);
      } else {
        await video.requestPictureInPicture();
        setMiniPlayer(true);
      }
    } catch (e) {
      console.error('PiP error:', e);
    }
  };

  const handleScreenshot = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png');
      
      const link = document.createElement('a');
      link.download = `streamix-${channelName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
  };

  const handleQualityLevel = (idx: number) => {
    setCurrentLevel(idx);
    setShowSettings(false);
    if (hlsRef.current) {
      hlsRef.current.currentLevel = idx - 1;
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowControls(false)}
      className={`relative w-full overflow-hidden bg-black transition-all group select-none ${
        theaterMode ? 'aspect-[21/9] max-h-[80vh]' : 'aspect-video border border-white/10'
      }`}
    >
      <video
        ref={videoRef}
        playsInline
        referrerPolicy="no-referrer"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onWaiting={() => setBuffering(true)}
        onPlaying={() => setBuffering(false)}
        className="w-full h-full object-contain"
      />

      {buffering && !errorMsg && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20">
          <div className="w-10 h-10 border-2 border-neon border-t-transparent animate-spin" />
          <p className="mt-4 text-[10px] font-mono text-white/60 uppercase tracking-[0.2em] animate-pulse">
            BUFFERING • STREAM {activeStreamIndex + 1}/{streams.length}
          </p>
        </div>
      )}

      {errorMsg && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-obsidian z-20 px-6 text-center">
          <Info className="w-16 h-16 text-crimson mb-4" />
          <h3 className="text-lg font-black font-display uppercase tracking-widest text-white">PLAYBACK ERROR</h3>
          <p className="text-[10px] text-white/40 mt-2 max-w-sm font-mono uppercase tracking-[0.1em]">{errorMsg}</p>
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setActiveStreamIndex(0)}
              className="px-4 py-2 bg-white text-black text-[11px] font-black uppercase tracking-widest hover:bg-neon transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 inline mr-1" /> RETRY
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-carbon border border-white/10 text-white text-[11px] font-black uppercase tracking-widest hover:bg-white/10 transition cursor-pointer"
            >
              RELOAD
            </button>
          </div>
        </div>
      )}

      {showStats && (
        <div className="absolute top-4 left-4 p-4 bg-obsidian/90 border border-white/10 font-mono text-[9px] text-neon space-y-1 backdrop-blur-xl z-30 shadow-xl max-w-xs">
          <div className="flex justify-between items-center border-b border-white/10 pb-1.5 mb-1.5">
            <span className="font-black text-white flex items-center gap-1 uppercase tracking-[0.2em] text-[10px]"><Activity className="w-3 h-3 text-neon" /> STATS</span>
            <button onClick={() => setShowStats(false)} className="text-white/30 hover:text-white">✕</button>
          </div>
          <div><span className="text-white/30 uppercase tracking-[0.1em]">CHANNEL:</span> {channelName}</div>
          <div><span className="text-white/30 uppercase tracking-[0.1em]">SOURCE:</span> {activeStreamIndex === 0 ? 'PRIMARY' : `BACKUP ${activeStreamIndex}`}</div>
          <div><span className="text-white/30 uppercase tracking-[0.1em]">FORMAT:</span> {stats.format} ({activeStream.format})</div>
          <div><span className="text-white/30 uppercase tracking-[0.1em]">RESOLUTION:</span> {stats.resolution}</div>
          <div><span className="text-white/30 uppercase tracking-[0.1em]">BITRATE:</span> {stats.bitrate}</div>
          <div><span className="text-white/30 uppercase tracking-[0.1em]">FPS:</span> {stats.fps}</div>
          <div><span className="text-white/30 uppercase tracking-[0.1em]">DROPPED:</span> {stats.droppedFrames}</div>
          <div><span className="text-white/30 uppercase tracking-[0.1em]">TOKEN:</span> {activeStream.tokenRequired ? 'SECURED' : 'OPEN'}</div>
        </div>
      )}

      <div
        className={`player-overlay absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-black/40 flex flex-col justify-between p-4 transition-opacity duration-300 z-10 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full bg-crimson opacity-75" />
              <span className="relative inline-flex h-2 w-2 bg-crimson" />
            </span>
            <span className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-white">LIVE</span>
            <h2 className="text-sm font-black font-display uppercase tracking-widest text-white ml-2">{channelName}</h2>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowStats(!showStats)}
              title="STATS"
              className="p-1.5 text-white hover:bg-white/10 transition"
            >
              <Info className="w-4 h-4" />
            </button>
            <button
              onClick={handleScreenshot}
              title="CAPTURE"
              className="p-1.5 text-white hover:bg-white/10 transition"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="absolute inset-0 m-auto flex items-center justify-center pointer-events-none">
          {!playing && (
            <button className="w-16 h-16 bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white pointer-events-auto shadow-2xl active:scale-95 transition" onClick={handlePlayPause}>
              <Play className="w-8 h-8 fill-white ml-1" />
            </button>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handlePlayPause}
                className="p-2 text-white hover:bg-white/10 transition"
              >
                {playing ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleMuteUnmute}
                  className="p-2 text-white hover:bg-white/10 transition"
                >
                  {muted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={muted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 accent-neon h-1 cursor-pointer"
                />
              </div>

              {streams.length > 1 && (
                <div className="flex items-center gap-px px-2 py-1 bg-white/10">
                  <span className="text-[8px] text-white font-mono uppercase tracking-[0.2em] font-black">SRC:</span>
                  {streams.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveStreamIndex(idx)}
                      className={`px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.2em] transition font-mono ${
                        activeStreamIndex === idx ? 'bg-neon text-black' : 'bg-white/10 text-white/40 hover:text-white'
                      }`}
                    >
                      {idx === 0 ? 'PRI' : `ALT${idx}`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1">
              <div className="relative">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  title="QUALITY"
                  className="p-2 text-white hover:bg-white/20 transition"
                >
                  <Settings className="w-5 h-5" />
                </button>
                {showSettings && levels.length > 0 && (
                  <div className="absolute bottom-10 right-0 py-1 bg-obsidian/95 border border-white/10 shadow-xl text-[10px] font-mono w-36 z-30">
                    <div className="px-3 py-1.5 text-[8px] text-white/30 border-b border-white/10 uppercase tracking-[0.3em] font-black">QUALITY</div>
                    {levels.map((lvl, index) => (
                      <button
                        key={lvl + index}
                        onClick={() => handleQualityLevel(index)}
                        className={`w-full text-left px-3 py-1.5 hover:bg-white/10 transition flex items-center justify-between uppercase tracking-widest font-black ${
                          currentLevel === index ? 'text-neon' : 'text-white/60'
                        }`}
                      >
                        <span>{lvl}</span>
                        {currentLevel === index && <span className="h-1.5 w-1.5 bg-neon" />}
                      </button>
                    ))}
                  </div>
                )}
                {showSettings && levels.length === 0 && (
                  <div className="absolute bottom-10 right-0 py-2 px-3 bg-obsidian/95 border border-white/10 shadow-xl text-[9px] font-mono text-white/50 z-30 whitespace-nowrap">
                    NO QUALITY DATA
                  </div>
                )}
              </div>

              <button
                onClick={handlePictureInPicture}
                title="PIP"
                className="p-2 text-white hover:bg-white/20 transition"
              >
                <Minimize2 className="w-5 h-5" />
              </button>

              <button
                onClick={() => setTheaterMode?.(!theaterMode)}
                title="THEATER"
                className="p-2 text-white hover:bg-white/20 transition hidden md:block"
              >
                <Tv className="w-5 h-5" />
              </button>

              <button
                onClick={handleFullscreenToggle}
                className="p-2 text-white hover:bg-white/20 transition"
              >
                {fullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
