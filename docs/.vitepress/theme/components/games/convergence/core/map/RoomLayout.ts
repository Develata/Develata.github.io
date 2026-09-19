import { GRID_SIZE, MAP_PRESETS } from '../../config';
import { EnemyTrait, RoomTopology, Singularity, Vector2 } from '../types';

export interface EnemySeed {
  id: string;
  name: string;
  hp: number;
  traits: EnemyTrait[];
  singularity: Singularity;
}

export interface RoomLayoutResult {
  seed: number;
  presetId: string;
  topology: RoomTopology;
  label: string;
  description: string;
  background: number;
  playerSpawn: Vector2;
  baseField: Singularity[];
  enemySeeds: EnemySeed[];
}

export class RoomLayout {
  public generate(seed = Date.now()): RoomLayoutResult {
    const normalizedSeed = seed >>> 0;
    const random = mulberry32(normalizedSeed);
    const presetIndex = Math.floor(random() * MAP_PRESETS.length);
    const preset = MAP_PRESETS[presetIndex];

    const playerSpawn = {
      x: Math.floor(GRID_SIZE / 2 + random() * 2 - 1),
      y: Math.floor(GRID_SIZE / 2 + random() * 2 - 1),
    };

    const enemySeeds: EnemySeed[] = [];
    const enemyCount = 3 + Math.floor(random() * 3);
    for (let i = 0; i < enemyCount; i++) {
      enemySeeds.push({
        id: `enemy-${normalizedSeed}-${i}`,
        name: random() > 0.5 ? '奇点观测者' : '引力幽影',
        hp: 50 + Math.floor(random() * 40),
        traits: pickTraits(random),
        singularity: {
          x: Math.floor(random() * GRID_SIZE),
          y: Math.floor(random() * GRID_SIZE),
          strength: - (2 + random() * 2.5),
          radius: 1.5 + random() * 2,
        },
      });
    }

    return {
      seed: normalizedSeed,
      presetId: preset.id,
      topology: preset.topology,
      label: `${preset.name} · 种子 ${normalizedSeed}`,
      description: preset.description,
      background: preset.background,
      playerSpawn,
      baseField: preset.singularities,
      enemySeeds,
    };
  }
}

function pickTraits(random: () => number): EnemyTrait[] {
  const pool = Object.values(EnemyTrait);
  const traitCount = random() > 0.7 ? 2 : 1;
  const result: EnemyTrait[] = [];
  while (result.length < traitCount) {
    const candidate = pool[Math.floor(random() * pool.length)];
    if (!result.includes(candidate)) {
      result.push(candidate);
    }
  }
  return result;
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
