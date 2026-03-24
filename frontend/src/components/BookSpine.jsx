import { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import useStore from '../store';

const SPINE_WIDTH = 0.35;
const SPINE_HEIGHT = 1.6;
const SPINE_DEPTH = 0.9;

function titleToColor(title) {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 50%, 35%)`;
}

export default function BookSpine({ game, position }) {
  const groupRef = useRef();
  const [hovered, setHovered] = useState(false);
  const [coverTex, setCoverTex] = useState(null);
  const selectGame = useStore(s => s.selectGame);

  const baseColor = useMemo(() => titleToColor(game.title), [game.title]);

  useEffect(() => {
    if (game.coverFront) {
      const loader = new THREE.TextureLoader();
      loader.load(game.coverFront, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        setCoverTex(tex);
      });
    }
  }, [game.coverFront]);

  // Smooth hover: tilt outward and pull forward
  useFrame(() => {
    if (!groupRef.current) return;
    const targetRotY = hovered ? -0.25 : 0;
    const targetZ = hovered ? 0.3 : 0;
    groupRef.current.rotation.y += (targetRotY - groupRef.current.rotation.y) * 0.12;
    groupRef.current.position.z += (targetZ - groupRef.current.position.z) * 0.12;
  });

  // Materials: [+x, -x, +y, -y, +z(spine face), -z(back)]
  const materials = useMemo(() => {
    const topBot = new THREE.MeshStandardMaterial({ color: baseColor, roughness: 0.8 });
    const spineMat = new THREE.MeshStandardMaterial({ color: baseColor, roughness: 0.6 });
    const backMat = new THREE.MeshStandardMaterial({ color: '#1a1a1a', roughness: 0.9 });
    const coverMat = coverTex
      ? new THREE.MeshStandardMaterial({ map: coverTex, roughness: 0.5 })
      : new THREE.MeshStandardMaterial({ color: baseColor, roughness: 0.7 });
    const innerMat = new THREE.MeshStandardMaterial({ color: '#2a2a2a', roughness: 0.9 });

    return [coverMat, innerMat, topBot, topBot, spineMat, backMat];
  }, [baseColor, coverTex]);

  return (
    <group position={position}>
      <group ref={groupRef}>
        <mesh
          castShadow
          onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
          onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
          onClick={(e) => { e.stopPropagation(); selectGame(game.id); }}
          material={materials}
        >
          <boxGeometry args={[SPINE_WIDTH, SPINE_HEIGHT, SPINE_DEPTH]} />
        </mesh>

        {/* Title text on the spine face (+Z) — rotated 90° for vertical reading */}
        <Text
          position={[0, 0, SPINE_DEPTH / 2 + 0.002]}
          rotation={[0, 0, -Math.PI / 2]}
          fontSize={0.09}
          maxWidth={SPINE_HEIGHT - 0.3}
          color="white"
          anchorX="center"
          anchorY="middle"
          textAlign="center"
          outlineWidth={0.005}
          outlineColor="black"
        >
          {game.title}
        </Text>
      </group>
    </group>
  );
}
