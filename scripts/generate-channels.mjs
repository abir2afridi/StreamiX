import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LINK_DIR = path.join(__dirname, '..', 'link');
const DATA_DIR = path.join(__dirname, '..', 'data');
const EPG_DIR = path.join(DATA_DIR, 'epg');

// ─── Helpers ────────────────────────────────────────────────────────────

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/--+/g, '-');
}

function generateId(name) {
  return slugify(name);
}

function determineStreamFormat(url) {
  if (url.includes('/tracks-v1a1/mono.ts') || url.endsWith('.ts.m3u8')) return 'mpegts';
  if (url.endsWith('.mpd')) return 'dash';
  if (url.includes('.mp4')) return 'mp4';
  return 'hls';
}

function detectToken(url) {
  const hasToken = url.includes('?e=') && url.includes('&token=');
  let tokenExpiry = null;
  if (hasToken) {
    const match = url.match(/[?&]e=(\d+)/);
    if (match) tokenExpiry = parseInt(match[1], 10);
  }
  return { tokenRequired: hasToken, tokenExpiry };
}

function reliabilityScore(url) {
  if (url.includes('akamaized.net')) return 90;
  if (url.includes('cloudfront.net')) return 85;
  if (url.includes('amagi.tv')) return 80;
  if (url.includes('stingray.com')) return 85;
  if (url.includes('gpcdn.net')) return 65;
  if (url.includes('bozztv.com')) return 70;
  if (url.includes('pishow.tv')) return 65;
  if (url.includes('aynaott.com') && !url.includes('?token=')) return 60;
  if (url.includes('aynaott.com') && url.includes('?token=')) return 40;
  return 50;
}

function healthScore(url) {
  return reliabilityScore(url);
}

function parseM3U(content) {
  const lines = content.split('\n');
  const entries = [];
  let currentMeta = null;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#EXTINF:')) {
      const nameMatch = trimmed.match(/tvg-name="([^"]*)"/);
      const groupMatch = trimmed.match(/group-title="([^"]*)"/);
      const displayMatch = trimmed.match(/,([^,]+)$/);
      currentMeta = {
        name: nameMatch ? nameMatch[1] : (displayMatch ? displayMatch[1].trim() : 'Unknown'),
        group: groupMatch ? groupMatch[1].toLowerCase() : 'general',
      };
    } else if (trimmed && !trimmed.startsWith('#') && currentMeta) {
      entries.push({
        name: currentMeta.name,
        group: currentMeta.group,
        url: trimmed,
      });
      currentMeta = null;
    }
  }
  return entries;
}

function mapCategory(groupTitle, genre) {
  const g = groupTitle?.toLowerCase() || '';
  const gr = genre?.toLowerCase() || '';

  // M3U group-title mapping
  if (g.includes('bangladesh')) return 'bangladesh';
  if (g.includes('world cup') || g.includes('football')) return 'worldcup';
  if (g.includes('sports')) return 'sports';
  if (g.includes('comedy')) return 'entertainment';
  if (g.includes('entertainment')) return 'entertainment';
  if (g.includes('movie')) return 'movies';
  if (g.includes('music')) return 'music';
  if (g.includes('kid')) return 'kids';
  if (g.includes('news') || g.includes('india news')) return 'news';
  if (g.includes('religi')) return 'religious';
  if (g.includes('business')) return 'business';
  if (g.includes('documentary')) return 'documentary';
  if (g.includes('general') || g.includes('legislative')) return 'general';
  if (g.includes('lifestyle')) return 'lifestyle';

  // Genre-based from metadata
  if (gr.includes('sport') || gr.includes('world cup')) return 'sports';
  if (gr.includes('entertain')) return 'entertainment';
  if (gr.includes('movie') || gr.includes('film') || gr.includes('bollywood')) return 'movies';
  if (gr.includes('music')) return 'music';
  if (gr.includes('kid') || gr.includes('cartoon') || gr.includes('animation')) return 'kids';
  if (gr.includes('news') || gr.includes('current affairs')) return 'news';
  if (gr.includes('religi')) return 'religious';
  if (gr.includes('business') || gr.includes('finance')) return 'business';
  if (gr.includes('document') || gr.includes('wildlife') || gr.includes('nature')) return 'documentary';
  if (gr.includes('general') || gr.includes('entertainment')) return 'entertainment';
  if (gr.includes('lifestyle')) return 'lifestyle';

  return g || 'general';
}

function mapCountry(countryName) {
  if (!countryName) return 'international';
  const c = countryName.toLowerCase();
  if (c.includes('bangladesh') || c === 'bd') return 'bangladesh';
  if (c.includes('india') || c === 'in') return 'india';
  if (c.includes('usa') || c === 'us' || c.includes('united states')) return 'usa';
  if (c.includes('uk') || c.includes('united kingdom') || c === 'gb') return 'uk';
  if (c.includes('france') || c === 'fr') return 'france';
  if (c.includes('turkey') || c === 'tr') return 'turkey';
  if (c.includes('canada') || c === 'ca') return 'canada';
  return c.replace(/[^a-z]/g, '') || 'international';
}

