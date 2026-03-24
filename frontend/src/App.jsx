import { useEffect } from 'react';
import useStore from './store';
import Header from './components/Header';
import DriveBar from './components/DriveBar';
import Shelf2D from './components/Shelf2D';
import BoxDetail from './components/BoxDetail';
import ManualViewer from './components/ManualViewer';
import CodeViewer from './components/CodeViewer';

export default function App() {
  const loadGames = useStore(s => s.loadGames);
  const selectedGame = useStore(s => s.selectedGame);
  const showManual = useStore(s => s.showManual);
  const showCodes = useStore(s => s.showCodes);

  useEffect(() => { loadGames(); }, [loadGames]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <DriveBar />
      <main className="flex-1 relative">
        <Shelf2D />
      </main>
      {selectedGame && <BoxDetail />}
      {showManual && selectedGame && <ManualViewer gameId={selectedGame.id} />}
      {showCodes && selectedGame && <CodeViewer game={selectedGame} />}
    </div>
  );
}
