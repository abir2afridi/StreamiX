export interface Stream {
  url: string;
  format: 'hls' | 'dash' | 'mp4' | 'mpegts';
  quality: 'auto' | '4K' | '1080p' | '720p' | '480p' | '360p';
  priority: 1 | 2 | 3;
  headers?: Record<string, string>;
  userAgent?: string;
  tokenRequired?: boolean;
  tokenExpiry?: number;
}

export interface Channel {
  id: string;
  name: string;
  slug: string;
  logo: string;
  streams: Stream[];
  category: string;
  country: string;
  language: string[];
  tags: string[];
  epgId?: string;
  website?: string;
  isHD: boolean;
  is4K: boolean;
  isLive: boolean;
  isFeatured: boolean;
  isTrending: boolean;
  healthScore: number;
  qualityScore: number;
  reliabilityScore: number;
  viewCount: number;
  lastChecked: string;
  addedAt: string;
}

export interface Source {
  id: string;
  name: string;
  url: string;
  type: 'm3u' | 'json' | 'xmltv';
  enabled: boolean;
  priority: number;
  description: string;
  lastSynced: string | null;
  channelCount: number;
}

export interface EPGProgram {
  channelId: string;
  title: string;
  description?: string;
  startTime: string; // ISO
  endTime: string; // ISO
  category?: string;
  rating?: string;
  thumbnail?: string;
  isLive: boolean;
}

export interface HistoryEntry {
  channelId: string;
  watchedAt: string;
  duration: number;
  position?: number;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  contentLanguages: string[];
  defaultQuality: 'auto' | '1080p' | '720p' | '480p';
  subtitleEnabled: boolean;
  subtitleLanguage: string;
  autoplay: boolean;
  bufferSize: 'low' | 'medium' | 'high';
  showMatureContent: boolean;
  parentalPin?: string;
  notifications: {
    browserPush: boolean;
    favoriteChannelAlerts: boolean;
    programReminders: boolean;
  };
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  count: number;
}

export interface Country {
  id: string;
  name: string;
  code: string;
  flag: string;
}
