import fs from 'fs/promises';
import path from 'path';
import {
  IChannelRepository,
  ISourceRepository,
  IEPGRepository,
  Channel,
  Source,
  EPGProgram,
} from '../interfaces';

export class JsonChannelRepository implements IChannelRepository {
  private channelsPath = path.join(process.cwd(), 'data', 'channels.json');

  private async ensureFile(): Promise<void> {
    try {
      await fs.access(this.channelsPath);
    } catch {
      await fs.writeFile(this.channelsPath, JSON.stringify([], null, 2), 'utf-8');
    }
  }

  async getChannels(): Promise<Channel[]> {
    await this.ensureFile();
    try {
      const content = await fs.readFile(this.channelsPath, 'utf-8');
      return JSON.parse(content) as Channel[];
    } catch (e) {
      console.error('Error reading channels.json:', e);
      return [];
    }
  }

  async getChannelById(id: string): Promise<Channel | null> {
    const channels = await this.getChannels();
    return channels.find((c) => c.id === id) || null;
  }

  async getChannelBySlug(slug: string): Promise<Channel | null> {
    const channels = await this.getChannels();
    return channels.find((c) => c.slug === slug) || null;
  }

  async getFeaturedChannels(): Promise<Channel[]> {
    const channels = await this.getChannels();
    return channels.filter((c) => c.isFeatured);
  }

  async getTrendingChannels(): Promise<Channel[]> {
    const channels = await this.getChannels();
    return channels.filter((c) => c.isTrending);
  }

