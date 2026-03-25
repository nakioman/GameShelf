import { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function BoxViewer({ game }) {
  const { t } = useTranslation();
  const containerRef = useRef();
  const [side, setSide] = useState('front'); // 'front' | 'back'
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const src = side === 'front' ? game.coverFront : game.coverBack;
  const hasFront = !!game.coverFront;
  const hasBack = !!game.coverBack;

  // Reset zoom/pan when switching sides
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [side]);

  const onPointerDown = (e) => {
    if (e.button === 2) return; // ignore right-click
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    setPan(p => ({ x: p.x + dx, y: p.y + dy }));
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerUp = () => { dragging.current = false; };

  const onWheel = (e) => {
    e.preventDefault();
    setZoom(z => Math.max(0.5, Math.min(5, z - e.deltaY * 0.002)));
  };

  const onDoubleClick = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Image area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden relative select-none"
        style={{ cursor: dragging.current ? 'grabbing' : zoom > 1 ? 'grab' : 'default' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onWheel={onWheel}
        onDoubleClick={onDoubleClick}
        onContextMenu={(e) => e.preventDefault()}
      >
        {src ? (
          <img
            src={src}
            alt={`${game.title} ${side}`}
            draggable={false}
            className="absolute max-w-none"
            style={{
              top: '50%',
              left: '50%',
              transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${zoom})`,
              maxHeight: zoom <= 1 ? '100%' : 'none',
              maxWidth: zoom <= 1 ? '100%' : 'none',
              objectFit: 'contain',
              transition: dragging.current ? 'none' : 'transform 0.15s ease-out',
              imageRendering: zoom > 2 ? 'pixelated' : 'auto',
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-shelf-text-dim">
            <div className="text-center">
              <div className="text-4xl mb-2">📦</div>
              <div>{t('boxViewer.noImage')}</div>
            </div>
          </div>
        )}
      </div>

      {/* Controls bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/30 border-t border-white/5">
        {/* Front/Back toggle */}
        <div className="flex gap-1">
          <button
            onClick={() => setSide('front')}
            disabled={!hasFront}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              side === 'front'
                ? 'bg-shelf-accent text-white'
                : 'bg-shelf-card text-shelf-text-dim hover:text-shelf-text disabled:opacity-30'
            }`}
          >
            {t('boxViewer.front')}
          </button>
          <button
            onClick={() => setSide('back')}
            disabled={!hasBack}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              side === 'back'
                ? 'bg-shelf-accent text-white'
                : 'bg-shelf-card text-shelf-text-dim hover:text-shelf-text disabled:opacity-30'
            }`}
          >
            {t('boxViewer.back')}
          </button>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
            className="w-6 h-6 rounded bg-shelf-card text-shelf-text-dim hover:text-shelf-text flex items-center justify-center text-sm"
          >
            −
          </button>
          <span className="text-xs text-shelf-text-dim w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(z => Math.min(5, z + 0.25))}
            className="w-6 h-6 rounded bg-shelf-card text-shelf-text-dim hover:text-shelf-text flex items-center justify-center text-sm"
          >
            +
          </button>
          <button
            onClick={onDoubleClick}
            className="px-2 h-6 rounded bg-shelf-card text-shelf-text-dim hover:text-shelf-text text-[10px]"
          >
            {t('boxViewer.reset')}
          </button>
        </div>
      </div>
    </div>
  );
}
