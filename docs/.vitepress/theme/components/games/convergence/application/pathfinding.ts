import * as THREE from 'three';
import type { PathNode } from './types';

export function findOrthogonalPath(
  size: number,
  startX: number,
  startY: number,
  endX: number,
  endY: number
): PathNode[] {
  if (
    startX < 0 ||
    startX >= size ||
    startY < 0 ||
    startY >= size ||
    endX < 0 ||
    endX >= size ||
    endY < 0 ||
    endY >= size
  ) {
    return [];
  }

  const path: PathNode[] = [];
  let x = startX;
  let y = startY;
  const dx = Math.sign(endX - startX);
  const dy = Math.sign(endY - startY);

  while (x !== endX) {
    x += dx;
    path.push({ x, y });
  }
  while (y !== endY) {
    y += dy;
    path.push({ x, y });
  }

  return path;
}

export function vectorToOrthogonalGrid(vec: THREE.Vector3): { dx: number; dy: number } {
  const absX = Math.abs(vec.x);
  const absZ = Math.abs(vec.z);
  if (absX < 0.1 && absZ < 0.1) return { dx: 0, dy: 0 };
  if (absX >= absZ) return { dx: Math.sign(vec.x), dy: 0 };
  return { dx: 0, dy: Math.sign(vec.z) };
}
