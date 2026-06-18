import { EPGProgram } from '../../types';

export class EPGService {
  async getEPG(channelId: string): Promise<{ programs: EPGProgram[]; current: EPGProgram | null }> {
    try {
      const res = await fetch(`/api/epg/${channelId}`);
      if (!res.ok) throw new Error('Failed to retrieve program guide');
      return await res.json();
    } catch {
      return { programs: [], current: null };
    }
  }
}
