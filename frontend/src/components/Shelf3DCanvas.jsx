import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import ShelfScene from './ShelfScene';

export default function Shelf3DCanvas() {
  return (
    <div className="w-full h-[calc(100vh-100px)]">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 1.5, 6]} fov={45} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 8, 5]} intensity={0.9} castShadow />
        <pointLight position={[-3, 2, 3]} intensity={0.3} color="#e94560" />
        <ShelfScene />
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          minDistance={3}
          maxDistance={12}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.2}
          minAzimuthAngle={-Math.PI / 4}
          maxAzimuthAngle={Math.PI / 4}
        />
      </Canvas>
    </div>
  );
}
