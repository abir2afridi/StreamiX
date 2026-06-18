import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { createServer as createViteServer } from 'vite';
import { JsonChannelRepository, JsonSourceRepository, JsonEPGRepository } from './src/lib/repositories/json';
import { SourceService } from './src/lib/services/SourceService';
import { validateStreamUrl } from './src/lib/validators/stream';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Security headers
  app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
    next();
  });

  const channelRepo = new JsonChannelRepository();
  const sourceRepo = new JsonSourceRepository();
  const epgRepo = new JsonEPGRepository();
  const sourceService = new SourceService();

  // 1. GET /api/channels - List channels with filters and pagination
  app.get('/api/channels', async (req, res) => {
    try {
      const { category, country, q, page = '1', limit = '100' } = req.query;
      let channels = await channelRepo.getChannels();

      if (category && typeof category === 'string' && category !== 'all') {
        channels = channels.filter(
          (c) => c.category.toLowerCase() === category.toLowerCase()
        );
      }

      if (country && typeof country === 'string' && country !== 'all') {
        channels = channels.filter(
          (c) => c.country.toLowerCase() === country.toLowerCase()
        );
      }

      if (q && typeof q === 'string' && q.trim()) {
        const query = q.toLowerCase().trim();
        channels = channels.filter(
          (c) =>
            c.name.toLowerCase().includes(query) ||
            c.slug.toLowerCase().includes(query) ||
            c.tags.some((t) => t.toLowerCase().includes(query))
        );
      }

      // Sort: Featured first, then by viewCount or health
      channels.sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return b.viewCount - a.viewCount;
      });

      const pPage = parseInt(page as string, 10);
      const pLimit = parseInt(limit as string, 10);
      const startIdx = (pPage - 1) * pLimit;
      const paginated = channels.slice(startIdx, startIdx + pLimit);

      res.json({
        channels: paginated,
        total: channels.length,
        page: pPage,
        limit: pLimit,
        totalPages: Math.ceil(channels.length / pLimit),
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // 2. GET /api/channels/featured
  app.get('/api/channels/featured', async (req, res) => {
    try {
      const channels = await channelRepo.getFeaturedChannels();
      res.json(channels);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // 3. GET /api/channels/trending
  app.get('/api/channels/trending', async (req, res) => {
    try {
      const channels = await channelRepo.getTrendingChannels();
      res.json(channels);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // 4. GET /api/channels/:slug - Single channel details
  app.get('/api/channels/:slug', async (req, res) => {
    try {
      const channel = await channelRepo.getChannelBySlug(req.params.slug);
      if (!channel) {
        return res.status(404).json({ error: 'Channel not found' });
      }
      
      // Increment view counter locally
      channel.viewCount = (channel.viewCount || 0) + 1;
      await channelRepo.updateChannel(channel);

      res.json(channel);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // 5. GET /api/categories
  app.get('/api/categories', async (req, res) => {
    try {
      const catPath = path.join(process.cwd(), 'data', 'categories.json');
      const data = await fs.readFile(catPath, 'utf-8');
      res.json(JSON.parse(data));
    } catch {
      res.json([]);
    }
  });

  // 6. GET /api/countries
  app.get('/api/countries', async (req, res) => {
    try {
      const countryPath = path.join(process.cwd(), 'data', 'countries.json');
      const data = await fs.readFile(countryPath, 'utf-8');
      res.json(JSON.parse(data));
    } catch {
      res.json([]);
    }
  });

  // 7. GET /api/epg/:channelId
  app.get('/api/epg/:channelId', async (req, res) => {
    try {
      const programs = await epgRepo.getEPGForChannel(req.params.channelId);
      const current = await epgRepo.getCurrentProgram(req.params.channelId);
      res.json({ programs, current });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // 8. GET /api/sources - Manage lists in administrative tools
  app.get('/api/sources', async (req, res) => {
    try {
      const sources = await sourceRepo.getSources();
      res.json(sources);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // 9. POST /api/sources - Add Source
  app.post('/api/sources', async (req, res) => {
    try {
      const { name, url, type, priority = 2, description = '' } = req.body;
      if (!name || !url || !type) {
        return res.status(400).json({ error: 'Missing required parameters: name, url, type' });
      }

      const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const newSource = {
        id,
        name,
        url,
        type,
        enabled: true,
        priority,
        description,
        lastSynced: null,
        channelCount: 0,
      };

      await sourceRepo.saveSource(newSource);
      res.json({ success: true, source: newSource });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // 10. DELETE /api/sources/:id - Delete Source
  app.delete('/api/sources/:id', async (req, res) => {
    try {
      await sourceRepo.deleteSource(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // 11. POST /api/admin/sync-sources - Trigger ingestion pipeline
  app.post('/api/admin/sync-sources', async (req, res) => {
    try {
      const result = await sourceService.syncAllSources();
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // 12. POST /api/admin/validate-stream - Latency head request
  app.post('/api/admin/validate-stream', async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: 'Missing URL parameter' });
      }

      const check = await validateStreamUrl(url);
      res.json(check);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // 13. GET /api/health
  app.get('/api/health', async (req, res) => {
    try {
      const channels = await channelRepo.getChannels();
      const sources = await sourceRepo.getSources();
      res.json({
        status: 'healthy',
        totalChannels: channels.length,
        totalSources: sources.length,
        time: new Date().toISOString(),
      });
    } catch (e: any) {
      res.status(500).json({ status: 'degraded', error: e.message });
    }
  });

  // Serve static assets or mount Vite dev server
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Live TV Platform backend active on http://localhost:${PORT}`);
  });
}

startServer();
