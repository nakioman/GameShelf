import { useMemo } from 'react';
import { create } from 'zustand';
import { fetchGames, fetchGame, mountDisk as apiMount, ejectDisk as apiEject } from './api';

const useStore = create((set, get) => ({
  games: [],
  selectedGame: null,     // full game detail object
  driveStatus: {},        // { 0: { gameId, diskFile, label, gameTitle }, 1: ... }
  filter: { search: '', sort: 'title', filterYear: null, filterPublisher: null, filterCpu: null },

  // Modals
  showManual: false,
  showCodes: false,

  loadGames: async () => {
    const data = await fetchGames();
    set({ games: data || [] });
  },

  selectGame: async (id) => {
    if (!id) { set({ selectedGame: null }); return; }
    const game = await fetchGame(id);
    set({ selectedGame: game });
  },

  closeGame: () => set({ selectedGame: null, showManual: false, showCodes: false }),

  setFilter: (patch) => set((s) => ({ filter: { ...s.filter, ...patch } })),

  mountDisk: async (drive, gameId, diskFile) => {
    const result = await apiMount(drive, gameId, diskFile);
    if (result?.mounted) {
      const { games, selectedGame } = get();
      const game = games.find(g => g.id === gameId);
      const disk = selectedGame?.disks?.find(d => d.file === diskFile);
      set((s) => ({
        driveStatus: {
          ...s.driveStatus,
          [drive]: {
            gameId,
            diskFile,
            label: disk?.label || diskFile,
            gameTitle: game?.title || gameId
          }
        }
      }));
      return true;
    }
    return false;
  },

  ejectDisk: async (drive) => {
    const result = await apiEject(drive);
    if (result?.ejected) {
      set((s) => {
        const next = { ...s.driveStatus };
        delete next[drive];
        return { driveStatus: next };
      });
      return true;
    }
    return false;
  },

  openManual: () => set({ showManual: true }),
  closeManual: () => set({ showManual: false }),
  openCodes: () => set({ showCodes: true }),
  closeCodes: () => set({ showCodes: false }),
}));

export default useStore;

// CPU hierarchy — lower index = older/weaker CPU
export const CPU_TIERS = [
  '8088', '8086', '286', '386', '486', 'pentium', 'pentium2', 'pentium3', 'pentium4'
];

export function cpuTierIndex(cpuMin) {
  if (!cpuMin) return -1;
  return CPU_TIERS.indexOf(cpuMin.toLowerCase());
}

// Derived selector — safe for React 19 (returns stable ref via useMemo)
export function useFilteredGames() {
  const games = useStore(s => s.games);
  const filter = useStore(s => s.filter);
  return useMemo(() => {
    let list = [...games];

    // Text search — matches title, publisher, genre, year
    const q = filter.search.toLowerCase();
    if (q) {
      list = list.filter(g =>
        g.title.toLowerCase().includes(q) ||
        (g.publisher || '').toLowerCase().includes(q) ||
        (g.genre || '').toLowerCase().includes(q) ||
        String(g.year || '').includes(q)
      );
    }

    // Year filter
    if (filter.filterYear) {
      list = list.filter(g => g.year === filter.filterYear);
    }

    // Publisher filter
    if (filter.filterPublisher) {
      const pub = filter.filterPublisher.toLowerCase();
      list = list.filter(g => (g.publisher || '').toLowerCase().includes(pub));
    }

    // CPU filter — show games that run on the selected CPU (cpuMin <= selected tier)
    if (filter.filterCpu) {
      const maxTier = cpuTierIndex(filter.filterCpu);
      if (maxTier >= 0) {
        list = list.filter(g => {
          const gameTier = cpuTierIndex(g.cpuMin);
          return gameTier >= 0 && gameTier <= maxTier;
        });
      }
    }

    list.sort((a, b) => {
      if (filter.sort === 'year') return (a.year || 0) - (b.year || 0);
      if (filter.sort === 'publisher') return (a.publisher || '').localeCompare(b.publisher || '');
      return a.title.localeCompare(b.title);
    });
    return list;
  }, [games, filter]);
}
