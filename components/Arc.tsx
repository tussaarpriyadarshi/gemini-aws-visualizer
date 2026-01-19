'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { latLngToVector3 } from '@/lib/utils';

interface ArcProps {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color?: string;
}

export default function Arc({ startLat, startLng, endLat, endLng, color = '#ff6b35' }: ArcProps) {
  const points = useMemo(() => {
    const start = latLngToVector3(startLat, startLng);
    const end = latLngToVector3(endLat, endLng);

    const startVec = new THREE.Vector3(start.x, start.y, start.z);
    const endVec = new THREE.Vector3(end.x, end.y, end.z);

    // Create arc by interpolating along great circle
    const arcPoints: THREE.Vector3[] = [];
    const segments = 50;
    
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const point = new THREE.Vector3().lerpVectors(startVec, endVec, t);
      
      // Add height to arc (parabolic curve)
      const arcHeight = Math.sin(t * Math.PI) * 15;
      point.normalize().multiplyScalar(50 + arcHeight);
      
      arcPoints.push(point);
    }

    return arcPoints;
  }, [startLat, startLng, endLat, endLng]);

  const curve = useMemo(() => new THREE.CatmullRomCurve3(points), [points]);

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length}
          array={new Float32Array(points.flatMap(p => [p.x, p.y, p.z]))}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color={color} linewidth={3} transparent opacity={0.8} />
    </line>
  );
}