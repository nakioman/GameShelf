import useStore from '../store';
import Modal from './Modal';
import Box3D from './Box3D';
import DiskList from './DiskList';

export default function BoxDetail() {
  const game = useStore(s => s.selectedGame);
  const closeGame = useStore(s => s.closeGame);
  const openManual = useStore(s => s.openManual);
  const openCodes = useStore(s => s.openCodes);

  if (!game) return null;

  return (
    <Modal onClose={closeGame} className="w-[90%] max-w-[950px] max-h-[90vh]">
      <div className="grid grid-cols-[1fr_1fr] bg-shelf-panel rounded-xl overflow-hidden shadow-2xl">
        {/* Left: 3D Box */}
        <div className="bg-shelf-bg relative h-[500px]">
          <Box3D game={game} />
          <button
            onClick={closeGame}
            className="absolute top-3 left-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-shelf-accent transition-colors z-10"
          >
            &#10005;
          </button>
          <div className="absolute bottom-3 left-0 right-0 text-center text-xs text-shelf-text-dim/60">
            Drag to rotate · Right-drag to pan · Scroll to zoom · Double-click to reset
          </div>
        </div>

        {/* Right: Info panel */}
        <div className="p-6 overflow-y-auto max-h-[500px] space-y-5">
          <div>
            <h2 className="text-2xl font-bold">{game.title}</h2>
            <div className="flex gap-4 mt-1 text-sm text-shelf-text-dim">
              {game.year && <span>&#128197; {game.year}</span>}
              {game.publisher && <span>&#127970; {game.publisher}</span>}
              {game.genre && <span>&#127918; {game.genre}</span>}
            </div>
          </div>

          <DiskList game={game} />

          {(game.manual || game.codes) && (
            <div>
              <h3 className="text-xs uppercase tracking-widest text-shelf-accent font-semibold mb-2">
                Extras
              </h3>
              <div className="flex gap-3 flex-wrap">
                {game.manual && (
                  <button
                    onClick={openManual}
                    className="flex items-center gap-2 px-4 py-2 bg-shelf-card text-shelf-text rounded-lg text-sm font-medium hover:bg-shelf-accent hover:text-white transition-all"
                  >
                    &#128214; Read Manual
                  </button>
                )}
                {game.codes && (
                  <button
                    onClick={openCodes}
                    className="flex items-center gap-2 px-4 py-2 bg-shelf-card text-shelf-text rounded-lg text-sm font-medium hover:bg-shelf-accent hover:text-white transition-all"
                  >
                    &#128272; {game.codes.type === 'wheel' ? 'Code Wheel' : 'Lookup Codes'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