// ─── Normalize name for matching ────────────────────────────────────────

function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b(hd|4k|tv|live)\b/g, '')
    .trim();
}

function nameSimilarity(a, b) {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.9;
  const aWords = na.split(' ');
  const bWords = nb.split(' ');
  const common = aWords.filter(w => bWords.includes(w));
  return common.length / Math.max(aWords.length, bWords.length);
}

// ─── Main ────────────────────────────────────────────────────────────────

async function main() {
  // 1. Parse all M3U files
  const m3uFiles = fs.readdirSync(LINK_DIR).filter(f => f.endsWith('.m3u') || f.endsWith('.m3u8'));
  const m3uEntries = [];
  for (const file of m3uFiles) {
    const content = fs.readFileSync(path.join(LINK_DIR, file), 'utf-8');
    const entries = parseM3U(content);
    m3uEntries.push(...entries.map(e => ({ ...e, source: file })));
  }
  console.log(`Total M3U entries: ${m3uEntries.length}`);

  // 2. Deduplicate by name and url, with source priority
  // Priority: mahmud-picks > streampulse > IPTvFlow > IPTV-Flow-World-Cup > BDIX
  const sourcePriority = ['mahmud-picks.m3u', 'streampulse.m3u', 'IPTvFlow.m3u', 'IPTV-Flow-World-Cup.m3u', 'BDIX.m3u8'];
  const sourceRank = {};
  sourcePriority.forEach((name, i) => sourceRank[name] = i);

  const seen = new Set();
  const deduped = [];
  for (const entry of m3uEntries) {
    const key = `${entry.name}|${entry.url}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(entry);
    }
  }
  console.log(`Deduplicated M3U entries: ${deduped.length}`);

  // 3. Group streams by channel name, with highest-priority group
  const streamMap = new Map();
  for (const entry of deduped) {
    if (!streamMap.has(entry.name)) {
      streamMap.set(entry.name, { group: entry.group, groupRank: sourceRank[entry.source] ?? 99, urls: [] });
    } else {
      const existing = streamMap.get(entry.name);
      const currentRank = sourceRank[entry.source] ?? 99;
      if (currentRank < existing.groupRank) {
        existing.group = entry.group;
        existing.groupRank = currentRank;
      }
    }
    const existing = streamMap.get(entry.name);
    if (!existing.urls.includes(entry.url)) {
      existing.urls.push(entry.url);
    }
  }
  console.log(`Unique channel names from M3U: ${streamMap.size}`);

  // 4. Load metadata from link/channels.json
  let metadataList = [];
  try {
    const metaContent = fs.readFileSync(path.join(LINK_DIR, 'channels.json'), 'utf-8');
    metadataList = JSON.parse(metaContent);
  } catch { }
  console.log(`Metadata entries: ${metadataList.length}`);

  // Build metadata lookup by normalized name
  const metaByName = new Map();
  for (const m of metadataList) {
    const key = normalizeName(m.name);
    if (!metaByName.has(key)) {
      metaByName.set(key, m);
    }
  }

  // 5. Build channels
  const channels = [];
  const channelNames = new Set();

  for (const [name, data] of streamMap.entries()) {
    if (channelNames.has(name.toLowerCase())) continue;
    const id = generateId(name);
    const slug = id;

    // Find matching metadata
    let meta = null;
    const normName = normalizeName(name);
    if (metaByName.has(normName)) {
      meta = metaByName.get(normName);
    } else {
      // Fuzzy match
      let bestScore = 0;
      let bestMeta = null;
      for (const m of metadataList) {
        const score = nameSimilarity(name, m.name);
        if (score > bestScore && score >= 0.7) {
          bestScore = score;
          bestMeta = m;
        }
      }
      meta = bestMeta;
    }

    // Sort URLs: non-token first, then by reliability
    const urls = data.urls.sort((a, b) => {
      const aToken = a.includes('?e=') ? 1 : 0;
      const bToken = b.includes('?e=') ? 1 : 0;
      if (aToken !== bToken) return aToken - bToken;
      return reliabilityScore(b) - reliabilityScore(a);
    });

    // Build streams array
    const streams = urls.map((url, i) => {
      const { tokenRequired, tokenExpiry } = detectToken(url);
      const stream = {
        url,
        format: determineStreamFormat(url),
        quality: 'auto',
        priority: Math.min(i + 1, 3),
      };
      if (tokenRequired) {
        stream.tokenRequired = true;
        if (tokenExpiry) stream.tokenExpiry = tokenExpiry;
      }
      return stream;
    });

    const category = mapCategory(data.group, meta?.genre);
    const country = mapCountry(meta?.country || '');
    const language = meta?.language ? [meta.language] : ['Unknown'];
    const tags = [category];
    if (data.group) tags.push(data.group);
    if (meta?.genre) tags.push(meta.genre.toLowerCase().replace(/[^a-z0-9/]/g, '-'));

    const isFeatured = ['somoy-tv', 't-sports-hd', 'btv', 'fifa-2026-btv', 'fifa-2026-t-sports', 'news18-bangla'].includes(id);
    const isTrending = isFeatured || ['jamuna-tv', 'tom-and-jerry-tv', 'rtv'].includes(id);
    const firstUrl = urls[0];
    const health = healthScore(firstUrl);

    const channel = {
      id,
      name,
      slug,
      logo: meta?.logo_url || '',
      streams,
      category,
      country,
      language,
      tags: [...new Set(tags)],
      epgId: meta?.id ? `${meta.id}.${country}` : undefined,
      isHD: firstUrl.includes('akamaized') || firstUrl.includes('amagi') || firstUrl.includes('stingray'),
      is4K: name.toLowerCase().includes('4k') || name.toLowerCase().includes('uhd'),
      isLive: true,
      isFeatured,
      isTrending,
      healthScore: health,
      qualityScore: Math.min(health + 10, 100),
      reliabilityScore: health,
      viewCount: Math.floor(Math.random() * 5000) + 100,
      lastChecked: new Date().toISOString(),
      addedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    channels.push(channel);
    channelNames.add(name.toLowerCase());
  }

  console.log(`Total channels generated: ${channels.length}`);

  // 6. Write channels.json
  fs.writeFileSync(path.join(DATA_DIR, 'channels.json'), JSON.stringify(channels, null, 2));
  console.log('Written data/channels.json');

  // 7. Update categories.json
  const categorySet = new Set(channels.map(c => c.category));
  const catNames = {
    bangladesh: 'Bangladesh',
    sports: 'Sports',
    worldcup: 'FIFA World Cup 2026',
    entertainment: 'Entertainment',
    movies: 'Movies',
    music: 'Music',
    kids: 'Kids',
    news: 'News',
    religious: 'Religious',
    business: 'Business',
    documentary: 'Documentary',
    general: 'General',
    lifestyle: 'Lifestyle',
    international: 'International',
  };
  const categories = [...categorySet].map(cat => ({
    id: cat,
    name: catNames[cat] || cat.charAt(0).toUpperCase() + cat.slice(1),
    count: channels.filter(c => c.category === cat).length,
  }));

  fs.writeFileSync(
    path.join(DATA_DIR, 'categories.json'),
    JSON.stringify(categories, null, 2)
  );
  console.log('Written data/categories.json');

  // 8. Update countries.json
  const countrySet = new Set(channels.map(c => c.country));
  const countries = [...countrySet].map(c => ({
    id: c,
    name: c.charAt(0).toUpperCase() + c.slice(1),
    count: channels.filter(ch => ch.country === c).length,
  }));
  fs.writeFileSync(
    path.join(DATA_DIR, 'countries.json'),
    JSON.stringify(countries, null, 2)
  );
  console.log('Written data/countries.json');

  // 9. Generate EPG data for channels with epgId
  if (!fs.existsSync(EPG_DIR)) {
    fs.mkdirSync(EPG_DIR, { recursive: true });
  }

  for (const channel of channels) {
    if (!channel.epgId) continue;
    // Generate synthetic EPG for now (real EPG would come from XMLTV parsing)
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const programs = [];
    const titles = channel.category === 'news'
      ? ['News Bulletin', 'Morning Report', 'Live at Noon', 'Evening News', 'Prime Time', 'Late Night Review']
      : channel.category === 'sports'
        ? ['Sports Update', 'Live Match Coverage', 'Sports Analysis', 'Highlights Show', 'Training Session']
        : channel.category === 'movies'
          ? ['Morning Movie', 'Afternoon Blockbuster', 'Evening Film', 'Late Night Cinema']
          : channel.category === 'kids'
            ? ['Cartoon Hour', 'Kids Show', 'Animated Adventures', 'Bedtime Stories']
            : channel.category === 'music'
              ? ['Music Mix', 'Top Hits', 'Classic Tunes', 'Live Performance']
              : ['Regular Programming', 'Special Feature', 'Evening Show', 'Late Show'];
    for (let i = 0; i < 24; i++) {
      const start = new Date(startOfDay.getTime() + i * 60 * 60 * 1000);
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      const title = titles[i % titles.length];
      programs.push({
        channelId: channel.epgId,
        title,
        description: `${title} — ${channel.name}`,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        category: channel.category,
        isLive: true,
      });
    }
    fs.writeFileSync(
      path.join(EPG_DIR, `${channel.id}.json`),
      JSON.stringify(programs, null, 2)
    );
  }
  console.log(`Generated EPG for ${channels.filter(c => c.epgId).length} channels`);
}

main().catch(console.error);
