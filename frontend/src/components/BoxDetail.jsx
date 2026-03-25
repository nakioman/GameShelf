import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import useStore from '../store';
import Modal from './Modal';
import BoxViewer from './BoxViewer';
import DiskList from './DiskList';
import Requirements from './Requirements';

export default function BoxDetail() {
  const { t } = useTranslation();
  const [tab, setTab] = useState('disks');
  const game = useStore(s => s.selectedGame);
  const closeGame = useStore(s => s.closeGame);
  const openManual = useStore(s => s.openManual);
  const openCodes = useStore(s => s.openCodes);

  if (!game) return null;

  const tabs = [
    { id: 'disks', label: t('tabs.disks') },
    { id: 'requirements', label: t('tabs.requirements') },
    { id: 'extras', label: t('tabs.extras'), show: !!(game.manual || game.codes) },
  ].filter(t => t.show !== false);

  return (
    <Modal onClose={closeGame} className="w-[90%] max-w-[1400px] h-[75vh]">
      <div className="grid grid-cols-[1fr_1fr] bg-shelf-panel rounded-xl overflow-hidden shadow-2xl h-full">
        {/* Left: Cover viewer */}
        <div className="bg-shelf-bg relative h-full flex flex-col">
          <button
            onClick={closeGame}
            className="absolute top-3 left-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-shelf-accent transition-colors z-10"
          >
            &#10005;
          </button>
          <BoxViewer game={game} />
        </div>

        {/* Right: Info panel */}
        <div className="flex flex-col h-full">
          {/* Game header */}
          <div className="p-6 pb-3">
            <h2 className="text-2xl font-bold">{game.title}</h2>
            <div className="flex gap-4 mt-1 text-sm text-shelf-text-dim">
              {game.year && <span>&#128197; {game.year}</span>}
              {game.publisher && <span>&#127970; {game.publisher}</span>}
              {game.genre && <span>&#127918; {game.genre}</span>}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 px-6 border-b border-white/5">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2 text-sm font-medium transition-all border-b-2 -mb-px ${
                  tab === t.id
                    ? 'border-shelf-accent text-shelf-accent'
                    : 'border-transparent text-shelf-text-dim hover:text-shelf-text'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-6 pt-4">
            {tab === 'disks' && <DiskList game={game} />}

            {tab === 'requirements' && (
              <Requirements requirements={game.requirements} />
            )}

            {tab === 'extras' && (
              <div className="flex gap-3 flex-wrap">
                {game.manual && (
                  <button
                    onClick={openManual}
                    className="flex items-center gap-2 px-4 py-2 bg-shelf-card text-shelf-text rounded-lg text-sm font-medium hover:bg-shelf-accent hover:text-white transition-all"
                  >
                    &#128214; {t('boxDetail.readManual')}
                  </button>
                )}
                {game.codes && (
                  <button
                    onClick={openCodes}
                    className="flex items-center gap-2 px-4 py-2 bg-shelf-card text-shelf-text rounded-lg text-sm font-medium hover:bg-shelf-accent hover:text-white transition-all"
                  >
                    &#128272; {game.codes.type === 'wheel' ? t('boxDetail.codeWheel') : t('boxDetail.lookupCodes')}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
