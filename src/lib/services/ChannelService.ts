import { Channel, Category, Country } from '../../types';

export class ChannelService {
  async getChannels(filters?: {
    category?: string;
    country?: string;
    q?: string;
    page?: number;
    limit?: number;
  }): Promise<{ channels: Channel[]; total: number; totalPages: number }> {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.category) queryParams.set('category', filters.category);
      if (filters?.country) queryParams.set('country', filters.country);
      if (filters?.q) queryParams.set('q', filters.q);
      if (filters?.page) queryParams.set('page', filters.page.toString());
      if (filters?.limit) queryParams.set('limit', filters.limit.toString());

      const res = await fetch(`/api/channels?${queryParams.toString()}`);
      if (!res.ok) throw new Error('Failed to retrieve channels');
      return await res.json();
    } catch (e) {
      console.error('ChannelService Error:', e);
      return { channels: [], total: 0, totalPages: 0 };
    }
  }

  async getFeaturedChannels(): Promise<Channel[]> {
    try {
      const res = await fetch('/api/channels/featured');
      if (!res.ok) throw new Error('Failed to fetch featured channels');
      return await res.json();
    } catch {
      return [];
    }
  }

  async getTrendingChannels(): Promise<Channel[]> {
    try {
      const res = await fetch('/api/channels/trending');
      if (!res.ok) throw new Error('Failed to fetch trending channels');
      return await res.json();
    } catch {
      return [];
    }
  }

  async getChannelBySlug(slug: string): Promise<Channel | null> {
    try {
      const res = await fetch(`/api/channels/${slug}`);
      if (!res.ok) throw new Error('Failed to fetch channel details');
      return await res.json();
    } catch {
      return null;
    }
  }

  async getCategories(): Promise<Category[]> {
    try {
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      return await res.json();
    } catch {
      return [];
    }
  }

  async getCountries(): Promise<Country[]> {
    try {
      const res = await fetch('/api/countries');
      if (!res.ok) throw new Error('Failed to fetch countries');
      return await res.json();
    } catch {
      return [];
    }
  }
}
