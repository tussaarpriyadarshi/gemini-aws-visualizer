export interface AWSRegion {
  region: string;
  displayName: string;
  country: string;
  lat: number;
  lng: number;
  availabilityZones: string[];
}

export interface GeminiAction {
  action: 
    | "highlight_regions"
    | "compare_regions"
    | "camera_fly"
    | "provision_architecture"
    | "error"
    | "latency_suggestion";   // NEW
    

  regions?: string[];
  target?: string;
  architecture?: string[];


  // NEW optional fields
  latency_estimate?: string;   // "20-50ms"
  reason?: string;
}


export interface Position3D {
  x: number;
  y: number;
  z: number;
}