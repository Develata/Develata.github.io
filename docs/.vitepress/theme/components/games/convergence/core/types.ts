export interface Vector2 {
  x: number;
  y: number;
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Singularity {
  x: number;
  y: number;
  strength: number;
  radius: number;
}

export enum WeaponArchetype {
  Euclidean = 'EUCLIDEAN',
  Gradient = 'GRADIENT',
  Distributed = 'DISTRIBUTED',
}

export enum RoomTopology {
  Plane = 'PLANE',
  Torus = 'TORUS',
  Mobius = 'MOBIUS',
  Sphere = 'SPHERE',
}

export enum ActionType {
  Attack = 'ATTACK',
  Move = 'MOVE',
}

export interface PlayerStats {
  hp: number;
  maxHp: number;
  ammo: number;
  potions: number;
}

export enum EnemyTrait {
  Cloak = 'CLOAK',
  Invisible = 'INVISIBLE',
  Fate = 'FATE',
  Reflect = 'REFLECT',
  Slow = 'SLOW',
  Freeze = 'FREEZE',
  Shrink = 'SHRINK',
}

export interface EnemyProfile {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  traits: EnemyTrait[];
  singularity: Singularity;
}

export enum BuffId {
  Velocity = 'VELOCITY',
  Iterations = 'ITERATIONS',
  Clone = 'CLONE',
  FieldRelief = 'FIELD_RELIEF',
  Potion = 'POTION',
  Ammo = 'AMMO',
}

export interface BuffDefinition {
  id: BuffId;
  label: string;
  description: string;
}

export interface MapPreset {
  id: string;
  name: string;
  topology: RoomTopology;
  description: string;
  background: number;
  singularities: Singularity[];
}

export interface ActionLogEntry {
  turn: number;
  summary: string;
}

export interface WeaponContext {
  originX: number;
  originY: number;
  dirX: number;
  dirY: number;
}