  async saveChannels(channels: Channel[]): Promise<void> {
    try {
      await fs.mkdir(path.dirname(this.channelsPath), { recursive: true });
      await fs.writeFile(this.channelsPath, JSON.stringify(channels, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving channels.json:', e);
    }
  }

  async updateChannel(channel: Channel): Promise<void> {
    const channels = await this.getChannels();
    const index = channels.findIndex((c) => c.id === channel.id);
    if (index !== -1) {
      channels[index] = channel;
    } else {
      channels.push(channel);
    }
    await this.saveChannels(channels);
  }
}

export class JsonSourceRepository implements ISourceRepository {
  private sourcesPath = path.join(process.cwd(), 'data', 'sources.json');

  private async ensureFile(): Promise<void> {
    try {
      await fs.access(this.sourcesPath);
    } catch {
      await fs.writeFile(this.sourcesPath, JSON.stringify([], null, 2), 'utf-8');
    }
  }

  async getSources(): Promise<Source[]> {
    await this.ensureFile();
    try {
      const content = await fs.readFile(this.sourcesPath, 'utf-8');
      return JSON.parse(content) as Source[];
    } catch (e) {
      console.error('Error reading sources.json:', e);
      return [];
    }
  }

  async getSourceById(id: string): Promise<Source | null> {
    const sources = await this.getSources();
    return sources.find((s) => s.id === id) || null;
  }

  async saveSource(source: Source): Promise<void> {
    const sources = await this.getSources();
    const index = sources.findIndex((s) => s.id === source.id);
    if (index !== -1) {
      sources[index] = source;
    } else {
      sources.push(source);
    }
    await this.saveSources(sources);
  }

  async deleteSource(id: string): Promise<void> {
    const sources = await this.getSources();
    const filtered = sources.filter((s) => s.id !== id);
    await this.saveSources(filtered);
  }

  async saveSources(sources: Source[]): Promise<void> {
    try {
      await fs.mkdir(path.dirname(this.sourcesPath), { recursive: true });
      await fs.writeFile(this.sourcesPath, JSON.stringify(sources, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving sources.json:', e);
    }
  }
}

export class JsonEPGRepository implements IEPGRepository {
  private epgDir = path.join(process.cwd(), 'data', 'epg');

  private async getEpgPath(channelId: string): Promise<string> {
    await fs.mkdir(this.epgDir, { recursive: true });
    return path.join(this.epgDir, `${channelId}.json`);
  }

  // Fallback program generator
  private generateMockPrograms(channelId: string): EPGProgram[] {
    const programs: EPGProgram[] = [];
    const now = new Date();
    // Generate programs for previous 12 hours and next 24 hours of 2-hour blocks
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    
    const showNames: Record<string, string[]> = {
      news: ['Global News Hour', 'Market Wrap-up', 'Special Report', 'Pratidin News Live', 'Midnight News Bulletin', 'Morning Express', 'Press Briefing', 'Talk Show India'],
      sports: ['Match Highlight Reels', 'Live Football 2026', 'Cricket Classics', 'T Sports Panel', 'Sports Desk Daily', 'World Cup Preview', 'The Grand Arena'],
      worldcup: ['World Cup Classics', 'FIFA 2026 Live Matchday', 'Tactics Lounge', 'Legendary Goals Re-run', 'Penalty Shootout Thrills', 'FIFA Tonight'],
      music: ['MTV Rock Hour', 'Golden Retro Bengali Hits', 'DJAZZ Midnight Grooves', 'Pure Pop Chartbusters', 'Stingray Naturescape Acoustic'],
      kids: ['Tom & Jerry Adventures', 'Mr Bean Non-Stop Animated', 'Doraemon Special Edition', 'Gopal Bhar Stories', 'Cartoon Network Classics'],
      general: ['Prime Time Talk', 'Classic Drama Block', 'Late Night Chronicles', 'Community Spotlight'],
    };

    const categories = Object.keys(showNames);
    // Determine channel-specific category
    let category = 'general';
    for (const cat of categories) {
      if (channelId.includes(cat)) {
        category = cat;
        break;
      }
    }
    if (channelId.includes('somoy') || channelId.includes('jamuna') || channelId.includes('bangla')) {
      category = 'news';
    } else if (channelId.includes('sports')) {
      category = 'sports';
    }

    const titles = showNames[category] || showNames.general;

    for (let h = 0; h < 24; h += 2) {
      const pStart = new Date(startOfDay.getTime() + h * 60 * 60 * 1000);
      const pEnd = new Date(pStart.getTime() + 2 * 60 * 60 * 1000);
      const titleIndex = (h / 2) % titles.length;

      programs.push({
        channelId,
        title: titles[titleIndex],
        description: `Experience the best of ${titles[titleIndex]} on our Live TV platform. Full coverage, live commentary, and high-fidelity video streams.`,
        startTime: pStart.toISOString(),
        endTime: pEnd.toISOString(),
        category: category.toUpperCase(),
        isLive: pStart.getTime() < now.getTime() && pEnd.getTime() > now.getTime(),
      });
    }

    return programs;
  }

  async getEPGForChannel(channelId: string, start?: Date, end?: Date): Promise<EPGProgram[]> {
    const epgFile = await this.getEpgPath(channelId);
    let programs: EPGProgram[] = [];
    try {
      const content = await fs.readFile(epgFile, 'utf-8');
      programs = JSON.parse(content) as EPGProgram[];
    } catch {
      // If there is no EPG file, generate mock EPG programs dynamically so TV Guide is never blank
      programs = this.generateMockPrograms(channelId);
      await this.saveEPGPrograms(channelId, programs);
    }

    if (start || end) {
      return programs.filter((p) => {
        const pStart = new Date(p.startTime);
        const pEnd = new Date(p.endTime);
        const matchesStart = start ? pEnd >= start : true;
        const matchesEnd = end ? pStart <= end : true;
        return matchesStart && matchesEnd;
      });
    }

    return programs;
  }

  async getCurrentProgram(channelId: string): Promise<EPGProgram | null> {
    const now = new Date();
    const programs = await this.getEPGForChannel(channelId);
    const current = programs.find((p) => {
      const start = new Date(p.startTime);
      const end = new Date(p.endTime);
      return now >= start && now <= end;
    });
    return current || null;
  }

  async saveEPGPrograms(channelId: string, programs: EPGProgram[]): Promise<void> {
    const epgFile = await this.getEpgPath(channelId);
    try {
      await fs.writeFile(epgFile, JSON.stringify(programs, null, 2), 'utf-8');
    } catch (e) {
      console.error(`Error saving EPG for channel ${channelId} :`, e);
    }
  }
}
