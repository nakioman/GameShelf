import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useFilteredGames } from '../store';
import useStore from '../store';

function titleToColor(title) {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 45%, 32%)`;
}

function GameCover({ game }) {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(false);
  const selectGame = useStore(s => s.selectGame);
  const color = useMemo(() => titleToColor(game.title), [game.title]);

  return (
    <div
      className="group relative cursor-pointer rounded-lg overflow-hidden shadow-lg
                 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(233,69,96,0.3)]"
      style={{ aspectRatio: '3 / 4' }}
      onClick={() => selectGame(game.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Cover image */}
      {game.coverFront ? (
        <img
          src={game.coverFront}
          alt={game.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div
          className="w-full h-full flex flex-col items-center justify-center p-4 text-center"
          style={{ background: `linear-gradient(160deg, ${color}, #1a1a2e)` }}
        >
          <div className="text-3xl mb-2">📦</div>
          <div className="font-bold text-white text-sm">{game.title}</div>
          <div className="text-xs text-white/60 mt-1">{game.year || ''}</div>
          <div className="text-xs text-white/40 mt-0.5">{game.publisher || ''}</div>
        </div>
      )}

      {/* Badges */}
      <div className="absolute top-2 right-2 flex gap-1">
        {game.diskCount > 1 && (
          <span className="px-1.5 py-0.5 rounded bg-black/60 text-[10px] text-white font-mono backdrop-blur-sm">
            {game.diskCount}💾
          </span>
        )}
        {game.hasManual && (
          <span className="px-1.5 py-0.5 rounded bg-black/60 text-[10px] text-white backdrop-blur-sm">
            📖
          </span>
        )}
        {game.hasCodes && (
          <span className="px-1.5 py-0.5 rounded bg-black/60 text-[10px] text-white backdrop-blur-sm">
            🔐
          </span>
        )}
      </div>

      {/* Hover overlay with info */}
      <div className={`absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent
                       transition-all duration-300 ${hovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
        <div className="text-sm font-semibold text-white truncate">{game.title}</div>
        <div className="text-[11px] text-white/60 mt-0.5">
          {[game.year, game.publisher].filter(Boolean).join(' · ')}
        </div>
        {game.genre && (
          <div className="text-[10px] text-white/40 mt-0.5">{game.genre}</div>
        )}
      </div>
    </div>
  );
}

export default function Shelf2D() {
  const { t } = useTranslation();
  const games = useFilteredGames();

  if (games.length === 0) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-center text-shelf-text-dim">
        <div>
          <h2 className="text-xl font-semibold text-shelf-text mb-2">{t('shelf.noGames')}</h2>
          <p className="max-w-md">{t('shelf.noGamesHint')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6"
         style={{ background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-5">
        {games.map(game => (
          <GameCover key={game.id} game={game} />
        ))}
      </div>
    </div>
  );
}
