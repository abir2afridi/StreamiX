import channelsData from '../../../data/channels.json';
import categoriesData from '../../../data/categories.json';
import countriesData from '../../../data/countries.json';
import { Channel, Category, Country, EPGProgram } from '../../types';

const allChannels: Channel[] = channelsData as Channel[];
const allCategories: Category[] = (categoriesData as any[]).map(c => ({
  ...c,
  icon: c.icon || '🌐',
}));
const allCountries: Country[] = (countriesData as any[]).map(c => ({
  ...c,
  code: c.id || c.code || '',
  flag: c.flag || '',
}));

const epgCache = new Map<string, EPGProgram[]>();

export async function getEpgForChannel(channelId: string): Promise<EPGProgram[]> {
  if (epgCache.has(channelId)) return epgCache.get(channelId)!;
  try {
    const mod = await import(`../../../data/epg/${channelId}.json`);
    const programs: EPGProgram[] = mod.default;
    epgCache.set(channelId, programs);
    return programs;
  } catch {
    return [];
  }
}

export { allChannels, allCategories, allCountries };

export function filterChannels(filters?: {
  category?: string;
  country?: string;
  q?: string;
  page?: number;
  limit?: number;
}): { channels: Channel[]; total: number; page: number; limit: number; totalPages: number } {
  let result = [...allChannels];

  if (filters?.category && filters.category !== 'all') {
    result = result.filter(c => c.category.toLowerCase() === filters.category!.toLowerCase());
  }

  if (filters?.country && filters.country !== 'all') {
    result = result.filter(c => c.country.toLowerCase() === filters.country!.toLowerCase());
  }

  if (filters?.q && filters.q.trim()) {
    const query = filters.q.toLowerCase().trim();
    result = result.filter(c =>
      c.name.toLowerCase().includes(query) ||
      c.slug.toLowerCase().includes(query) ||
      c.tags.some(t => t.toLowerCase().includes(query))
    );
  }

  result.sort((a, b) => {
    if (a.isFeatured && !b.isFeatured) return -1;
    if (!a.isFeatured && b.isFeatured) return 1;
    return b.viewCount - a.viewCount;
  });

  const total = result.length;
  const pPage = filters?.page || 1;
  const pLimit = filters?.limit || 100;
  const startIdx = (pPage - 1) * pLimit;
  const paginated = result.slice(startIdx, startIdx + pLimit);

  return {
    channels: paginated,
    total,
    page: pPage,
    limit: pLimit,
    totalPages: Math.ceil(total / pLimit),
  };
}

export function getFeaturedChannels(): Channel[] {
  return allChannels.filter(c => c.isFeatured).slice(0, 10);
}

export function getTrendingChannels(): Channel[] {
  return allChannels
    .filter(c => c.isTrending)
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, 20);
}

export function getChannelBySlug(slug: string): Channel | null {
  return allChannels.find(c => c.slug === slug) || null;
}
