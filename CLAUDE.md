# CLAUDE.md — Project Context for Claude Code

## Project Overview
GameShelf is a virtual floppy disk shelf UI for the 86Box retro PC emulator. Users browse a bookshelf of retro game boxes, hover to see covers, click to select a game, then mount floppy disk images into 86Box.

## Architecture

### Backend (.NET 10)
- **Location**: `src/GameShelf/`
- **Framework**: .NET 10 Minimal API
- **Entry point**: `Program.cs` — defines all API routes
- **Services**:
  - `LibraryService.cs` — scans `library/` folder, loads game metadata, serves media files
  - `EmulatorService.cs` — communicates with 86Box REST API for floppy mounting
- **Models**: `Models/Game.cs` — game metadata, disk list, codes config
- **Static files**: Serves the built React app from `wwwroot/`

### Frontend (React + Tailwind)
- **Location**: `frontend/`
- **Build tool**: Vite — outputs to `../src/GameShelf/wwwroot/`
- **State**: Zustand store in `store.js`
- **Key components**:
  - `Shelf2D.jsx` — main bookshelf view with CSS 3D spine flip animation
  - `Box3D.jsx` — CSS 3D box viewer with rotate/pan/zoom (no WebGL)
  - `BoxDetail.jsx` — game detail modal with disk list, manual, codes
  - `DiskList.jsx` — per-disk mount buttons for A: and B: drives
  - `DriveBar.jsx` — floppy drive status bar (A:/B: with eject)
  - `ManualViewer.jsx` — PDF viewer using pdf.js
  - `CodeViewer.jsx` / `CodeWheel.jsx` / `LookupTable.jsx` — copy-protection code viewers
  - `Shelf3D.jsx` — WebGL fallback detection, lazy-loads Three.js only if needed

### Game Library
- **Location**: `library/`
- Each game is a folder with `game.json` + cover images + disk images
- Cover images auto-detected: `cover-front.*`, `cover-back.*`, `cover-spine.*`
- Spine/cover dimensions derived from actual image aspect ratios

## Build & Run

```bash
# Frontend build
cd frontend && npm install && npm run build

# Backend run
cd src/GameShelf && dotnet run
# → http://localhost:5000
```

## API Routes
- `GET /api/games` — list all games (includes coverFront/Back/Spine URLs)
- `GET /api/games/{id}` — game detail with disks, manual, codes
- `GET /api/games/{id}/media/{path}` — serve media files (covers, manuals)
- `POST /api/fdd/{drive}` — mount floppy (body: `{ path, gameId }`)
- `DELETE /api/fdd/{drive}` — eject floppy
- `POST /api/codewheel/{gameId}/lookup` — code wheel lookup

## Key Design Decisions
- **CSS 3D over WebGL** — works on Pi and Firefox without GPU; Three.js only loaded for optional 3D shelf
- **File-based library** — no database, just folders with JSON + images + disk images
- **Image-driven dimensions** — box/spine sizes computed from actual image aspect ratios, not hardcoded
- **86Box REST API** — assumes 86Box exposes `POST/DELETE /api/fdd/{drive}` (to be implemented)

## Common Tasks
- **Add a game**: Copy `library/_template/`, rename folder, edit `game.json`, add cover images + disk images
- **Change shelf height**: Edit `SHELF_H` constant in `Shelf2D.jsx`
- **Change 86Box API URL**: Edit `appsettings.json` → `EmulatorApiUrl`
