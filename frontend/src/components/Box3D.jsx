import { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const [rotX, setRotX] = useState(0);
  const [rotY, setRotY] = useState(0);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [zoom, setZoom] = useState(null);
  const [boxSize, setBoxSize] = useState(null);
  const containerRef = useRef();
  const dragging = useRef(false);
  const panning = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const [imageDims, setImageDims] = useState(null);
  const [containerSize, setContainerSize] = useState(null);

  // Track container size
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const update = () => {
      if (container.clientHeight > 0) {
        setContainerSize({ w: container.clientWidth, h: container.clientHeight });
      }
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Load images
  useEffect(() => {
    Promise.all([
      loadImg(game.coverFront),
      loadImg(game.coverBack),
      loadImg(game.coverSpine),
    ]).then(([front, back, spine]) => {
      setImageDims({ front, back, spine });
    });
  }, [game.coverFront, game.coverBack, game.coverSpine]);

  // Calculate box size when both images and container are ready
  useEffect(() => {
    if (!imageDims || !containerSize) return;

    const { front, back, spine } = imageDims;
    const frontAspect = front ? front.aspect : 0.7;
    const spineAspect = spine ? spine.aspect : 0.15;

    const nativeH = Math.max(
      front ? front.h : 0,
      back ? back.h : 0,
      spine ? spine.h : 0,
      800
    );
    const H = Math.min(nativeH, 2000);
    const W = Math.round(H * frontAspect);
    const D = Math.round(H * spineAspect);

    const cw = containerSize.w - 60;
    const ch = containerSize.h - 80;
    // Account for spine depth adding to visible width when rotated
    const initialScale = Math.min(ch / H, cw / (W + D));

    setBoxSize({ W, H, D, initialScale });
    setZoom(null);
  }, [imageDims, containerSize]);

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
    if (!boxSize) return;
    const minScale = boxSize.initialScale * 0.4;
    const maxScale = 1.0; // 1.0 = native image resolution
    setZoom(z => Math.max(minScale, Math.min(maxScale, (z ?? boxSize.initialScale) - e.deltaY * 0.0005)));
  };
  // Double-click to reset view
  const onDoubleClick = () => {
    setRotX(0); setRotY(0);
    setPanX(0); setPanY(0);
    setZoom(boxSize ? boxSize.initialScale : 0.5);
  };

  const ready = !!boxSize;
  const W = boxSize?.W || 0;
  const H = boxSize?.H || 0;
  const D = boxSize?.D || 0;
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

  const currentZoom = zoom ?? (boxSize?.initialScale || 0.2);

  return (
    <div
      ref={containerRef}
      className="w-full h-full select-none overflow-hidden"
      style={{
        position: 'relative',
        cursor: panning.current ? 'grabbing' : 'grab',
        perspective: '1200px',
        perspectiveOrigin: 'center center',
      }}
      onPointerDown={ready ? onPointerDown : undefined}
      onPointerMove={ready ? onPointerMove : undefined}
      onPointerUp={ready ? onPointerUp : undefined}
      onPointerLeave={ready ? onPointerUp : undefined}
      onContextMenu={ready ? onContextMenu : undefined}
      onWheel={ready ? onWheel : undefined}
      onDoubleClick={ready ? onDoubleClick : undefined}
    >
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center text-shelf-text-dim z-10">
          {t('common.loading')}
        </div>
      )}
      <div style={{
        width: W, height: H,
        position: 'absolute',
        left: '50%', top: '50%',
        marginLeft: -hw, marginTop: -H / 2,
        transformStyle: 'preserve-3d',
        transform: `translate(${panX}px, ${panY}px) scale(${currentZoom}) rotateX(${rotX}deg) rotateY(${rotY}deg)`,
        transition: (dragging.current || panning.current) ? 'none' : 'transform 0.3s ease-out',
        willChange: 'transform',
        visibility: ready ? 'visible' : 'hidden',
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
