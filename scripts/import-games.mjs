#!/usr/bin/env node

/**
 * GameShelf Import Script
 *
 * Scans a directory of floppy disk images organized as:
 *   {source_dir}/{game_name},{year}/*.img
 *
 * For each game found:
 *   1. Creates a folder in the GameShelf library
 *   2. Copies/links floppy images
 *   3. Searches MobyGames API for cover art (if API key provided)
 *   4. Tries to find covers on BigBoxCollection.com
 *   5. Prompts interactively for any missing data
 *   6. Generates game.json with requirements
 *
 * Usage:
 *   node import-games.mjs --source /path/to/floppies --library /path/to/library [--api-key MOBY_KEY] [--link]
 *
 * Options:
 *   --source     Source directory with {game},{year}/*.img folders
 *   --library    Target GameShelf library directory
 *   --api-key    MobyGames API key (optional, for cover art)
 *   --link       Create symlinks instead of copying disk images
 *   --skip-existing  Skip games that already have a game.json
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import readline from 'readline';

// ─── CLI Args ──────────────────────────────────────────────────────
const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1) return null;
  return args[idx + 1] || null;
}
function hasFlag(name) { return args.includes(`--${name}`); }

const SOURCE_DIR = getArg('source');
const LIBRARY_DIR = getArg('library');
const MOBY_API_KEY = getArg('api-key') || process.env.MOBY_API_KEY;
const USE_LINKS = hasFlag('link');
const SKIP_EXISTING = hasFlag('skip-existing');

if (!SOURCE_DIR || !LIBRARY_DIR) {
  console.error(`
GameShelf Import Script

Usage:
  node import-games.mjs --source /path/to/floppies --library /path/to/library [options]

Options:
  --api-key KEY      MobyGames API key (or set MOBY_API_KEY env var)
  --link             Create symlinks instead of copying disk images
  --skip-existing    Skip games that already have a game.json

Source directory format:
  {source_dir}/{GameName},{Year}/*.img

Example:
  node import-games.mjs --source ~/floppies --library ./library --api-key abc123
`);
  process.exit(1);
}

// ─── CPU Tiers ─────────────────────────────────────────────────────
const CPU_TIERS = ['8088', '8086', '286', '386', '486', 'pentium', 'pentium2', 'pentium3', 'pentium4'];

// ─── Utilities ─────────────────────────────────────────────────────
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(question, defaultVal = '') {
  const def = defaultVal ? ` [${defaultVal}]` : '';
  return new Promise(resolve => {
    rl.question(`  ${question}${def}: `, answer => {
      resolve(answer.trim() || defaultVal);
    });
  });
}

function askChoice(question, choices) {
  console.log(`  ${question}`);
  choices.forEach((c, i) => console.log(`    ${i + 1}) ${c}`));
  return new Promise(resolve => {
    rl.question(`  Choice [1]: `, answer => {
      const idx = parseInt(answer || '1') - 1;
      resolve(choices[Math.max(0, Math.min(idx, choices.length - 1))]);
    });
  });
}

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, { headers: { 'User-Agent': 'GameShelf-Importer/1.0' } }, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function fetchJson(url) {
  const buf = await fetchUrl(url);
  return JSON.parse(buf.toString('utf-8'));
}

async function downloadFile(url, dest) {
  const buf = await fetchUrl(url);
  fs.writeFileSync(dest, buf);
  return buf.length;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function slugify(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ─── MobyGames API ────────────────────────────────────────────────
const MOBY_BASE = 'https://api.mobygames.com/v1';
const DOS_PLATFORM_ID = 2; // DOS platform on MobyGames

async function mobySearch(title) {
  if (!MOBY_API_KEY) return null;
  try {
    const url = `${MOBY_BASE}/games?api_key=${encodeURIComponent(MOBY_API_KEY)}&title=${encodeURIComponent(title)}&platform=${DOS_PLATFORM_ID}&format=normal`;
    const data = await fetchJson(url);
    await sleep(1100); // Rate limit: 1 req/sec
    if (data.games && data.games.length > 0) {
      return data.games[0]; // Best match
    }
  } catch (e) {
    console.log(`    ⚠ MobyGames search failed: ${e.message}`);
  }
  return null;
}

async function mobyCovers(gameId) {
  if (!MOBY_API_KEY) return null;
  try {
    const url = `${MOBY_BASE}/games/${gameId}/platforms/${DOS_PLATFORM_ID}/covers?api_key=${encodeURIComponent(MOBY_API_KEY)}`;
    const data = await fetchJson(url);
    await sleep(1100);
    return data.cover_groups || [];
  } catch (e) {
    console.log(`    ⚠ MobyGames covers failed: ${e.message}`);
  }
  return [];
}

// ─── BigBoxCollection ──────────────────────────────────────────────
async function tryBigBoxCovers(gameName, destDir) {
  // Try common name patterns on BigBoxCollection
  const slugs = [
    gameName.replace(/\s+/g, ''),
    gameName.replace(/[^a-zA-Z0-9]/g, ''),
    gameName.split(/[:\-–]/).map(w => w.trim().replace(/\s+/g, '')).join(''),
  ];

  for (const slug of [...new Set(slugs)]) {
    const sides = { front: 'front', back: 'back', spine: 'left' };
    let found = false;

    for (const [name, dir] of Object.entries(sides)) {
      const url = `https://bigboxcollection.com/images/textures/${dir}/${slug}.webp`;
      try {
        const dest = path.join(destDir, `cover-${name}.webp`);
        if (fs.existsSync(dest)) { found = true; continue; }
        const size = await downloadFile(url, dest);
        console.log(`    ✓ Downloaded cover-${name}.webp (${(size / 1024).toFixed(0)}KB) from BigBoxCollection`);
        found = true;
      } catch {
        // Not found for this slug
      }
    }
    if (found) return true;
  }
  return false;
}

// ─── Download MobyGames Covers ────────────────────────────────────
async function downloadMobyCovers(coverGroups, destDir) {
  const downloaded = { front: false, back: false, spine: false };

  // Prefer Spanish/European covers, then any country
  const preferredCountries = ['Spain', 'España', 'Europe', 'European Union'];

  // Sort groups: preferred countries first
  const sortedGroups = [...coverGroups].sort((a, b) => {
    const aCountries = (a.countries || []).join(' ');
    const bCountries = (b.countries || []).join(' ');
    const aPreferred = preferredCountries.some(c => aCountries.includes(c));
    const bPreferred = preferredCountries.some(c => bCountries.includes(c));
    if (aPreferred && !bPreferred) return -1;
    if (!aPreferred && bPreferred) return 1;
    return 0;
  });

  for (const group of sortedGroups) {
    const countries = (group.countries || []).join(', ');
    for (const cover of group.covers || []) {
      const scanOf = (cover.scan_of || '').toLowerCase();
      let type = null;
      if (scanOf.includes('front cover') && !downloaded.front) type = 'front';
      else if (scanOf.includes('back cover') && !downloaded.back) type = 'back';
      else if ((scanOf.includes('spine') || scanOf.includes('side')) && !downloaded.spine) type = 'spine';

      if (type && cover.image) {
        try {
          const ext = cover.image.split('.').pop().split('?')[0] || 'jpg';
          const dest = path.join(destDir, `cover-${type}.${ext}`);
          if (fs.existsSync(dest)) { downloaded[type] = true; continue; }
          const size = await downloadFile(cover.image, dest);
          console.log(`    ✓ Downloaded cover-${type}.${ext} (${(size / 1024).toFixed(0)}KB) from MobyGames [${countries}]`);
          downloaded[type] = true;
          await sleep(1100);
        } catch (e) {
          console.log(`    ⚠ Failed to download ${type} cover: ${e.message}`);
        }
      }
    }
  }
  return downloaded;
}

// ─── Guess Requirements from Year ─────────────────────────────────
function guessRequirements(year) {
  if (!year) return { cpuMin: '386', cpu: '', ram: '', video: 'VGA', sound: '', os: 'MS-DOS', disk: '' };
  if (year <= 1984) return { cpuMin: '8088', cpu: '8088/8086', ram: '128 KB', video: 'CGA', sound: 'PC Speaker', os: 'MS-DOS 2.0+', disk: '' };
  if (year <= 1987) return { cpuMin: '8088', cpu: '8088/8086', ram: '256 KB', video: 'CGA/EGA', sound: 'PC Speaker', os: 'MS-DOS 2.0+', disk: '' };
  if (year <= 1989) return { cpuMin: '8086', cpu: '8086/286', ram: '512 KB', video: 'EGA/VGA', sound: 'AdLib / PC Speaker', os: 'MS-DOS 3.0+', disk: '' };
  if (year <= 1991) return { cpuMin: '286', cpu: '286 12 MHz', ram: '640 KB', video: 'EGA/VGA', sound: 'AdLib / Sound Blaster', os: 'MS-DOS 3.3+', disk: '' };
  if (year <= 1993) return { cpuMin: '386', cpu: '386 DX 33 MHz', ram: '2 MB', video: 'VGA', sound: 'Sound Blaster', os: 'MS-DOS 5.0+', disk: '' };
  if (year <= 1995) return { cpuMin: '486', cpu: '486 DX2 66 MHz', ram: '4 MB', video: 'VGA/SVGA', sound: 'Sound Blaster 16', os: 'MS-DOS 5.0+', disk: '' };
  if (year <= 1997) return { cpuMin: 'pentium', cpu: 'Pentium 60 MHz', ram: '8 MB', video: 'SVGA', sound: 'Sound Blaster 16', os: 'MS-DOS 6.0+ / Windows 95', disk: '' };
  return { cpuMin: 'pentium', cpu: 'Pentium 100 MHz', ram: '16 MB', video: 'SVGA', sound: 'Sound Blaster 16', os: 'Windows 95/98', disk: '' };
}

// ─── Genre Detection ──────────────────────────────────────────────
function detectGenre(mobyGame) {
  if (!mobyGame?.genres) return '';
  const genreMap = {
    'Action': 'Action', 'Shooter': 'FPS', 'Adventure': 'Adventure',
    'Role-playing': 'RPG', 'Strategy': 'Strategy', 'Simulation': 'Simulation',
    'Puzzle': 'Puzzle', 'Racing': 'Racing', 'Sports': 'Sports',
    'Educational': 'Educational', 'Platform': 'Platformer',
  };
  for (const g of mobyGame.genres) {
    for (const [key, val] of Object.entries(genreMap)) {
      if (g.genre_name?.includes(key)) return val;
    }
  }
  return mobyGame.genres[0]?.genre_name || '';
}

// ─── Main ──────────────────────────────────────────────────────────
async function main() {
  console.log('\n🎮 GameShelf Import Script\n');

  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`❌ Source directory not found: ${SOURCE_DIR}`);
    process.exit(1);
  }

  if (!fs.existsSync(LIBRARY_DIR)) {
    fs.mkdirSync(LIBRARY_DIR, { recursive: true });
    console.log(`📁 Created library directory: ${LIBRARY_DIR}`);
  }

  if (MOBY_API_KEY) {
    console.log('🔑 MobyGames API key provided — will search for covers and metadata');
  } else {
    console.log('ℹ️  No MobyGames API key — will try BigBoxCollection and prompt for missing data');
    console.log('   Get a free key at: https://www.mobygames.com/info/api/\n');
  }

  // Scan source directory
  const entries = fs.readdirSync(SOURCE_DIR, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => {
      // Matches: "Another World (1991)" or "DOOM,1993" or "SimCity, 1989"
      const match = e.name.match(/^(.+?)\s*[\(\[,]\s*(\d{4})\s*[\)\]]?\s*$/);
      if (!match) {
        console.log(`⚠ Skipping "${e.name}" — doesn't match {name} (year) or {name},{year} format`);
        return null;
      }
      const gameName = match[1].trim();
      const year = parseInt(match[2]);
      const srcPath = path.join(SOURCE_DIR, e.name);
      const imgs = fs.readdirSync(srcPath).filter(f => /\.(img|ima|dsk|vfd|imd|td0|fdi)$/i.test(f)).sort();
      if (imgs.length === 0) {
        console.log(`⚠ Skipping "${e.name}" — no disk images found`);
        return null;
      }
      return { gameName, year, srcPath, imgs, dirName: e.name };
    })
    .filter(Boolean);

  console.log(`\n📦 Found ${entries.length} games to import\n`);

  for (let i = 0; i < entries.length; i++) {
    const { gameName, year, srcPath, imgs, dirName } = entries[i];
    const slug = slugify(gameName);
    const destDir = path.join(LIBRARY_DIR, slug);
    const gameJsonPath = path.join(destDir, 'game.json');

    console.log(`\n━━━ [${i + 1}/${entries.length}] ${gameName} (${year}) ━━━`);
    console.log(`  Source: ${srcPath}`);
    console.log(`  Disks: ${imgs.join(', ')}`);

    if (SKIP_EXISTING && fs.existsSync(gameJsonPath)) {
      console.log('  ⏭ Skipping — game.json already exists');
      continue;
    }

    // Create directories
    const disksDir = path.join(destDir, 'disks');
    fs.mkdirSync(disksDir, { recursive: true });

    // ─── Copy/Link disk images ─────────────────────────────
    for (const img of imgs) {
      const src = path.join(srcPath, img);
      const dest = path.join(disksDir, img);
      if (fs.existsSync(dest)) continue;
      if (USE_LINKS) {
        fs.symlinkSync(path.resolve(src), dest);
        console.log(`  🔗 Linked ${img}`);
      } else {
        fs.copyFileSync(src, dest);
        console.log(`  📋 Copied ${img}`);
      }
    }

    // ─── Search MobyGames ──────────────────────────────────
    let mobyGame = null;
    let publisher = '';
    let genre = '';

    if (MOBY_API_KEY) {
      console.log(`  🔍 Searching MobyGames for "${gameName}"...`);
      mobyGame = await mobySearch(gameName);
      if (mobyGame) {
        console.log(`  ✓ Found: "${mobyGame.title}" (ID: ${mobyGame.game_id})`);
        publisher = mobyGame.moby_score ? '' : ''; // publisher not in search results directly
        genre = detectGenre(mobyGame);

        // Download covers
        console.log('  🖼 Fetching covers from MobyGames...');
        const coverGroups = await mobyCovers(mobyGame.game_id);
        await downloadMobyCovers(coverGroups, destDir);
      } else {
        console.log('  ✗ Not found on MobyGames');
      }
    }

    // ─── Try BigBoxCollection covers ───────────────────────
    const hasFront = fs.readdirSync(destDir).some(f => f.startsWith('cover-front'));
    if (!hasFront) {
      console.log('  🖼 Trying BigBoxCollection...');
      await tryBigBoxCovers(gameName, destDir);
    }

    // ─── Interactive prompts for missing data ──────────────
    console.log('\n  📝 Review / complete game information:');

    const title = await ask('Title', mobyGame?.title || gameName);
    const finalYear = await ask('Year', String(year));
    publisher = await ask('Publisher', publisher);
    genre = await ask('Genre (FPS, Adventure, RPG, Strategy, Simulation, Puzzle, etc.)', genre);

    // Requirements
    const guessed = guessRequirements(parseInt(finalYear));
    console.log('\n  ⚙️  System requirements (press Enter to accept suggestion):');
    const cpuMin = await askChoice('Minimum CPU tier:', CPU_TIERS.map(c =>
      c === guessed.cpuMin ? `${c.toUpperCase()} (suggested)` : c.toUpperCase()
    )).then(c => c.replace(' (suggested)', '').toLowerCase());
    const cpu = await ask('CPU description', guessed.cpu);
    const ram = await ask('RAM', guessed.ram);
    const disk = await ask('Disk space', guessed.disk || `~${imgs.length * 1.44} MB`);
    const video = await ask('Video', guessed.video);
    const sound = await ask('Sound', guessed.sound);
    const os = await ask('OS', guessed.os);

    // Disk labels
    console.log('\n  💾 Disk labels (press Enter to accept default):');
    const disks = [];
    for (let d = 0; d < imgs.length; d++) {
      const defaultLabel = imgs.length === 1 ? 'Game Disk' :
        d === 0 ? 'Install Disk' : `Disk ${d + 1}`;
      const label = await ask(`  ${imgs[d]}`, defaultLabel);
      disks.push({ label, file: `disks/${imgs[d]}` });
    }

    // ─── Generate game.json ────────────────────────────────
    const gameJson = {
      title,
      year: parseInt(finalYear),
      publisher: publisher || null,
      genre: genre || null,
      disks,
      requirements: {
        cpu: cpu || null,
        cpuMin: cpuMin || null,
        ram: ram || null,
        disk: disk || null,
        video: video || null,
        sound: sound || null,
        os: os || null,
      },
      manual: null,
      codes: null,
    };

    fs.writeFileSync(gameJsonPath, JSON.stringify(gameJson, null, 2) + '\n');
    console.log(`\n  ✅ Created ${gameJsonPath}`);

    // Summary of covers
    const covers = fs.readdirSync(destDir).filter(f => f.startsWith('cover-'));
    if (covers.length > 0) {
      console.log(`  🖼 Covers: ${covers.join(', ')}`);
    } else {
      console.log('  ⚠ No cover art found — add cover-front.*, cover-back.*, cover-spine.* manually');
    }
  }

  console.log('\n\n🎉 Import complete!\n');
  rl.close();
}

main().catch(e => {
  console.error('❌ Fatal error:', e);
  rl.close();
  process.exit(1);
});
