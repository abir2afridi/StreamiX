import { Channel, Stream } from '../repositories/interfaces';

export const GROUP_TO_CATEGORY: Record<string, string> = {
  'Bangladesh': 'bangladesh',
  'Sports': 'sports',
  'Football World Cup 2026': 'worldcup',
  'Indian Entertainment': 'entertainment',
  'Movies': 'movies',
  'Music': 'music',
  'Kids': 'kids',
  'India News': 'news',
  'Religious': 'religious',
  'Business': 'business',
  'Documentary': 'documentary',
  'General': 'general',
  'Lifestyle': 'lifestyle',
  'Comedy': 'entertainment',
  'Legislative': 'general',
};

export const RELIABILITY_PATTERNS = [
  { pattern: 'akamaized.net', score: 90 },
  { pattern: 'cloudfront.net', score: 85 },
  { pattern: 'amagi.tv', score: 80 },
  { pattern: 'stingray.com', score: 85 },
  { pattern: 'livestream.rajtv.tv', score: 75 },
  { pattern: 'bozztv.com', score: 70 },
  { pattern: 'gpcdn.net', score: 65 },
  { pattern: 'pishow.tv', score: 65 },
];

export function getStreamFormatAndReliability(url: string): {
  format: 'hls' | 'dash' | 'mp4' | 'mpegts';
  reliability: number;
} {
  let format: 'hls' | 'dash' | 'mp4' | 'mpegts' = 'hls';
  let reliability = 50;

  if (url.includes('/tracks-v1a1/mono.ts')) {
    format = 'mpegts';
  } else if (url.endsWith('.mp4')) {
    format = 'mp4';
  } else if (url.endsWith('.mpd') || url.includes('/dash/')) {
    format = 'dash';
  } else if (url.endsWith('.ts') || url.includes('.ts?')) {
    format = 'mpegts';
  }

  for (const item of RELIABILITY_PATTERNS) {
    if (url.includes(item.pattern)) {
      reliability = item.score;
      break;
    }
  }

  // Token URL penalty
  if (url.includes('?e=') && url.includes('&token=')) {
    reliability = 40;
  }

  return { format, reliability };
}

export function parseM3U(m3uContent: string): Channel[] {
  const lines = m3uContent.split(/\r?\n/);
  const channels: Channel[] = [];
  let currentMeta: Record<string, string> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('#EXTM3U')) {
      continue;
    }

    if (line.startsWith('#EXTINF:')) {
      currentMeta = {};
      const extinfContent = line.slice(8);
      
      // Parse tvg-name
      const nameMatch = extinfContent.match(/tvg-name="([^"]+)"/);
      if (nameMatch) currentMeta['name'] = nameMatch[1];

      // Parse tvg-logo
      const logoMatch = extinfContent.match(/tvg-logo="([^"]+)"/);
      if (logoMatch) currentMeta['logo'] = logoMatch[1];

      // Parse group-title
      const groupMatch = extinfContent.match(/group-title="([^"]+)"/);
      if (groupMatch) {
        currentMeta['group'] = groupMatch[1];
      }

      // Rest of metadata or display name after the last comma
      const lastCommaIdx = extinfContent.lastIndexOf(',');
      if (lastCommaIdx !== -1) {
        const dispName = extinfContent.slice(lastCommaIdx + 1).trim();
        currentMeta['displayName'] = dispName;
      }
      continue;
    }

    if (line.startsWith('http://') || line.startsWith('https://')) {
      if (currentMeta) {
        const name = currentMeta['displayName'] || currentMeta['name'] || `Channel ${channels.length + 1}`;
        const cleanName = name.replace(/[\r\n]+/g, '').trim();
        const slug = cleanName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');

        const logo = currentMeta['logo'] || '';
        const groupTitle = currentMeta['group'] || 'General';
        const rawCategory = GROUP_TO_CATEGORY[groupTitle] || 'general';

        const { format, reliability } = getStreamFormatAndReliability(line);
        
        let tokenExpiry: number | undefined;
        let tokenRequired = false;
        
        // Extract token expiry if available
        if (line.includes('e=')) {
          const eMatch = line.match(/[?&]e=(\d+)/);
          if (eMatch) {
            tokenExpiry = parseInt(eMatch[1], 10);
            tokenRequired = true;
          }
        }

        const mainStream: Stream = {
          url: line,
          format,
          quality: 'auto',
          priority: 1,
          tokenRequired,
          tokenExpiry,
        };

        const isHD = cleanName.toLowerCase().includes('hd') || cleanName.toLowerCase().includes('1080p') || cleanName.toLowerCase().includes('4k');

        const channel: Channel = {
          id: slug || `channel-${channels.length + 1}`,
          name: cleanName,
          slug,
          logo,
          streams: [mainStream],
          category: rawCategory,
          country: rawCategory === 'bangladesh' ? 'bangladesh' : (rawCategory === 'news' ? 'india' : 'international'),
          language: rawCategory === 'bangladesh' ? ['Bengali'] : ['English'],
          tags: [rawCategory, 'live'],
          isHD,
          is4K: cleanName.toLowerCase().includes('4k'),
          isLive: true,
          isFeatured: false,
          isTrending: false,
          healthScore: reliability,
          qualityScore: isHD ? 90 : 75,
          reliabilityScore: reliability,
          viewCount: 0,
          lastChecked: new Date().toISOString(),
          addedAt: new Date().toISOString(),
        };

        // Deduplicate or merge streams if the slug/id exists
        const existingIdx = channels.findIndex((c) => c.slug === slug);
        if (existingIdx !== -1) {
          // Add stream as backup
          mainStream.priority = (channels[existingIdx].streams.length + 1) as 1 | 2 | 3;
          channels[existingIdx].streams.push(mainStream);
        } else {
          channels.push(channel);
        }

        currentMeta = null;
      }
    }
  }

  return channels;
}
