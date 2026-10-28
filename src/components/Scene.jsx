import { useEffect, useRef } from 'react';
import { initScene } from '../lib/scene.js';

// Animated canvas seascape with an offshore rig. scene: dusk | dawn | day | night | fog | rise
export default function Scene({ scene = 'dusk', rigX = 0.76 }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    return initScene(el);
  }, [scene, rigX]);
  return (
    <div className="scene" ref={ref} data-scene={scene} data-rig-x={rigX} aria-hidden="true">
      <canvas />
    </div>
  );
}
