import { useRef, useState, useEffect } from 'react';

// Load an image and return its natural dimensions
function loadImg(src) {
  return new Promise(resolve => {
    if (!src) return resolve(null);
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight, aspect: img.naturalWidth / img.naturalHeight });
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function CSSBox3D({ game }) {
  const [rotX, setRotX] = useState(-15);
  const [rotY, setRotY] = useState(-25);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [zoom, setZoom] = useState(0.5);
  const [boxSize, setBoxSize] = useState(null);
  const dragging = useRef(false);
  const panning = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  // Measure all images to derive correct proportions
  useEffect(() => {
    Promise.all([
      loadImg(game.coverFront),
      loadImg(game.coverBack),
      loadImg(game.coverSpine),
    ]).then(([front, back, spine]) => {
      const frontAspect = front ? front.aspect : 0.7;
      const spineAspect = spine ? spine.aspect : 0.15;
      const H = 600;
      const W = Math.round(H * frontAspect);
      const D = Math.round(H * spineAspect);
      setBoxSize({ W, H, D });
    });
  }, [game.coverFront, game.coverBack, game.coverSpine]);

  const onPointerDown = (e) => {
    lastPos.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
    // Right-click or middle-click or shift+left = pan
    if (e.button === 2 || e.button === 1 || e.shiftKey) {
      panning.current = true;
      dragging.current = false;
    } else {
      dragging.current = true;
      panning.current = false;
    }
  };
  const onPointerMove = (e) => {
    if (!dragging.current && !panning.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    if (panning.current) {
      setPanX(x => x + dx);
      setPanY(y => y + dy);
    } else {
      setRotY(r => r + dx * 0.5);
      setRotX(r => Math.max(-60, Math.min(60, r - dy * 0.3)));
    }
    lastPos.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = () => { dragging.current = false; panning.current = false; };
  const onContextMenu = (e) => e.preventDefault(); // prevent right-click menu
  const onWheel = (e) => {
    e.preventDefault();
    setZoom(z => Math.max(0.35, Math.min(1.0, z - e.deltaY * 0.001)));
  };
  // Double-click to reset view
  const onDoubleClick = () => {
    setRotX(-15); setRotY(-25);
    setPanX(0); setPanY(0);
    setZoom(0.5);
  };

  if (!boxSize) {
    return (
      <div className="w-full h-full flex items-center justify-center text-shelf-text-dim">
        Loading…
      </div>
    );
  }

  const { W, H, D } = boxSize;
  const hw = W / 2;
  const hh = H / 2;
  const hd = D / 2;

  const spineContent = game.coverSpine ? (
    <img src={game.coverSpine} alt="Spine" className="w-full h-full object-cover" draggable={false} />
  ) : (
    <div className="w-full h-full bg-[#e94560] flex items-center justify-center">
      <span className="text-white text-[10px] font-bold" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
        {game.title}
      </span>
    </div>
  );

  const face = {
    position: 'absolute',
    overflow: 'hidden',
    backfaceVisibility: 'hidden',
  };

  return (
    <div
      className="w-full h-full flex items-center justify-center select-none overflow-hidden"
      style={{
        cursor: panning.current ? 'grabbing' : 'grab',
        perspective: '1200px',
        perspectiveOrigin: 'center center',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onContextMenu={onContextMenu}
      onWheel={onWheel}
      onDoubleClick={onDoubleClick}
    >
      <div style={{
        width: W, height: H,
        position: 'relative',
        transformStyle: 'preserve-3d',
        transform: `translate(${panX}px, ${panY}px) scale(${zoom}) rotateX(${rotX}deg) rotateY(${rotY}deg)`,
        transition: (dragging.current || panning.current) ? 'none' : 'transform 0.3s ease-out',
        willChange: 'transform',
      }}>

        {/* Front face (+Z) */}
        <div style={{ ...face, width: W, height: H, left: 0, top: 0, transform: `translateZ(${hd}px)` }}>
          {game.coverFront ? (
            <img src={game.coverFront} alt="Front" className="w-full h-full object-cover" draggable={false} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg p-4 text-center bg-gradient-to-br from-[#0f3460] to-[#1a1a3e]">
              {game.title}
            </div>
          )}
        </div>

        {/* Back face (-Z) */}
        <div style={{ ...face, width: W, height: H, left: 0, top: 0, transform: `rotateY(180deg) translateZ(${hd}px)` }}>
          {game.coverBack ? (
            <img src={game.coverBack} alt="Back" className="w-full h-full object-cover" draggable={false} />
          ) : (
            <div className="w-full h-full bg-[#16213e]" />
          )}
        </div>

        {/* Right face / spine (+X) */}
        <div style={{ ...face, width: D, height: H, left: hw - hd, top: 0, transform: `rotateY(90deg) translateZ(${hw}px)` }}>
          {spineContent}
        </div>

        {/* Left face (-X) — spine mirrored horizontally */}
        <div style={{
          ...face, width: D, height: H, left: hw - hd, top: 0,
          transform: `rotateY(-90deg) translateZ(${hw}px)`,
        }}>
          <div style={{ width: '100%', height: '100%', transform: 'scaleX(-1)' }}>
            {spineContent}
          </div>
        </div>

        {/* Top face (+Y) */}
        <div style={{ ...face, width: W, height: D, left: 0, top: hh - hd, transform: `rotateX(90deg) translateZ(${hh}px)` }}>
          <div className="w-full h-full bg-[#222244]" />
        </div>

        {/* Bottom face (-Y) */}
        <div style={{ ...face, width: W, height: D, left: 0, top: hh - hd, transform: `rotateX(-90deg) translateZ(${hh}px)` }}>
          <div className="w-full h-full bg-[#111133]" />
        </div>
      </div>
    </div>
  );
}

export default function Box3D({ game }) {
  return <CSSBox3D game={game} />;
}
