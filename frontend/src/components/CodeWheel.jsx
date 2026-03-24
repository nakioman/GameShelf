import { useRef, useState, useCallback } from 'react';

export default function CodeWheel({ config, gameId }) {
  const containerRef = useRef(null);
  const [angle, setAngle] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef(0);

  const getPointerAngle = useCallback((e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI);
  }, []);

  const onDown = (e) => {
    e.preventDefault();
    setDragging(true);
    dragStart.current = getPointerAngle(e) - angle;
  };

  const onMove = (e) => {
    if (!dragging) return;
    e.preventDefault();
    setAngle(getPointerAngle(e) - dragStart.current);
  };

  const onUp = () => setDragging(false);

  return (
    <div>
      <div
        ref={containerRef}
        className="relative w-[350px] h-[350px] mx-auto select-none touch-none"
        onMouseMove={onMove}
        onMouseUp={onUp}
        onMouseLeave={onUp}
        onTouchMove={onMove}
        onTouchEnd={onUp}
      >
        {(config.layers || []).map((layer, i) => (
          <div
            key={i}
            className={`absolute inset-0 rounded-full overflow-hidden ${
              layer.rotatable ? (dragging ? 'cursor-grabbing' : 'cursor-grab') : ''
            }`}
            style={layer.rotatable ? { transform: `rotate(${angle}deg)` } : undefined}
            onMouseDown={layer.rotatable ? onDown : undefined}
            onTouchStart={layer.rotatable ? onDown : undefined}
          >
            <img
              src={`/api/games/${gameId}/media/codes/${layer.image}`}
              alt=""
              className="w-full h-full object-contain pointer-events-none"
              draggable={false}
            />
          </div>
        ))}
      </div>
      <p className="text-center text-xs text-shelf-text-dim italic mt-3">
        Drag the inner wheel to rotate
      </p>
    </div>
  );
}
