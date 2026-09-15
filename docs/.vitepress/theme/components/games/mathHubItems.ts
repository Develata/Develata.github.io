/**
 * @file mathHubItems.ts
 * @description Math Lab 首页卡片数据。
 */
export interface MathHubItem {
  id: string;
  title: string;
  enTitle: string;
  desc: string;
  icon: string;
  link: string;
  tag: string;
  color: string;
  disabled?: boolean;
}

export const games: MathHubItem[] = [
  {
    id: 'life',
    title: '康威生命游戏',
    enTitle: 'Game of Life',
    desc: '零玩家游戏，观察细胞在数学规则下的繁衍与生灭。',
    icon: '🧬',
    link: '/games/math-lab/life',
    tag: 'Simulation',
    color: '#10b981',
  },
  {
    id: 'elementary-cellular-automata',
    title: '一维元胞自动机',
    enTitle: 'Elementary Cellular Automata',
    desc: '一行初态和一个 8 位规则决定整张时空演化图。',
    icon: '▦',
    link: '/games/math-lab/elementary-cellular-automata',
    tag: 'Automata',
    color: '#22c55e',
  },
  {
    id: 'sandpile',
    title: '阿贝尔沙堆',
    enTitle: 'Abelian Sandpile',
    desc: '局部坍塌规则形成临界态与分形边界。',
    icon: '⛰',
    link: '/games/math-lab/sandpile',
    tag: 'Criticality',
    color: '#f59e0b',
  },
  {
    id: 'percolation',
    title: '渗流模型',
    enTitle: 'Percolation',
    desc: '在随机开放格点中观察连通簇的贯通现象。',
    icon: '◇',
    link: '/games/math-lab/percolation',
    tag: 'Probability',
    color: '#38bdf8',
  },
  {
    id: 'langtons-ant',
    title: 'Langton 蚂蚁',
    enTitle: "Langton's Ant",
    desc: '确定性局部规则在长时间后产生高速公路结构。',
    icon: '●',
    link: '/games/math-lab/langtons-ant',
    tag: 'Automata',
    color: '#ef4444',
  },
  {
    id: 'ising',
    title: 'Ising 模型',
    enTitle: 'Ising Model',
    desc: '用 Metropolis 翻转观察二维自旋系统的有序化。',
    icon: '±',
    link: '/games/math-lab/ising',
    tag: 'Markov Chain',
    color: '#a855f7',
  },
  {
    id: 'reaction-diffusion',
    title: '反应扩散',
    enTitle: 'Gray-Scott',
    desc: '两个浓度场在扩散与反应之间形成图案。',
    icon: '∿',
    link: '/games/math-lab/reaction-diffusion',
    tag: 'PDE',
    color: '#14b8a6',
  },
];
