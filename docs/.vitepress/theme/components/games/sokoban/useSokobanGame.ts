/**
 * @file useSokobanGame.ts
 * @description 推箱子 Vue 运行时胶水。规则判断委托给 core.ts。
 */

import { computed, onMounted, onUnmounted, ref } from 'vue';
import levelData from './levels.generated.json';
import {
  createBoardCells,
  createSnapshot,
  directionFromKey,
  movePlayer,
  parseLevel,
  restoreSnapshot,
} from './core';
import { getLevelRecord, saveLevelRecord } from './records';
import type { Direction, LevelRecord, SokobanLevel } from './types';

const LEVELS = levelData as SokobanLevel[];
const MAX_HISTORY = 300;

function clampLevelIndex(index: number): number {
  return Math.max(0, Math.min(LEVELS.length - 1, index));
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  return Boolean(
    target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"]')
  );
}

export function useSokobanGame() {
  const currentLevelIndex = ref(0);
  const state = ref(parseLevel(LEVELS[0]));
  const history = ref<string[]>([]);
  const bestRecord = ref<LevelRecord | null>(null);

  const currentLevel = computed(() => LEVELS[currentLevelIndex.value]);
  const boardCells = computed(() => createBoardCells(state.value));
  const canUndo = computed(() => history.value.length > 0);
  const canGoPrev = computed(() => currentLevelIndex.value > 0);
  const canGoNext = computed(() => currentLevelIndex.value < LEVELS.length - 1);

  function refreshRecord() {
    bestRecord.value = getLevelRecord(currentLevel.value.id);
  }

  function loadLevel(index: number) {
    currentLevelIndex.value = clampLevelIndex(index);
    state.value = parseLevel(currentLevel.value);
    history.value = [];
    refreshRecord();
  }

  function rememberSnapshot() {
    if (history.value.length >= MAX_HISTORY) {
      history.value.shift();
    }
    history.value.push(createSnapshot(state.value));
  }

  function move(direction: Direction) {
    const result = movePlayer(state.value, direction);
    if (!result.moved) {
      return;
    }

    rememberSnapshot();
    state.value = result.state;
    if (result.won) {
      bestRecord.value = saveLevelRecord(currentLevel.value.id, result.state.moves, result.state.pushes);
    }
  }

  function undo() {
    const snapshot = history.value.pop();
    if (!snapshot) {
      return;
    }
    state.value = restoreSnapshot(state.value, snapshot);
    refreshRecord();
  }

  function reset() {
    loadLevel(currentLevelIndex.value);
  }

  function prevLevel() {
    if (canGoPrev.value) {
      loadLevel(currentLevelIndex.value - 1);
    }
  }

  function nextLevel() {
    if (canGoNext.value) {
      loadLevel(currentLevelIndex.value + 1);
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.defaultPrevented || isEditableTarget(event.target)) {
      return;
    }

    if (event.key.toLowerCase() === 'z' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      undo();
      return;
    }

    if (event.key.toLowerCase() === 'r') {
      event.preventDefault();
      reset();
      return;
    }

    const direction = directionFromKey(event.key);
    if (direction) {
      event.preventDefault();
      move(direction);
    }
  }

  onMounted(() => {
    refreshRecord();
    window.addEventListener('keydown', handleKeydown);
  });

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown);
  });

  return {
    boardCells,
    bestRecord,
    canGoNext,
    canGoPrev,
    canUndo,
    currentLevel,
    currentLevelIndex,
    levelCount: LEVELS.length,
    state,
    loadLevel,
    move,
    nextLevel,
    prevLevel,
    reset,
    undo,
  };
}
