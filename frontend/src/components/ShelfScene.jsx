import { useMemo } from 'react';
import { ScrollControls, Scroll } from '@react-three/drei';
import { useFilteredGames } from '../store';
import BookSpine from './BookSpine';

const SHELF_WIDTH = 8;
const SHELF_DEPTH = 1.2;
const PLANK_THICKNESS = 0.08;
const SHELF_Y_SPACING = 2.2;
const GAMES_PER_ROW = 10;
const SPINE_WIDTH = 0.35;
const SPINE_GAP = 0.08;

function ShelfPlank({ y }) {
  return (
    <group position={[0, y, 0]}>
      {/* Main plank */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <boxGeometry args={[SHELF_WIDTH, PLANK_THICKNESS, SHELF_DEPTH]} />
        <meshStandardMaterial color="#5d4037" roughness={0.8} />
      </mesh>
      {/* Front lip */}
      <mesh position={[0, PLANK_THICKNESS / 2 + 0.03, SHELF_DEPTH / 2 - 0.03]}>
        <boxGeometry args={[SHELF_WIDTH, 0.06, 0.06]} />
        <meshStandardMaterial color="#4e342e" roughness={0.7} />
      </mesh>
      {/* Left side panel */}
      <mesh position={[-SHELF_WIDTH / 2 - 0.04, SHELF_Y_SPACING / 2, 0]}>
        <boxGeometry args={[0.08, SHELF_Y_SPACING, SHELF_DEPTH]} />
        <meshStandardMaterial color="#4e342e" roughness={0.8} />
      </mesh>
      {/* Right side panel */}
      <mesh position={[SHELF_WIDTH / 2 + 0.04, SHELF_Y_SPACING / 2, 0]}>
        <boxGeometry args={[0.08, SHELF_Y_SPACING, SHELF_DEPTH]} />
        <meshStandardMaterial color="#4e342e" roughness={0.8} />
      </mesh>
      {/* Back panel */}
      <mesh position={[0, SHELF_Y_SPACING / 2, -SHELF_DEPTH / 2 - 0.02]}>
        <boxGeometry args={[SHELF_WIDTH + 0.16, SHELF_Y_SPACING, 0.04]} />
        <meshStandardMaterial color="#3e2723" roughness={0.9} />
      </mesh>
    </group>
  );
}

export default function ShelfScene() {
  const games = useFilteredGames();

  const rows = useMemo(() => {
    const result = [];
    for (let i = 0; i < games.length; i += GAMES_PER_ROW) {
      result.push(games.slice(i, i + GAMES_PER_ROW));
    }
    return result.length > 0 ? result : [[]];
  }, [games]);

  const totalHeight = rows.length * SHELF_Y_SPACING;
  const needsScroll = rows.length > 2;

  const shelfContent = (
    <group position={[0, -totalHeight / 2 + SHELF_Y_SPACING, 0]}>
      {rows.map((row, rowIdx) => {
        const shelfY = -rowIdx * SHELF_Y_SPACING;
        const startX = -(row.length - 1) * (SPINE_WIDTH + SPINE_GAP) / 2;

        return (
          <group key={rowIdx}>
            <ShelfPlank y={shelfY} />
            {row.map((game, colIdx) => (
              <BookSpine
                key={game.id}
                game={game}
                position={[
                  startX + colIdx * (SPINE_WIDTH + SPINE_GAP),
                  shelfY + PLANK_THICKNESS / 2 + 0.85,
                  SHELF_DEPTH / 2 - 0.5
                ]}
              />
            ))}
          </group>
        );
      })}
      {/* Top plank to cap the shelf */}
      <ShelfPlank y={SHELF_Y_SPACING} />
    </group>
  );

  if (needsScroll) {
    return (
      <ScrollControls pages={rows.length * 0.8} damping={0.2}>
        <Scroll>{shelfContent}</Scroll>
      </ScrollControls>
    );
  }

  return shelfContent;
}
