import {
  IFavoriteRepository,
  IHistoryRepository,
  ISettingsRepository,
  ISearchRepository,
  UserSettings,
  HistoryEntry,
} from '../interfaces';

// 1. LocalStorageFavoriteRepository
export class LocalStorageFavoriteRepository implements IFavoriteRepository {
  private key = 'live_tv_favorites';

  async getAllFavorites(): Promise<string[]> {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(this.key);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  async addFavorite(channelId: string): Promise<void> {
    if (typeof window === 'undefined') return;
    const favorites = await this.getAllFavorites();
    if (!favorites.includes(channelId)) {
      favorites.push(channelId);
      localStorage.setItem(this.key, JSON.stringify(favorites));
    }
  }

  async removeFavorite(channelId: string): Promise<void> {
    if (typeof window === 'undefined') return;
    const favorites = await this.getAllFavorites();
    const updated = favorites.filter((id) => id !== channelId);
    localStorage.setItem(this.key, JSON.stringify(updated));
  }

  async isFavorite(channelId: string): Promise<boolean> {
    const favorites = await this.getAllFavorites();
    return favorites.includes(channelId);
  }
}

// 2. LocalStorageHistoryRepository
export class LocalStorageHistoryRepository implements IHistoryRepository {
  private key = 'live_tv_history';

  async getHistory(): Promise<HistoryEntry[]> {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(this.key);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  async addEntry(entry: HistoryEntry): Promise<void> {
    if (typeof window === 'undefined') return;
    const history = await this.getHistory();
    // Remove if already exists for same channel to move to top
    const filtered = history.filter((h) => h.channelId !== entry.channelId);
    filtered.unshift(entry); // Prepend new entry
    // Keep last 100 entries
    const sliced = filtered.slice(0, 100);
    localStorage.setItem(this.key, JSON.stringify(sliced));
  }

  async removeEntry(channelId: string): Promise<void> {
    if (typeof window === 'undefined') return;
    const history = await this.getHistory();
    const updated = history.filter((h) => h.channelId !== channelId);
    localStorage.setItem(this.key, JSON.stringify(updated));
  }

  async clearHistory(): Promise<void> {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.key);
  }
}

// 3. LocalStorageSettingsRepository
export class LocalStorageSettingsRepository implements ISettingsRepository {
  private key = 'live_tv_settings';
  private defaultSettings: UserSettings = {
    theme: 'dark',
    language: 'en',
    contentLanguages: ['en', 'bn'],
    defaultQuality: 'auto',
    subtitleEnabled: false,
    subtitleLanguage: 'en',
    autoplay: true,
    bufferSize: 'medium',
    showMatureContent: false,
    notifications: {
      browserPush: false,
      favoriteChannelAlerts: true,
      programReminders: true,
    },
  };

  async getSettings(): Promise<UserSettings> {
    if (typeof window === 'undefined') return this.defaultSettings;
    try {
      const data = localStorage.getItem(this.key);
      if (!data) return this.defaultSettings;
      return { ...this.defaultSettings, ...JSON.parse(data) };
    } catch {
      return this.defaultSettings;
    }
  }

  async saveSettings(settings: UserSettings): Promise<void> {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.key, JSON.stringify(settings));
  }
}

// 4. LocalStorageSearchRepository
export class LocalStorageSearchRepository implements ISearchRepository {
  private key = 'live_tv_search_queries';

  async getRecentSearchQueries(): Promise<string[]> {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(this.key);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  async saveSearchQuery(query: string): Promise<void> {
    if (typeof window === 'undefined' || !query.trim()) return;
    const queries = await this.getRecentSearchQueries();
    const filtered = queries.filter((q) => q.toLowerCase() !== query.trim().toLowerCase());
    filtered.unshift(query.trim());
    const sliced = filtered.slice(0, 10); // Keep last 10
    localStorage.setItem(this.key, JSON.stringify(sliced));
  }

  async clearRecentSearchQueries(): Promise<void> {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.key);
  }
}
