# GameShelf

A virtual floppy disk shelf for [86Box](https://86box.net/) — browse retro game boxes on a 3D bookshelf, flip through covers, load floppies into the emulator, and read manuals and code wheels.

![GameShelf Screenshot](docs/screenshot.png)

## Features

- **3D Bookshelf** — CSS 3D spines on a wooden shelf, hover to flip and reveal box art
- **3D Box Viewer** — drag to rotate, right-drag to pan, scroll to zoom, double-click to reset
- **Floppy Disk Mounting** — load disk images into 86Box via REST API (`POST /api/fdd/{drive}`)
- **Multi-Disk Support** — per-disk drive selection (A: / B:) for games spanning multiple floppies
- **Manual Viewer** — embedded PDF reader for scanned game manuals
- **Code Wheels & Lookup Tables** — interactive copy-protection code viewers
- **Adaptive Box Dimensions** — box proportions derived from actual cover/spine image aspect ratios
- **WebGL Fallback** — graceful degradation to 2D grid when WebGL is unavailable
- **Pi-Friendly** — pure CSS 3D rendering, no WebGL required for the main UI

## Tech Stack

- **Backend**: .NET 10 (Minimal API)
- **Frontend**: React 19 + Tailwind CSS 4 + Vite
- **No database** — file-based game library

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org/)

## Quick Start

```bash
# Clone
git clone https://github.com/nakioman/GameShelf.git
cd GameShelf

# Install frontend dependencies
cd frontend
npm install

# Build frontend (outputs to src/GameShelf/wwwroot/)
npm run build
cd ..

# Run the backend
cd src/GameShelf
dotnet run
```

Open http://localhost:5000

## Development

```bash
# Terminal 1: Frontend dev server (hot reload)
cd frontend
npm run dev

# Terminal 2: Backend
cd src/GameShelf
dotnet run
```

The Vite dev server proxies API calls to the .NET backend.

## Game Library Structure

Games are stored in the `library/` folder. Each game is a directory with a `game.json` file:

```
library/
├── doom/
│   ├── game.json            # Game metadata
│   ├── cover-front.png      # Box front cover
│   ├── cover-back.webp      # Box back cover
│   ├── cover-spine.webp     # Box spine image
│   ├── disks/
│   │   ├── disk1.img        # Floppy disk images
│   │   ├── disk2.img
│   │   └── disk3.img
│   ├── manual.pdf           # Scanned manual (optional)
│   └── codes/
│       └── codes.json       # Copy-protection codes (optional)
├── monkey-island/
│   └── ...
└── _template/               # Template for adding new games
    └── game.json
```

### game.json format

```json
{
  "title": "DOOM",
  "year": 1993,
  "publisher": "id Software",
  "genre": "FPS",
  "disks": [
    { "label": "Install Disk", "file": "disks/disk1.img" },
    { "label": "Disk 2", "file": "disks/disk2.img" },
    { "label": "Disk 3", "file": "disks/disk3.img" }
  ]
}
```

Cover images are auto-detected by filename: `cover-front.*`, `cover-back.*`, `cover-spine.*` (supports png, jpg, webp, gif, bmp).

### Copy-Protection Codes

Supports two formats in `codes/codes.json`:

**Lookup table:**
```json
{
  "type": "lookup-table",
  "prompt": "What is the recipe on page {page}, line {line}?",
  "entries": {
    "3-5": "3 parts brimstone, 1 part skull"
  }
}
```

**Code wheel** (layered images):
```json
{
  "type": "wheel",
  "config": "wheel-config.json"
}
```

## 86Box Integration

GameShelf communicates with 86Box via a REST API (to be implemented in 86Box):

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `POST` | `/api/fdd/{drive}` | `{ "path": "/path/to/disk.img" }` | Mount a floppy image |
| `DELETE` | `/api/fdd/{drive}` | — | Eject the floppy |

Where `{drive}` is `0` (A:) or `1` (B:).

## Box Art Sources

Demo box art scans from [BigBoxCollection.com](https://bigboxcollection.com/) — a fantastic archive of hi-res retro game box scans.

## Continuing Development on Another Machine

To pick up development on a different machine with Claude Code:

```bash
# 1. Clone the repo
git clone https://github.com/nakioman/GameShelf.git
cd GameShelf

# 2. Install dependencies
cd frontend && npm install && cd ..

# 3. Start Claude Code
claude

# 4. Give Claude context about the project
```

Then tell Claude:

> This is the GameShelf project — a virtual floppy disk shelf for 86Box.
> The backend is .NET 10 in `src/GameShelf/`, the frontend is React+Tailwind in `frontend/`.
> Read the README.md and the CLAUDE.md file for project context.

## License

MIT
