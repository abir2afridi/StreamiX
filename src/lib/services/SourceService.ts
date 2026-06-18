import { parseM3U } from '../parsers/m3u';
import { validateStreamUrl } from '../validators/stream';
import { Channel, Source, Stream } from '../repositories/interfaces';
import { JsonChannelRepository, JsonSourceRepository } from '../repositories/json';

export function generateLetterAvatar(name: string): string {
  const colors = [
    '#DC2626', // red
    '#D97706', // amber
    '#059669', // emerald
    '#2563EB', // blue
    '#4F46E5', // indigo
    '#7C3AED', // violet
    '#DB2777', // pink
    '#4B5563', // gray
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = colors[Math.abs(hash) % colors.length];
  const initials = name.replace(/[^a-zA-Z0-9 ]/g, '').split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || name.slice(0, 2).toUpperCase();
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
    <rect width="100" height="100" rx="16" fill="${color}"/>
    <text x="50" y="52" font-family="'Inter', system-ui, sans-serif" font-weight="700" font-size="38" fill="#FFFFFF" dominant-baseline="middle" text-anchor="middle">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export class SourceService {
  private channelRepo = new JsonChannelRepository();
  private sourceRepo = new JsonSourceRepository();

  async syncAllSources(): Promise<{ success: boolean; channelCount: number; message: string }> {
    try {
      const sources = await this.sourceRepo.getSources();
      const enabledSources = sources.filter((s) => s.enabled);
      
      let allChannels: Channel[] = [];

      for (const source of enabledSources) {
        try {
          console.log(`Starting ingest for source: ${source.name}`);
          const channelsFromSource = await this.ingestSource(source);
          allChannels = allChannels.concat(channelsFromSource);
          
          // Update source count
          source.channelCount = channelsFromSource.length;
          source.lastSynced = new Date().toISOString();
          await this.sourceRepo.saveSource(source);
        } catch (sourceError) {
          console.error(`Error syncing source ${source.name}:`, sourceError);
        }
      }

      if (allChannels.length === 0) {
        return {
          success: false,
          channelCount: 0,
          message: 'No channels were successfully parsed from enabled sources.',
        };
      }

      // Deduplicate channels by slug similarity
      const uniqueChannels = this.deduplicateChannels(allChannels);

      // Match Logos
      for (const channel of uniqueChannels) {
        if (!channel.logo) {
          channel.logo = generateLetterAvatar(channel.name);
        }
      }

      // Keep pre-featured/pre-trending states or assign defaults for important ones
      this.enrichInitialFlags(uniqueChannels);

      // Save to channels.json
      await this.channelRepo.saveChannels(uniqueChannels);

      return {
        success: true,
        channelCount: uniqueChannels.length,
        message: `Successfully synchronized ${uniqueChannels.length} channels from ${enabledSources.length} sources.`,
      };
    } catch (e: any) {
      console.error('Core synchronizer error:', e);
      return {
        success: false,
        channelCount: 0,
        message: `Synchronization failed: ${e.message}`,
      };
    }
  }

  private async ingestSource(source: Source): Promise<Channel[]> {
    const rawData = await this.fetchSource(source.url);
    if (!rawData) {
      throw new Error(`Failed to download payload from ${source.url}`);
    }

    if (source.type === 'm3u') {
      return parseM3U(rawData);
    } else if (source.type === 'json') {
      return this.parseJsonChannels(rawData);
    }
    
    return [];
  }

  private async fetchSource(url: string): Promise<string | null> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) IPTV-Flow Agent',
        },
      });
      if (!response.ok) return null;
      return await response.text();
    } catch {
      return null;
    }
  }

  private parseJsonChannels(rawJson: string): Channel[] {
    try {
      const data = JSON.parse(rawJson);
      const parsedChannels: Channel[] = [];
      const items = Array.isArray(data) ? data : (data.channels || []);

      for (const item of items) {
        if (!item.name || !item.url) continue;

        const slug = item.slug || item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const stream: Stream = {
          url: item.url,
          format: item.format || (item.url.includes('mono.ts') ? 'mpegts' : 'hls'),
          quality: item.quality || 'auto',
          priority: 1,
        };

        parsedChannels.push({
          id: slug,
          name: item.name,
          slug,
          logo: item.logo || '',
          streams: [stream],
          category: item.category || 'general',
          country: item.country || 'international',
          language: item.language || ['English'],
          tags: item.tags || ['live'],
          isHD: item.isHD || false,
          is4K: item.is4K || false,
          isLive: true,
          isFeatured: item.isFeatured || false,
          isTrending: item.isTrending || false,
          healthScore: item.healthScore || 80,
          qualityScore: item.qualityScore || 80,
          reliabilityScore: item.reliabilityScore || 80,
          viewCount: item.viewCount || 0,
          lastChecked: new Date().toISOString(),
          addedAt: new Date().toISOString(),
        });
      }
      return parsedChannels;
    } catch {
      return [];
    }
  }

  private deduplicateChannels(channels: Channel[]): Channel[] {
    const map = new Map<string, Channel>();

    for (const channel of channels) {
      const existing = map.get(channel.slug);
      if (existing) {
        // Source priority can merge. Pick existing or append stream
        // Append stream if doesn't already exist
        const hasUrl = existing.streams.some((s) => s.url === channel.streams[0].url);
        if (!hasUrl) {
          const stream = channel.streams[0];
          stream.priority = (existing.streams.length + 1) as 1 | 2 | 3;
          existing.streams.push(stream);
        }
      } else {
        map.set(channel.slug, channel);
      }
    }

    return Array.from(map.values());
  }

  private enrichInitialFlags(channels: Channel[]) {
    // Set a rotating or explicit set of channels to Featured + Trending for immediate display
    const featuredSlugs = ['somoy-tv', 't-sports-hd', 'btv-national', 'news18-bangla', 'fifa-2026-t-sports'];
    const trendingSlugs = ['jamuna-tv', 'tom-and-jerry-tv', 'stingray-classic-rock'];

    for (const c of channels) {
      if (featuredSlugs.includes(c.slug)) {
        c.isFeatured = true;
      }
      if (trendingSlugs.includes(c.slug)) {
        c.isTrending = true;
      }
    }
  }
}
