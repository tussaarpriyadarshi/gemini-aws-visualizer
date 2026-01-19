'use client';

import { useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import Earth from './Earth';
import RegionMarkers from './RegionMarkers';
import Arc from './Arc';
import { AWSRegion } from '@/lib/types';
import { latLngToVector3 } from '@/lib/utils';
import { tweenCameraTo } from "@/lib/cameraTween";


interface SceneProps {
  regions: AWSRegion[];
  highlightedRegions: string[];
  flyToRegion: string | null;
  compareRegions: string[];
  onRegionClick: (region: AWSRegion) => void;
}

function CameraController({ flyToRegion, regions }: { flyToRegion: string | null; regions: AWSRegion[] }) {
  const { camera } = useThree();
  const controlsRef = useRef<any>();

  useEffect(() => {
  if (flyToRegion && controlsRef.current) {
    const region = regions.find(r => r.region === flyToRegion);
    if (region) {
      const targetPos = latLngToVector3(region.lat, region.lng, 130);
      tweenCameraTo(
  camera,
  new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z),
  { offset: { z: 40 }, duration: 1.8 }
);


    }
  }
}, [flyToRegion, camera, regions]);


  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={70}
      maxDistance={200}
      target={[0, 0, 0]}
    />
  );
}

export default function Scene({ regions, highlightedRegions, flyToRegion, compareRegions, onRegionClick }: SceneProps) {
  // Calculate arcs between compared regions
  const arcs = [];
  if (compareRegions.length >= 2) {
    const region1 = regions.find(r => r.region === compareRegions[0]);
    const region2 = regions.find(r => r.region === compareRegions[1]);
    
    if (region1 && region2) {
      arcs.push({
        startLat: region1.lat,
        startLng: region1.lng,
        endLat: region2.lat,
        endLng: region2.lng
      });
    }
  }

  return (
    <Canvas style={{ width: '100%', height: '100%', background: '#0a0e27' }}>
      <PerspectiveCamera makeDefault position={[0, 0, 150]} fov={45} />
      <CameraController flyToRegion={flyToRegion} regions={regions} />
      
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[100, 100, 50]} intensity={1.2} />
      <pointLight position={[-100, -100, -50]} intensity={0.6} color="#4a90e2" />
      
      {/* Stars background */}
      <Stars />
      
      {/* Earth and regions */}
      <Earth />
      <RegionMarkers 
        regions={regions} 
        highlightedRegions={highlightedRegions}
        onRegionClick={onRegionClick}
      />
      
      {/* Connection arcs */}
      {arcs.map((arc, i) => (
        <Arc
          key={i}
          startLat={arc.startLat}
          startLng={arc.startLng}
          endLat={arc.endLat}
          endLng={arc.endLng}
        />
      ))}
    </Canvas>
  );
}

// Simple stars component
function Stars() {
  const starsRef = useRef<THREE.Points>(null);
  
  const starGeometry = new THREE.BufferGeometry();
  const starVertices = [];
  
  for (let i = 0; i < 1000; i++) {
    const x = (Math.random() - 0.5) * 500;
    const y = (Math.random() - 0.5) * 500;
    const z = (Math.random() - 0.5) * 500;
    starVertices.push(x, y, z);
  }
  
  starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
  
  return (
    <points ref={starsRef} geometry={starGeometry}>
      <pointsMaterial color="#ffffff" size={0.5} transparent opacity={0.8} />
    </points>
  );
}