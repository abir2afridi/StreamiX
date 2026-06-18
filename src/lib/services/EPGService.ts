import { EPGProgram } from '../../types';
import { getEpgForChannel } from './DataProvider';

export class EPGService {
  async getEPG(channelId: string): Promise<{ programs: EPGProgram[]; current: EPGProgram | null }> {
    try {
      const programs = await getEpgForChannel(channelId);
      const now = new Date();
      const current = programs.find(p => new Date(p.startTime) <= now && new Date(p.endTime) > now) || null;
      return { programs, current };
    } catch {
      return { programs: [], current: null };
    }
  }
}
