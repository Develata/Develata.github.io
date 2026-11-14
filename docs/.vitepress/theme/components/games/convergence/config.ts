import { BuffDefinition, BuffId, MapPreset, RoomTopology } from './core/types';

export const GRID_SIZE = 20;

export const FIELD_CONSTANTS = {
  maxSingularities: 32,
  defaultStrength: 1.5,
  defaultRadius: 2.5,
};

export const CAMERA_CONFIG = {
  polar: { min: Math.PI * 0.15, max: Math.PI * 0.55 },
  distance: { min: 8, max: 35 },
  damping: 0.08,
};

/**
 * @file config.ts
 * @description 收敛游戏全局配置 (Convergence Game Config)
 * 职责：定义游戏常量，包括颜色调色板、实体属性、地图生成参数等。
 */
export const COLOR_PALETTE = {
  background: 0x101015,
  fog: 0x101015,
  player: 0x00ffff,
  trajectory: 0xff0055,
};

export const PLAYER_BASE_STATS = {
  hp: 120,
  ammo: 30,
  potions: 1,
};

export const MAP_PRESETS: MapPreset[] = [
  {
    id: 'plane-crater',
    name: '欧氏平面',
    topology: RoomTopology.Plane,
    description: '标准平面上遍布浅坑，易于预判。',
    background: 0x060606,
    singularities: [
      { x: 5, y: 5, strength: -2.2, radius: 2 },
      { x: 14, y: 12, strength: -3.4, radius: 2.5 },
      { x: 8, y: 15, strength: 1.4, radius: 3 },
    ],
  },
  {
    id: 'mobius-rift',
    name: '莫比乌斯环带',
    topology: RoomTopology.Mobius,
    description: '左右贯通但会翻转手性，利于折射打法。',
    background: 0x050712,
    singularities: [
      { x: 3, y: 9, strength: -4.2, radius: 1.8 },
      { x: 16, y: 6, strength: -2.9, radius: 2.2 },
      { x: 10, y: 10, strength: 2, radius: 3.2 },
    ],
  },
  {
    id: 'sphere-basin',
    name: '球面极点',
    topology: RoomTopology.Sphere,
    description: '仿佛立于巨型星体表面，子弹可沿地表折返。',
    background: 0x020910,
    singularities: [
      { x: 2, y: 2, strength: -3.2, radius: 2.5 },
      { x: 12, y: 17, strength: -2, radius: 2 },
      { x: 17, y: 4, strength: 1.8, radius: 3.5 },
    ],
  },
];

export const BUFF_LIBRARY: BuffDefinition[] = [
  {
    id: BuffId.Velocity,
    label: '动量注入',
    description: '子弹初速度 +25%。',
  },
  {
    id: BuffId.Iterations,
    label: '收敛加速',
    description: '每回合额外迭代 1 次。',
  },
  {
    id: BuffId.Clone,
    label: '影分裂',
    description: '复制一个玩家镜像，造成 50% 伤害。',
  },
  {
    id: BuffId.FieldRelief,
    label: '势能松弛',
    description: '自身场函数深度 -30%。',
  },
  {
    id: BuffId.Potion,
    label: '反向药剂',
    description: '获得一道可解除 Boss 异常的灵药。',
  },
  {
    id: BuffId.Ammo,
    label: '装药补给',
    description: '立刻补充 1 发弹药，最大弹药 +1。',
  },
];
