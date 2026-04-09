import * as THREE from 'three';
import type { PathNode } from './types';

const ORTHOGONAL_DIRS = [
  { dx: 0, dy: -1 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
  { dx: 1, dy: 0 },
];

export function findOrthogonalPath(
  size: number,
  startX: number,
  startY: number,
  endX: number,
  endY: number
): PathNode[] {
  const queue: Array<{ x: number; y: number }> = [{ x: startX, y: startY }];
  const visited = new Set<string>([`${startX},${startY}`]);
  const parent = new Map<string, string>();

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.x === endX && current.y === endY) {
      const path: PathNode[] = [];
      let key = `${endX},${endY}`;
      while (key !== `${startX},${startY}`) {
        const [x, y] = key.split(',').map(Number);
        path.push({ x, y });
        const next = parent.get(key);
        if (!next) break;
        key = next;
      }
      path.reverse();
      return path;
    }

    for (const dir of ORTHOGONAL_DIRS) {
      const nextX = current.x + dir.dx;
      const nextY = current.y + dir.dy;
      if (nextX < 0 || nextX >= size || nextY < 0 || nextY >= size) continue;

      const key = `${nextX},${nextY}`;
      if (visited.has(key)) continue;
      visited.add(key);
      parent.set(key, `${current.x},${current.y}`);
      queue.push({ x: nextX, y: nextY });
    }
  }

  return [];
}

export function vectorToOrthogonalGrid(vec: THREE.Vector3): { dx: number; dy: number } {
  const absX = Math.abs(vec.x);
  const absZ = Math.abs(vec.z);
  if (absX < 0.1 && absZ < 0.1) return { dx: 0, dy: 0 };
  if (absX >= absZ) return { dx: Math.sign(vec.x), dy: 0 };
  return { dx: 0, dy: Math.sign(vec.z) };
}
