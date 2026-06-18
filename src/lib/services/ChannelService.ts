import { Channel, Category, Country } from '../../types';
import { filterChannels, getFeaturedChannels, getTrendingChannels, getChannelBySlug, allCategories, allCountries } from './DataProvider';

export class ChannelService {
  async getChannels(filters?: {
    category?: string;
    country?: string;
    q?: string;
    page?: number;
    limit?: number;
  }): Promise<{ channels: Channel[]; total: number; totalPages: number }> {
    try {
      const result = filterChannels(filters);
      return { channels: result.channels, total: result.total, totalPages: result.totalPages };
    } catch (e) {
      console.error('ChannelService Error:', e);
      return { channels: [], total: 0, totalPages: 0 };
    }
  }

  async getFeaturedChannels(): Promise<Channel[]> {
    return getFeaturedChannels();
  }

  async getTrendingChannels(): Promise<Channel[]> {
    return getTrendingChannels();
  }

  async getChannelBySlug(slug: string): Promise<Channel | null> {
    return getChannelBySlug(slug);
  }

  async getCategories(): Promise<Category[]> {
    return allCategories;
  }

  async getCountries(): Promise<Country[]> {
    return allCountries;
  }
}
