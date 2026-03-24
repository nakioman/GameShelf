import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useFilteredGames } from '../store';
import useStore from '../store';

// Generate a consistent color from title
function titleToColor(title) {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 45%, 32%)`;
}

// Measure image dimensions
function useImageSize(src) {
  const [size, setSize] = useState(null);
  useEffect(() => {
    if (!src) { setSize(null); return; }
    const img = new Image();
    img.onload = () => setSize({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => setSize(null);
    img.src = src;
  }, [src]);
  return size;
}

const SHELF_H = 308; // shelf row height

function GameSpine({ game }) {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(false);
  const selectGame = useStore(s => s.selectGame);
  const color = useMemo(() => titleToColor(game.title), [game.title]);

  const spineSize = useImageSize(game.coverSpine);
  const coverSize = useImageSize(game.coverFront);

  // Derive spine width from actual spine image aspect ratio
  const spineWidth = useMemo(() => {
    if (spineSize) return Math.max(24, Math.min(80, Math.round(SHELF_H * (spineSize.w / spineSize.h))));
    return 48; // default
  }, [spineSize]);

  // Derive cover width from front image aspect ratio
  const coverWidth = useMemo(() => {
    if (coverSize) return Math.round(SHELF_H * (coverSize.w / coverSize.h));
    return 200; // default
  }, [coverSize]);

  const handleClick = () => {
    selectGame(game.id);
  };

  return (
    <div
      className="relative cursor-pointer"
      style={{
        perspective: '800px',
        height: `${SHELF_H}px`,
        width: hovered ? `${coverWidth}px` : `${spineWidth}px`,
        transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        flexShrink: 0,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: hovered
            ? 'rotateY(-180deg)'
            : 'rotateY(0deg)',
          transformOrigin: 'center center',
        }}
        onClick={handleClick}
      >
        {/* SPINE FACE (front) */}
        <div
          className="absolute inset-0 rounded-sm overflow-hidden"
          style={{
            backfaceVisibility: 'hidden',
            background: game.coverSpine ? 'none' : `linear-gradient(135deg, ${color}, ${color}dd)`,
            boxShadow: '2px 2px 8px rgba(0,0,0,0.4), inset -1px 0 4px rgba(255,255,255,0.05)',
          }}
        >
          {/* Spine image if available */}
          {game.coverSpine ? (
            <img src={game.coverSpine} alt={`${game.title} spine`}
                 className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <>
              {/* Spine texture lines */}
              <div className="absolute inset-0 opacity-20"
                   style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.03) 3px, rgba(255,255,255,0.03) 4px)' }} />

              {/* Title — vertical */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className="text-white font-bold text-xs tracking-wider text-center leading-tight"
                  style={{
                    writingMode: 'vertical-rl',
                    textOrientation: 'mixed',
                    transform: 'rotate(180deg)',
                    maxHeight: '240px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    textShadow: '0 1px 3px rgba(0,0,0,0.6)',
                    padding: '8px 2px',
                  }}
                >
                  {game.title}
                </span>
              </div>

              {/* Badges at bottom of spine */}
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex flex-col gap-0.5 items-center">
                {game.diskCount > 1 && (
                  <span className="text-[8px] text-white/70 font-mono">{game.diskCount}D</span>
                )}
              </div>
            </>
          )}
        </div>

        {/* COVER FACE (back — shown when flipped) */}
        <div
          className="absolute inset-0 rounded-md overflow-hidden"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          {game.coverFront ? (
            <img src={game.coverFront} alt={game.title} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div
              className="w-full h-full flex flex-col items-center justify-center p-3 text-center"
              style={{ background: `linear-gradient(160deg, ${color}, #1a1a2e)` }}
            >
              <div className="font-bold text-white text-sm">{game.title}</div>
              <div className="text-xs text-white/60 mt-1">{game.year || ''}</div>
              <div className="text-xs text-white/40 mt-0.5">{game.publisher || ''}</div>
            </div>
          )}

          {/* Overlay info on cover */}
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
            <div className="text-xs font-semibold text-white truncate">{game.title}</div>
            <div className="text-[10px] text-white/60">
              {[game.year, game.publisher].filter(Boolean).join(' · ')}
            </div>
            <div className="flex gap-1 mt-1">
              {game.diskCount > 1 && <span className="text-[9px] px-1 rounded bg-white/20 text-white">{t('shelf.disksCount', { count: game.diskCount })}</span>}
              {game.hasManual && <span className="text-[9px] px-1 rounded bg-white/20 text-white">{t('shelf.manual')}</span>}
              {game.hasCodes && <span className="text-[9px] px-1 rounded bg-white/20 text-white">{t('shelf.codes')}</span>}
            </div>
          </div>

          {/* Click hint */}
          <div className="absolute top-2 right-2 text-[9px] text-white/50 bg-black/40 px-1.5 py-0.5 rounded">
            {t('shelf.clickToSelect')}
          </div>
        </div>
      </div>
    </div>
  );
}

function ShelfRow({ games, rowIndex }) {
  return (
    <div className="relative overflow-hidden">
      {/* Shelf plank */}
      <div className="relative flex items-end px-4 pt-2 pb-0 overflow-hidden" style={{ minHeight: '340px' }}>
        {/* Games sitting on the shelf */}
        <div className="flex items-end gap-[3px] px-2 pb-2 pt-2 w-full flex-wrap overflow-hidden">
          {games.map(game => (
            <GameSpine key={game.id} game={game} />
          ))}
        </div>
      </div>

      {/* The shelf plank itself */}
      <div className="relative h-4 mx-2 rounded-b-sm"
           style={{
             background: 'linear-gradient(180deg, #5d4037, #4e342e)',
             boxShadow: '0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
           }}>
        {/* Wood grain effect */}
        <div className="absolute inset-0 opacity-10 rounded-b-sm"
             style={{ background: 'repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(255,255,255,0.05) 20px, rgba(255,255,255,0.05) 21px)' }} />
      </div>
    </div>
  );
}

export default function Shelf2D() {
  const { t } = useTranslation();
  const games = useFilteredGames();
  const selectGame = useStore(s => s.selectGame);

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

  // Split into rows — each row gets as many spines as fit
  // We'll just put all games in a single wrapping shelf for now
  return (
    <div className="flex-1 overflow-y-auto pb-8"
         style={{ background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
      <ShelfRow games={games} rowIndex={0} />
    </div>
  );
}
