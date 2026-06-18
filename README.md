# StreamiX — Live Television Protocol

Cyberpunk brutalist live TV streaming platform with HLS playback, multi-stream failover, EPG, and a dark/light theme.

## Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Hash Router
- **Backend:** Express, Vite middleware
- **Video:** HLS.js with quality level selection
- **Icons:** Lucide React
- **Build:** Vite, TypeScript (strict)

## Getting Started

```bash
npm install
npm run dev
```

Server starts on `http://localhost:3000`.

## Features

- Live TV channel grid with category filtering and search
- HLS video player with multi-stream failover (PRI/ALT sources)
- Picture-in-Picture, theater mode, fullscreen
- Real-time stats overlay (resolution, bitrate, FPS, dropped frames)
- Electronic Program Guide (EPG) with progress bar
- Favorites, watch history, search history (localStorage)
- Admin panel: add/edit/delete channels, token management
- Dark theme (default) / Light theme toggle (persisted)
- Cyberpunk brutalist UI with neon accents and glassmorphism

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/channels` | List all channels |
| GET | `/api/channels/:id` | Get channel by ID |
| POST | `/api/channels` | Create channel (admin) |
| PUT | `/api/channels/:id` | Update channel (admin) |
| DELETE | `/api/channels/:id` | Delete channel (admin) |
| POST | `/api/channels/:id/view` | Increment view count |
| GET | `/api/streams/:id` | Get stream URL (token-gated) |

## Project Structure

```
src/
├── App.tsx                  # Root component, theme, router
├── index.css                # Tailwind v4 theme, custom classes
├── components/
│   ├── layout/              # Header, TV guide layout
│   ├── views/               # Home, Channels, Player, Favorites, etc.
│   └── player/              # VideoPlayer (HLS.js)
├── data/                    # JSON data files (ignored by Vite watch)
├── hooks/                   # Channel data, EPG hooks
└── types/                   # TypeScript interfaces
```

## Configuration

- `vite.config.ts` — Vite configuration with watch ignore for `data/`
- `server.ts` — Express server with channel CRUD API

## Theme

Dark mode is default. Toggle via the sun/moon icon in the header. Preference is saved to `localStorage` under `streamix-theme`.
