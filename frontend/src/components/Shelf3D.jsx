import { Component, Suspense, lazy, useState, useEffect } from 'react';
import Shelf2D from './Shelf2D';

const Shelf3DCanvas = lazy(() => import('./Shelf3DCanvas'));

// Error boundary as last resort
class WebGLErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error) {
    console.warn('WebGL render error, falling back to 2D:', error.message);
  }
  render() {
    if (this.state.hasError) return <Shelf2D />;
    return this.props.children;
  }
}

// The REAL probe: dynamically import Three.js and try to create a WebGLRenderer.
// This is the exact same code path Three.js/R3F uses internally, so if it fails
// here it would fail in the Canvas too. We destroy the test renderer immediately.
async function probeWebGLWithThree() {
  try {
    const THREE = await import('three');
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    // This is the line that throws "Error creating WebGL context" on your Firefox
    const renderer = new THREE.WebGLRenderer({ canvas });
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
    return true;
  } catch (e) {
    console.warn('WebGL probe failed:', e.message);
    return false;
  }
}

// Cache the promise so we only probe once per session
let _probePromise = null;
function checkWebGL() {
  if (!_probePromise) _probePromise = probeWebGLWithThree();
  return _probePromise;
}

export default function Shelf3D() {
  const [status, setStatus] = useState('checking'); // 'checking' | 'webgl' | 'fallback'

  useEffect(() => {
    checkWebGL().then(ok => setStatus(ok ? 'webgl' : 'fallback'));
  }, []);

  if (status === 'checking') {
    return (
      <div className="flex items-center justify-center h-[60vh] text-shelf-text-dim">
        Cargando estante…
      </div>
    );
  }

  if (status === 'fallback') {
    return <Shelf2D />;
  }

  return (
    <WebGLErrorBoundary>
      <Suspense fallback={
        <div className="flex items-center justify-center h-[60vh] text-shelf-text-dim">
          Cargando estante…
        </div>
      }>
        <Shelf3DCanvas />
      </Suspense>
    </WebGLErrorBoundary>
  );
}
