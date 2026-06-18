export interface Stream {
  url: string;
  format: 'hls' | 'dash' | 'mp4' | 'mpegts';
  quality: 'auto' | '4K' | '1080p' | '720p' | '480p' | '360p';
  priority: 1 | 2 | 3; // 1 = primary, 2 = backup, 3 = emergency
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
  startTime: string; // ISO String
  endTime: string; // ISO String
  category?: string;
  rating?: string;
  thumbnail?: string;
  isLive: boolean;
}

export interface HistoryEntry {
  channelId: string;
  watchedAt: string;
  duration: number; // seconds watched
  position?: number; // resume position
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

// 1. IChannelRepository
export interface IChannelRepository {
  getChannels(): Promise<Channel[]>;
  getChannelById(id: string): Promise<Channel | null>;
  getChannelBySlug(slug: string): Promise<Channel | null>;
  getFeaturedChannels(): Promise<Channel[]>;
  getTrendingChannels(): Promise<Channel[]>;
  saveChannels(channels: Channel[]): Promise<void>;
  updateChannel(channel: Channel): Promise<void>;
}

// 2. ISourceRepository
export interface ISourceRepository {
  getSources(): Promise<Source[]>;
  getSourceById(id: string): Promise<Source | null>;
  saveSource(source: Source): Promise<void>;
  deleteSource(id: string): Promise<void>;
  saveSources(sources: Source[]): Promise<void>;
}

// 3. IEPGRepository
export interface IEPGRepository {
  getEPGForChannel(channelId: string, start?: Date, end?: Date): Promise<EPGProgram[]>;
  getCurrentProgram(channelId: string): Promise<EPGProgram | null>;
  saveEPGPrograms(channelId: string, programs: EPGProgram[]): Promise<void>;
}

// 4. IFavoriteRepository
export interface IFavoriteRepository {
  addFavorite(channelId: string): Promise<void>;
  removeFavorite(channelId: string): Promise<void>;
  isFavorite(channelId: string): Promise<boolean>;
  getAllFavorites(): Promise<string[]>;
}

// 5. IHistoryRepository
export interface IHistoryRepository {
  addEntry(entry: HistoryEntry): Promise<void>;
  getHistory(): Promise<HistoryEntry[]>;
  clearHistory(): Promise<void>;
  removeEntry(channelId: string): Promise<void>;
}

// 6. ISettingsRepository
export interface ISettingsRepository {
  getSettings(): Promise<UserSettings>;
  saveSettings(settings: UserSettings): Promise<void>;
}

// 7. IAnalyticsRepository
export interface IAnalyticsRepository {
  logEvent(eventName: string, params: Record<string, any>): Promise<void>;
  getMostWatchedChannels(limit?: number): Promise<{ channelId: string; watchTime: number }[]>;
}

// 8. ISearchRepository
export interface ISearchRepository {
  saveSearchQuery(query: string): Promise<void>;
  getRecentSearchQueries(): Promise<string[]>;
  clearRecentSearchQueries(): Promise<void>;
}

// 9. INotificationRepository
export interface INotificationRepository {
  getNotifications(): Promise<any[]>;
  markAsRead(id: string): Promise<void>;
}
