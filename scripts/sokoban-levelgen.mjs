#!/usr/bin/env node
/**
 * Offline generator and verifier for the VitePress Sokoban level pack.
 *
 * Map alphabet:
 *   # wall, _ floor, . goal, @ player, $ box, * box on goal, + player on goal, space void
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const LEVEL_PATH = path.join(
  REPO_ROOT,
  'docs/.vitepress/theme/components/games/sokoban/levels.generated.json'
);

const BASE_SEED = 'sokoban-v2-default';
const TARGETS = [
  { width: 6, height: 6, boxes: 1, minPushes: 3 },
  { width: 6, height: 7, boxes: 1, minPushes: 4 },
  { width: 7, height: 7, boxes: 1, minPushes: 5 },
  { width: 7, height: 7, boxes: 2, minPushes: 4 },
  { width: 7, height: 8, boxes: 2, minPushes: 5 },
  { width: 8, height: 8, boxes: 2, minPushes: 6 },
  { width: 8, height: 8, boxes: 2, minPushes: 5 },
  { width: 8, height: 9, boxes: 2, minPushes: 5 },
  { width: 9, height: 8, boxes: 3, minPushes: 4 },
  { width: 9, height: 9, boxes: 3, minPushes: 5 },
  { width: 8, height: 8, boxes: 2, minPushes: 5 },
  { width: 8, height: 9, boxes: 2, minPushes: 5 },
];

const DIRS = [
  { name: 'U', row: -1, col: 0 },
  { name: 'D', row: 1, col: 0 },
  { name: 'L', row: 0, col: -1 },
  { name: 'R', row: 0, col: 1 },
];

function hashString(input) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function makeRng(seed) {
  let state = hashString(seed) || 1;
  return () => {
    state = Math.imul(state ^ (state >>> 15), 1 | state);
    state ^= state + Math.imul(state ^ (state >>> 7), 61 | state);
    return ((state ^ (state >>> 14)) >>> 0) / 4294967296;
  };
}

function randInt(rng, max) {
  return Math.floor(rng() * max);
}

function shuffle(items, rng) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randInt(rng, i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function id(row, col, width) {
  return row * width + col;
}

function rowOf(cell, width) {
  return Math.floor(cell / width);
}

function colOf(cell, width) {
  return cell % width;
}

function sortBoxes(boxes) {
  return [...boxes].sort((a, b) => a - b);
}

function boxKey(boxes) {
  return sortBoxes(boxes).join(',');
}

function stateKey(player, boxes) {
  return `${player}|${boxKey(boxes)}`;
}

function isWalkable(layout, cell) {
  return layout.terrain[cell] === 'floor' || layout.terrain[cell] === 'goal';
}

function neighbor(layout, cell, dir, distance = 1) {
  const row = rowOf(cell, layout.width) + dir.row * distance;
  const col = colOf(cell, layout.width) + dir.col * distance;
  if (row < 0 || row >= layout.height || col < 0 || col >= layout.width) {
    return -1;
  }
  return id(row, col, layout.width);
}

function parseRows(rows) {
  const width = Math.max(...rows.map((row) => row.length));
  const height = rows.length;
  const terrain = Array(width * height).fill('void');
  const boxes = [];
  const goals = new Set();
  let player = -1;
  let players = 0;

  for (let row = 0; row < height; row++) {
    const padded = rows[row].padEnd(width, ' ');
    for (let col = 0; col < width; col++) {
      const cell = id(row, col, width);
      const ch = padded[col];
      if (ch === '#') terrain[cell] = 'wall';
      else if (ch === ' ') terrain[cell] = 'void';
      else if (ch === '_') terrain[cell] = 'floor';
      else if (ch === '.') {
        terrain[cell] = 'goal';
        goals.add(cell);
      } else if (ch === '@') {
        terrain[cell] = 'floor';
        player = cell;
        players++;
      } else if (ch === '+') {
        terrain[cell] = 'goal';
        goals.add(cell);
        player = cell;
        players++;
      } else if (ch === '$') {
        terrain[cell] = 'floor';
        boxes.push(cell);
      } else if (ch === '*') {
        terrain[cell] = 'goal';
        goals.add(cell);
        boxes.push(cell);
      } else {
        throw new Error(`Illegal map character "${ch}"`);
      }
    }
  }

  return { width, height, terrain, player, players, boxes: sortBoxes(boxes), goals };
}

function reachable(layout, player, boxes) {
  const occupied = new Set(boxes);
  const seen = new Set([player]);
  const queue = [player];
  for (let head = 0; head < queue.length; head++) {
    const current = queue[head];
    for (const dir of DIRS) {
      const next = neighbor(layout, current, dir);
      if (next === -1 || seen.has(next) || occupied.has(next) || !isWalkable(layout, next)) {
        continue;
      }
      seen.add(next);
      queue.push(next);
    }
  }
  return seen;
}

function isSolved(layout, boxes) {
  return boxes.every((box) => layout.goals.has(box));
}

function pushActions(layout, player, boxes) {
  const reach = reachable(layout, player, boxes);
  const occupied = new Set(boxes);
  const actions = [];

  for (const box of boxes) {
    for (const dir of DIRS) {
      const stand = neighbor(layout, box, { row: -dir.row, col: -dir.col });
      const target = neighbor(layout, box, dir);
      if (
        stand === -1 ||
        target === -1 ||
        !reach.has(stand) ||
        !isWalkable(layout, target) ||
        occupied.has(target)
      ) {
        continue;
      }
      const nextBoxes = boxes.map((value) => (value === box ? target : value));
      actions.push({
        player: box,
        boxes: sortBoxes(nextBoxes),
        signature: `${box}>${target}:${dir.name}`,
      });
    }
  }

  return actions;
}

function solveRows(rows, options = {}) {
  const layout = parseRows(rows);
  const maxStates = options.maxStates ?? 200000;
  const signatureLimit = options.signatureLimit ?? 4;

  if (layout.players !== 1) {
    return { ok: false, reason: `expected 1 player, got ${layout.players}`, layout };
  }
  if (layout.boxes.length === 0 || layout.boxes.length !== layout.goals.size) {
    return {
      ok: false,
      reason: `boxes (${layout.boxes.length}) must equal goals (${layout.goals.size})`,
      layout,
    };
  }
  if (!allWalkableCellsConnected(layout)) {
    return { ok: false, reason: 'walkable cells are not connected', layout };
  }

  let frontier = new Map([
    [
      stateKey(layout.player, layout.boxes),
      { player: layout.player, boxes: layout.boxes, count: 1, path: [] },
    ],
  ]);
  const seenDepth = new Map([[stateKey(layout.player, layout.boxes), 0]]);
  let states = 1;

  for (let pushes = 0; frontier.size > 0; pushes++) {
    let solutionCount = 0;
    let firstPath = null;
    for (const current of frontier.values()) {
      if (!isSolved(layout, current.boxes)) continue;
      solutionCount = Math.min(signatureLimit, solutionCount + current.count);
      firstPath ??= current.path;
    }

    if (solutionCount > 0) {
      const signature = firstPath?.join('|') ?? '';
      return {
        ok: true,
        layout,
        minPushes: pushes,
        optimalSignatures: solutionCount,
        signature,
        states,
        score: scoreSolution(signature, pushes, layout),
      };
    }

    const nextFrontier = new Map();
    for (const current of frontier.values()) {
      for (const action of pushActions(layout, current.player, current.boxes)) {
        const key = stateKey(action.player, action.boxes);
        const nextDepth = pushes + 1;
        const previousDepth = seenDepth.get(key);
        if (previousDepth !== undefined && previousDepth < nextDepth) {
          continue;
        }

        const existing = nextFrontier.get(key);
        if (existing) {
          existing.count = Math.min(signatureLimit, existing.count + current.count);
          continue;
        }

        seenDepth.set(key, nextDepth);
        nextFrontier.set(key, {
          player: action.player,
          boxes: action.boxes,
          count: current.count,
          path: [...current.path, action.signature],
        });
        states++;
        if (states > maxStates) {
          return { ok: false, reason: `solver exceeded ${maxStates} states`, layout };
        }
      }
    }

    frontier = nextFrontier;
  }

  return { ok: false, reason: 'unsolved', layout, states };
}

function allWalkableCellsConnected(layout) {
  const cells = layout.terrain
    .map((terrain, cell) => (terrain === 'floor' || terrain === 'goal' ? cell : -1))
    .filter((cell) => cell !== -1);
  if (cells.length === 0) return false;

  const seen = reachable(layout, cells[0], []);
  return cells.every((cell) => seen.has(cell));
}

function scoreSolution(signature, minPushes, layout) {
  const pushes = signature.length ? signature.split('|') : [];
  let turns = 0;
  let previousDir = '';
  for (const push of pushes) {
    const dir = push.slice(-1);
    if (previousDir && previousDir !== dir) {
      turns++;
    }
    previousDir = dir;
  }

  const pushedSources = new Set(pushes.map((push) => push.split('>')[0]));
  const areaPenalty = Math.max(0, layout.width * layout.height - 54);
  return minPushes * 12 + turns * 7 + pushedSources.size * 3 - areaPenalty;
}

function createTerrain(target, rng) {
  const terrain = Array(target.width * target.height).fill('wall');
  for (let row = 1; row < target.height - 1; row++) {
    for (let col = 1; col < target.width - 1; col++) {
      terrain[id(row, col, target.width)] = 'floor';
    }
  }

  const inner = [];
  for (let row = 1; row < target.height - 1; row++) {
    for (let col = 1; col < target.width - 1; col++) {
      inner.push(id(row, col, target.width));
    }
  }

  const maxWalls = Math.floor(inner.length * 0.22);
  const wallBudget = randInt(rng, Math.max(1, maxWalls + 1));
  for (const cell of shuffle(inner, rng)) {
    if (wallBudget <= countWalls(terrain, target.width, target.height)) {
      break;
    }
    terrain[cell] = 'wall';
    const layout = { width: target.width, height: target.height, terrain };
    if (!allWalkableCellsConnected({ ...layout, goals: new Set(), boxes: [], player: -1 })) {
      terrain[cell] = 'floor';
    }
  }

  return terrain;
}

function countWalls(terrain, width, height) {
  let walls = 0;
  for (let row = 1; row < height - 1; row++) {
    for (let col = 1; col < width - 1; col++) {
      if (terrain[id(row, col, width)] === 'wall') {
        walls++;
      }
    }
  }
  return walls;
}

function degree(layout, cell) {
  let result = 0;
  for (const dir of DIRS) {
    const next = neighbor(layout, cell, dir);
    if (next !== -1 && isWalkable(layout, next)) {
      result++;
    }
  }
  return result;
}

function reversePullActions(layout, player, boxes) {
  const reach = reachable(layout, player, boxes);
  const occupied = new Set(boxes);
  const actions = [];

  for (const box of boxes) {
    for (const dir of DIRS) {
      const stand = neighbor(layout, box, { row: -dir.row, col: -dir.col });
      const previousPlayer = neighbor(layout, box, { row: -dir.row, col: -dir.col }, 2);
      if (
        stand === -1 ||
        previousPlayer === -1 ||
        !reach.has(stand) ||
        !isWalkable(layout, previousPlayer) ||
        occupied.has(stand) ||
        occupied.has(previousPlayer)
      ) {
        continue;
      }

      const nextBoxes = boxes.map((value) => (value === box ? stand : value));
      actions.push({ player: previousPlayer, boxes: sortBoxes(nextBoxes) });
    }
  }

  return actions;
}

function serializeRows(layout, player, boxes) {
  const boxSet = new Set(boxes);
  const rows = [];

  for (let row = 0; row < layout.height; row++) {
    let line = '';
    for (let col = 0; col < layout.width; col++) {
      const cell = id(row, col, layout.width);
      if (layout.terrain[cell] === 'wall') {
        line += '#';
      } else if (layout.terrain[cell] === 'void') {
        line += ' ';
      } else if (boxSet.has(cell) && layout.goals.has(cell)) {
        line += '*';
      } else if (boxSet.has(cell)) {
        line += '$';
      } else if (player === cell && layout.goals.has(cell)) {
        line += '+';
      } else if (player === cell) {
        line += '@';
      } else if (layout.goals.has(cell)) {
        line += '.';
      } else {
        line += '_';
      }
    }
    rows.push(line);
  }

  return rows;
}

function createCandidate(target, seed) {
  const rng = makeRng(seed);
  const terrain = createTerrain(target, rng);
  const layout = {
    width: target.width,
    height: target.height,
    terrain,
    goals: new Set(),
  };

  const walkable = terrain
    .map((value, cell) => (value === 'floor' ? cell : -1))
    .filter((cell) => cell !== -1 && degree({ ...layout, goals: new Set() }, cell) >= 2);
  if (walkable.length < target.boxes * 4 + 2) {
    return null;
  }

  const goals = shuffle(walkable, rng).slice(0, target.boxes);
  layout.goals = new Set(goals);
  for (const goal of goals) {
    terrain[goal] = 'goal';
  }

  let boxes = sortBoxes(goals);
  let player = shuffle(
    walkable.filter((cell) => !layout.goals.has(cell)),
    rng
  )[0];

  const pullSteps = target.minPushes + 3 + randInt(rng, 6);
  for (let step = 0; step < pullSteps; step++) {
    const actions = reversePullActions(layout, player, boxes);
    if (actions.length === 0) {
      break;
    }
    const action = actions[randInt(rng, actions.length)];
    player = action.player;
    boxes = action.boxes;
  }

  if (boxes.some((box) => layout.goals.has(box))) {
    return null;
  }

  return serializeRows(layout, player, boxes);
}

function acceptCandidate(rows, target) {
  const solved = solveRows(rows, { signatureLimit: 3, maxStates: 45000 });
  if (!solved.ok) return null;
  if (solved.layout.width !== target.width || solved.layout.height !== target.height) return null;
  if (solved.layout.boxes.length !== target.boxes) return null;
  if (solved.minPushes < target.minPushes) return null;
  if (solved.optimalSignatures !== 1) return null;
  if (target.minPushes >= 5 && solved.signature.split('|').every((push) => push.endsWith(':R'))) return null;
  return solved;
}

function generateLevel(target, levelIndex) {
  let best = null;
  const attempts = 240;

  for (let attempt = 0; attempt < attempts; attempt++) {
    const seed = `${BASE_SEED}:${levelIndex}:${attempt}`;
    const rows = createCandidate(target, seed);
    if (!rows) continue;

    const solved = acceptCandidate(rows, target);
    if (!solved) continue;

    const candidate = {
      id: `sokoban-${String(levelIndex + 1).padStart(2, '0')}`,
      title: `第 ${levelIndex + 1} 关`,
      rows,
      seed,
      boxCount: target.boxes,
      minPushes: solved.minPushes,
      score: solved.score,
    };

    if (!best || candidate.score > best.score) {
      best = candidate;
    }
    if (best.score >= target.minPushes * 15 + target.boxes * 5) {
      break;
    }
  }

  if (!best) {
    throw new Error(`Failed to generate level ${levelIndex + 1}`);
  }
  return best;
}

function targetVariants(target) {
  const variants = [target];
  if (target.minPushes > 4) {
    variants.push({ ...target, minPushes: target.minPushes - 1 });
  }
  if (target.boxes > 1) {
    variants.push({
      ...target,
      boxes: target.boxes - 1,
      minPushes: Math.max(3, target.minPushes - 1),
    });
  }
  if (target.boxes > 1 && target.minPushes > 4) {
    variants.push({
      ...target,
      boxes: target.boxes - 1,
      minPushes: Math.max(3, target.minPushes - 2),
    });
  }
  return variants;
}

function generateLevels() {
  const levels = [];
  for (let index = 0; index < TARGETS.length; index++) {
    process.stderr.write(`Generating level ${index + 1}/${TARGETS.length}\n`);
    let generated = null;
    const errors = [];
    for (const target of targetVariants(TARGETS[index])) {
      try {
        generated = generateLevel(target, index);
        break;
      } catch (error) {
        errors.push(error.message);
      }
    }
    if (!generated) {
      throw new Error(errors.join('; '));
    }
    levels.push(generated);
  }
  return levels;
}

function checkLevel(level, index) {
  if (!level.id || !Array.isArray(level.rows)) {
    throw new Error(`Level ${index + 1} has invalid shape`);
  }

  const solved = solveRows(level.rows, { signatureLimit: 4, maxStates: 250000 });
  if (!solved.ok) {
    throw new Error(`${level.id}: ${solved.reason}`);
  }

  if (solved.layout.width < 6 || solved.layout.width > 9 || solved.layout.height < 6 || solved.layout.height > 9) {
    throw new Error(`${level.id}: size ${solved.layout.width}x${solved.layout.height} is outside 6..9`);
  }
  if (solved.layout.boxes.length < 1 || solved.layout.boxes.length > 3) {
    throw new Error(`${level.id}: box count ${solved.layout.boxes.length} is outside 1..3`);
  }
  if (solved.layout.boxes.length !== level.boxCount) {
    throw new Error(`${level.id}: metadata boxCount mismatch`);
  }
  if (solved.minPushes !== level.minPushes) {
    throw new Error(`${level.id}: metadata minPushes=${level.minPushes}, solved=${solved.minPushes}`);
  }
  if (solved.optimalSignatures !== 1) {
    throw new Error(`${level.id}: optimal push sequence is not unique`);
  }

  return {
    id: level.id,
    size: `${solved.layout.width}x${solved.layout.height}`,
    boxes: solved.layout.boxes.length,
    minPushes: solved.minPushes,
    score: level.score,
    states: solved.states,
  };
}

function checkLevels(levels) {
  if (!Array.isArray(levels) || levels.length !== TARGETS.length) {
    throw new Error(`Expected ${TARGETS.length} levels, got ${Array.isArray(levels) ? levels.length : 'invalid data'}`);
  }
  return levels.map(checkLevel);
}

function readLevels() {
  return JSON.parse(fs.readFileSync(LEVEL_PATH, 'utf8'));
}

function writeLevels(levels) {
  fs.writeFileSync(LEVEL_PATH, `${JSON.stringify(levels, null, 2)}\n`);
}

function main() {
  const [command, ...args] = process.argv.slice(2);

  if (command === 'generate') {
    const levels = generateLevels();
    const summary = checkLevels(levels);
    if (args.includes('--write')) {
      writeLevels(levels);
    }
    console.table(summary);
    return;
  }

  if (command === 'check') {
    const summary = checkLevels(readLevels());
    console.table(summary);
    return;
  }

  console.error('Usage: node scripts/sokoban-levelgen.mjs <generate --write|check>');
  process.exitCode = 1;
}

main();
