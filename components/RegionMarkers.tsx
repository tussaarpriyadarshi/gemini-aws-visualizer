'use client';

import { useRef, useMemo } from 'react';
import { AWSRegion } from '@/lib/types';
import { latLngToVector3 } from '@/lib/utils';
import * as THREE from 'three';

interface RegionMarkersProps {
  regions: AWSRegion[];
  highlightedRegions: string[];
  onRegionClick: (region: AWSRegion) => void;
}

const REGION_RADIUS = 1.6;
const AZ_RADIUS = 0.9;
const AZ_SPACING = 1.4;

export default function RegionMarkers({ regions, highlightedRegions, onRegionClick }: RegionMarkersProps) {
  return (
    <group>
      {regions.map((region) => {
        const isHighlighted = highlightedRegions.includes(region.region);
        const basePosition = latLngToVector3(region.lat, region.lng);
        
        return (
          <group key={region.region}>
            {/* Region marker (base) */}
            <mesh
              position={[basePosition.x, basePosition.y, basePosition.z]}
              onClick={() => onRegionClick(region)}
            >
              <sphereGeometry args={[REGION_RADIUS, 16, 16]} />
              <meshStandardMaterial
                color={isHighlighted ? '#ff6b35' : '#4ecdc4'}
                emissive={isHighlighted ? '#ff6b35' : '#4ecdc4'}
                emissiveIntensity={isHighlighted ? 0.6 : 0.3}
                roughness={0.4}
                metalness={0.6}
              />
            </mesh>

            {/* AZ tower visualization */}
            {region.availabilityZones.map((az, index) => {
              const azOffset = (index + 1) * AZ_SPACING;
              const direction = new THREE.Vector3(basePosition.x, basePosition.y, basePosition.z).normalize();
              const azPosition = {
                x: basePosition.x + direction.x * azOffset,
                y: basePosition.y + direction.y * azOffset,
                z: basePosition.z + direction.z * azOffset
              };

              return (
                <mesh
                  key={az}
                  position={[azPosition.x, azPosition.y, azPosition.z]}
                >
                  <sphereGeometry args={[AZ_RADIUS, 12, 12]} />
                  <meshStandardMaterial
                    color={isHighlighted ? '#ffbe0b' : '#95e1d3'}
                    emissive={isHighlighted ? '#ffbe0b' : '#95e1d3'}
                    emissiveIntensity={isHighlighted ? 0.5 : 0.2}
                    roughness={0.5}
                    metalness={0.4}
                    transparent
                    opacity={0.85}
                  />
                </mesh>
              );
            })}

            {/* Connection lines between region and AZs */}
            {isHighlighted && region.availabilityZones.map((az, index) => {
              const azOffset = (index + 1) * AZ_SPACING;
              const direction = new THREE.Vector3(basePosition.x, basePosition.y, basePosition.z).normalize();
              const azPosition = {
                x: basePosition.x + direction.x * azOffset,
                y: basePosition.y + direction.y * azOffset,
                z: basePosition.z + direction.z * azOffset
              };

              const points = [
                new THREE.Vector3(basePosition.x, basePosition.y, basePosition.z),
                new THREE.Vector3(azPosition.x, azPosition.y, azPosition.z)
              ];

              return (
                <line key={`line-${az}`}>
                  <bufferGeometry>
                    <bufferAttribute
                      attach="attributes-position"
                      count={points.length}
                      array={new Float32Array(points.flatMap(p => [p.x, p.y, p.z]))}
                      itemSize={3}
                    />
                  </bufferGeometry>
                  <lineBasicMaterial color="#ff6b35" linewidth={2} opacity={0.6} transparent />
                </line>
              );
            })}
          </group>
        );
      })}
    </group>
  );
}