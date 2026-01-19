import { AWSRegion, Position3D } from './types';

const EARTH_RADIUS = 50;

export function latLngToVector3(lat: number, lng: number, radius: number = EARTH_RADIUS): Position3D {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  return {
    x: -(radius * Math.sin(phi) * Math.cos(theta)),
    y: radius * Math.cos(phi),
    z: radius * Math.sin(phi) * Math.sin(theta)
  };
}

export function findRegionByName(regions: AWSRegion[], name: string): AWSRegion | undefined {
  const lowerName = name.toLowerCase();
  return regions.find(r => 
    r.region.toLowerCase() === lowerName ||
    r.displayName.toLowerCase().includes(lowerName) ||
    r.country.toLowerCase().includes(lowerName)
  );
}

export function findRegionsByCountry(regions: AWSRegion[], country: string): AWSRegion[] {
  const lowerCountry = country.toLowerCase();
  return regions.filter(r => r.country.toLowerCase().includes(lowerCountry));
}

export function getRegionsByCode(regions: AWSRegion[], codes: string[]): AWSRegion[] {
  return regions.filter(r => codes.includes(r.region));
}