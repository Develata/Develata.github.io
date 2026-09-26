import { computed, onMounted, onUnmounted, ref } from 'vue';
import confetti from 'canvas-confetti';
import { generateSudokuPuzzle } from './core';
import { autoEraseNotes, isSolved, moveSelection } from './grid';
import { createSnapshot, restoreSnapshot, saveSudokuState } from './persistence';
import { deserializeGrid, formatTime, getCellClass, loadSavedGame, runVisualSolve, STORAGE_KEY } from './runtime';
import type { Cell, Difficulty, SudokuGameState } from './types';
const MAX_MISTAKES = 3;

export function useSudokuGame() {
  const grid = ref<Cell[]>([]);
  const solution = ref<number[]>([]);
  const selectedIdx = ref<number | null>(null);
  const difficulty = ref<Difficulty>('Easy');
  const gameState = ref<SudokuGameState>('playing');
  const isNoteMode = ref(false);
  const history = ref<string[]>([]);
  const timer = ref(0);
  const mistakes = ref(0);

  let timerId: number | null = null;
  let solveAbortController: AbortController | null = null;

  const numberCounts = computed(() => {
    const counts = Array<number>(10).fill(0);
    grid.value.forEach((cell) => {
      if (cell.val !== 0 && !cell.error) {
        counts[cell.val]++;
      }
    });
    return counts;
  });

  function stopTimer() {
    if (timerId) clearInterval(timerId);
    timerId = null;
  }

  function startTimer() {
    if (!timerId) timerId = window.setInterval(() => timer.value++, 1000);
  }

  function saveState() {
    if (gameState.value !== 'playing') return;
    saveSudokuState(grid.value, solution.value, timer.value, mistakes.value, difficulty.value);
  }

  function saveSnapshot() {
    const snapshot = createSnapshot(grid.value, mistakes.value);
    history.value.push(snapshot);
    if (history.value.length > 20) history.value.shift();
  }

  function resetRuntimeState() {
    stopTimer();
    solveAbortController?.abort();
    solveAbortController = null;
    selectedIdx.value = null;
    gameState.value = 'playing';
    mistakes.value = 0;
    timer.value = 0;
    history.value = [];
    isNoteMode.value = false;
  }

  function newGame() {
    resetRuntimeState();
    const next = generateSudokuPuzzle(difficulty.value);
    solution.value = next.solution;
    grid.value = next.puzzle.map((value) => ({
      val: value,
      fixed: value !== 0,
      notes: new Set<number>(),
      error: false,
    }));
    saveState();
    startTimer();
  }

  function initGame(nextDifficulty?: Difficulty, loadSave = false) {
    if (nextDifficulty) difficulty.value = nextDifficulty;
    if (loadSave) {
      const data = loadSavedGame();
      if (data) {
        grid.value = deserializeGrid(data.grid);
        solution.value = data.solution;
        timer.value = data.timer;
        mistakes.value = data.mistakes;
        difficulty.value = data.difficulty;
        selectedIdx.value = null;
        history.value = [];
        gameState.value = 'playing';
        isNoteMode.value = false;
        startTimer();
        return;
      }
    }

    newGame();
  }

  function checkWin() {
    if (isSolved(grid.value)) {
      gameState.value = 'won';
      stopTimer();
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  function selectCell(index: number) {
    if (gameState.value === 'playing') selectedIdx.value = index;
  }

  function inputNumber(num: number) {
    if (selectedIdx.value === null || gameState.value !== 'playing') {
      return;
    }

    const cell = grid.value[selectedIdx.value];
    if (cell.fixed) {
      return;
    }

    saveSnapshot();
    if (isNoteMode.value) {
      if (cell.notes.has(num)) {
        cell.notes.delete(num);
      } else {
        cell.notes.add(num);
      }
      saveState();
      return;
    }

    if (cell.val === num) {
      cell.val = 0;
      cell.error = false;
      saveState();
      return;
    }

    cell.val = num;
    cell.notes.clear();
    if (num !== solution.value[selectedIdx.value]) {
      cell.error = true;
      mistakes.value++;
      if (navigator.vibrate) {
        navigator.vibrate(200);
      }
      if (mistakes.value >= MAX_MISTAKES) {
        gameState.value = 'lost';
        stopTimer();
        localStorage.removeItem(STORAGE_KEY);
      }
      saveState();
      return;
    }

    cell.error = false;
    autoEraseNotes(grid.value, selectedIdx.value, num);
    checkWin();
    saveState();
  }

  function deleteNumber() {
    if (selectedIdx.value === null || gameState.value !== 'playing') {
      return;
    }
    const cell = grid.value[selectedIdx.value];
    if (cell.fixed) {
      return;
    }
    saveSnapshot();
    cell.val = 0;
    cell.error = false;
    saveState();
  }

  function undo() {
    if (!history.value.length || gameState.value === 'solving') {
      return;
    }
    const snapshot = restoreSnapshot(history.value.pop()!);
    grid.value = snapshot.grid;
    mistakes.value = snapshot.mistakes;
    saveState();
  }

  async function visualizeSolve() {
    if (gameState.value !== 'playing') return;
    if (!confirm('AI 托管将清空当前进度，确定吗？')) return;
    gameState.value = 'solving';
    stopTimer();
    const controller = new AbortController();
    solveAbortController = controller;
    grid.value.forEach((cell) => {
      if (!cell.fixed) {
        cell.val = 0;
        cell.error = false;
        cell.notes.clear();
      }
    });

    try {
      if (await runVisualSolve(grid.value, solution.value, controller.signal) && solveAbortController === controller) {
        gameState.value = 'won';
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      if (solveAbortController === controller && !controller.signal.aborted) {
        gameState.value = 'playing';
        startTimer();
      }
    } finally {
      if (solveAbortController === controller) {
        solveAbortController = null;
      }
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (gameState.value !== 'playing') return;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) {
      event.preventDefault();
    }

    if (selectedIdx.value !== null) {
      selectedIdx.value = moveSelection(selectedIdx.value, event.key);
    }

    const numeric = Number.parseInt(event.key, 10);
    if (!Number.isNaN(numeric) && numeric >= 1 && numeric <= 9) {
      inputNumber(numeric);
    }
    if (event.key === 'Backspace' || event.key === 'Delete') {
      deleteNumber();
    }
    if (event.key.toLowerCase() === 'n') {
      isNoteMode.value = !isNoteMode.value;
    }
    if (event.key.toLowerCase() === 'z' && (event.ctrlKey || event.metaKey)) {
      undo();
    }
  }

  onMounted(() => {
    initGame(undefined, Boolean(localStorage.getItem(STORAGE_KEY)));
    window.addEventListener('keydown', handleKeydown);
  });
  onUnmounted(() => {
    stopTimer();
    solveAbortController?.abort();
    window.removeEventListener('keydown', handleKeydown);
  });

  return {
    difficulty,
    gameState,
    grid,
    isNoteMode,
    mistakes,
    numberCounts,
    selectedIdx,
    timer,
    deleteNumber,
    formatTime,
    getCellClass: (index: number) => getCellClass(grid.value, selectedIdx.value, index),
    initGame,
    inputNumber,
    selectCell,
    undo,
    visualizeSolve,
  };
}
