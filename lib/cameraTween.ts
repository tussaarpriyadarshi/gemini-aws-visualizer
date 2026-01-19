// lib/cameraTween.ts
import gsap from "gsap";
import * as THREE from "three";

export function tweenCameraTo(
  camera: THREE.Camera,
  target: THREE.Vector3,
  opts?: {
    duration?: number;
    ease?: string;
    offset?: { x?: number; y?: number; z?: number };
  }
) {
  const duration = opts?.duration ?? 1.8;
  const ease = opts?.ease ?? "power2.inOut";
  const offset = opts?.offset ?? {};

  const final = new THREE.Vector3(
    target.x + (offset.x ?? 0),
    target.y + (offset.y ?? 0),
    target.z + (offset.z ?? 40)
  );

  gsap.to(camera.position, {
    x: final.x,
    y: final.y,
    z: final.z,
    duration,
    ease,
    onUpdate: () => camera.lookAt(0, 0, 0)
  });
}
