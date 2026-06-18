# StreamiX — Live Television Protocol

Cyberpunk brutalist live TV streaming platform with 365 channels, HLS playback, multi-stream failover, EPG, and dark/light themes — fully static, no backend required.

## Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Hash Router
- **Video:** HLS.js with quality/audio track selection
- **Icons:** Lucide React
- **Build:** Vite, TypeScript (strict)
- **Data:** Static JSON imports (channels, categories, EPG)

## Getting Started

```bash
npm install
npm run dev
```

Runs Vite dev server on `http://localhost:5173`. TypeScript and Vite builds must pass:

```bash
npx tsc --noEmit && npx vite build
```

## Features

- 365 live TV channels across 13 categories
- Channel grid with category filtering, search, sticky filter bar
- HLS video player: multi-stream failover (PRI/ALT), quality selector, audio tracks, PiP, theater mode, fullscreen, keyboard shortcuts, stats overlay, screenshot
- Electronic Program Guide (EPG) with progress bar and upcoming schedule
- Favorites, watch history (localStorage)
- Validate view: test and copy stream URLs
- Dark theme (default) / Light theme toggle (persisted to `localStorage`)
- Mobile responsive: hamburger menu, sidebar overlay, touch-friendly layout
- PWA: manifest.json, service worker, installable

## Project Structure

```
src/
├── App.tsx                      # Root: router, theme, mobile menu state
├── main.tsx                     # Entry point
├── index.css                    # Tailwind v4 theme, custom classes
├── vite-env.d.ts                # Vite client type reference
├── components/
│   ├── layout/                  # Header, Sidebar
│   ├── views/                   # Home, Channels, ChannelPlayer, Favorites,
│   │                            # History, Search, Categories, EPG, Validate, Settings
│   └── player/                  # VideoPlayer (HLS.js with full control bar)
├── data/                        # Static JSON (channels, categories, countries, EPG)
├── hooks/                       # useChannels, useEPG (react-query)
├── lib/
│   └── services/                # DataProvider, ChannelService, EPGService
└── types/                       # TypeScript interfaces
```

## Data Generation

```bash
node scripts/generate-channels.mjs
```

Parses M3U files from `link/`, merges with `channels.meta.json`, and outputs `data/channels.json` (365 channels) plus categories and countries JSON.

## Theme

Dark mode is default. Toggle via the sun/moon icon in the header. Preference saved to `localStorage` under `streamix-theme`.
