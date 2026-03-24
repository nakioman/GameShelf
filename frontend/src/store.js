import { useMemo } from 'react';
import { create } from 'zustand';
import { fetchGames, fetchGame, mountDisk as apiMount, ejectDisk as apiEject } from './api';

const useStore = create((set, get) => ({
  games: [],
  selectedGame: null,     // full game detail object
  driveStatus: {},        // { 0: { gameId, diskFile, label, gameTitle }, 1: ... }
  filter: { search: '', sort: 'title' },

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

// Derived selector — safe for React 19 (returns stable ref via useMemo)
export function useFilteredGames() {
  const games = useStore(s => s.games);
  const filter = useStore(s => s.filter);
  return useMemo(() => {
    let list = [...games];
    const q = filter.search.toLowerCase();
    if (q) {
      list = list.filter(g =>
        g.title.toLowerCase().includes(q) ||
        (g.publisher || '').toLowerCase().includes(q) ||
        (g.genre || '').toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      if (filter.sort === 'year') return (a.year || 0) - (b.year || 0);
      if (filter.sort === 'publisher') return (a.publisher || '').localeCompare(b.publisher || '');
      return a.title.localeCompare(b.title);
    });
    return list;
  }, [games, filter]);
}
