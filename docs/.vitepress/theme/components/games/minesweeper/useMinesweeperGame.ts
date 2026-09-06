import { computed, onUnmounted, reactive, ref } from 'vue';
import confetti from 'canvas-confetti';
import { checkWin, createBoard, flagAllMines, forEachNeighbor, placeMines, revealAllMines, revealRegion } from './core';
import type { Cell, GameConfig, MinesweeperGameState } from './types';

function fireConfetti() {
  const duration = 2000;
  const end = Date.now() + duration;

  (function frame() {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'],
    });
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'],
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}

export function useMinesweeperGame() {
  const config = reactive<GameConfig>({
    rows: 16,
    cols: 16,
    density: 15,
    totalMines: 40,
  });

  const tempConfig = reactive({
    rows: 16,
    cols: 16,
    density: 15,
  });

  const showSettings = ref(false);
  const board = ref<Cell[][]>([]);
  const gameState = ref<MinesweeperGameState>('idle');
  const flagsPlaced = ref(0);
  const timeElapsed = ref(0);
  const mode = ref<'dig' | 'flag'>('dig');

  let timerId: number | null = null;

  const remainMines = computed(() => config.totalMines - flagsPlaced.value);
  const estimatedMines = computed(() => {
    const totalCells = tempConfig.rows * tempConfig.cols;
    return Math.floor(totalCells * (tempConfig.density / 100));
  });

  const numColors = ['', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#f59e0b', '#06b6d4', '#111827', '#6b7280'];

  function stopTimer() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  function startTimer() {
    if (!timerId) {
      timerId = window.setInterval(() => {
        timeElapsed.value++;
      }, 1000);
    }
  }

  function initGame() {
    stopTimer();
    timeElapsed.value = 0;
    gameState.value = 'idle';
    flagsPlaced.value = 0;
    board.value = createBoard(config.rows, config.cols);
  }

  function applySettings() {
    const rows = Math.max(5, Math.min(50, tempConfig.rows));
    const cols = Math.max(5, Math.min(50, tempConfig.cols));
    const density = Math.max(1, Math.min(90, tempConfig.density));
    config.rows = rows;
    config.cols = cols;
    config.density = density;
    config.totalMines = Math.max(1, Math.min(Math.floor(rows * cols * (density / 100)), rows * cols - 9));
    showSettings.value = false;
    initGame();
  }

  function toggleFlag(row: number, col: number) {
    const cell = board.value[row][col];
    if (cell.isOpen) {
      return;
    }
    if (cell.isFlagged) {
      cell.isFlagged = false;
      flagsPlaced.value--;
    } else {
      cell.isFlagged = true;
      flagsPlaced.value++;
    }
  }

  function gameOverLoss(cell: Cell) {
    gameState.value = 'lost';
    stopTimer();
    cell.isExploded = true;
    revealAllMines(board.value, config.rows, config.cols);
  }

  function finalizeWin() {
    gameState.value = 'won';
    stopTimer();
    flagsPlaced.value += flagAllMines(board.value, config.rows, config.cols);
    fireConfetti();
  }

  function reveal(row: number, col: number) {
    const cell = board.value[row][col];
    if (cell.isOpen || cell.isFlagged || gameState.value === 'won' || gameState.value === 'lost') {
      return;
    }

    if (gameState.value === 'idle') {
      gameState.value = 'playing';
      placeMines(board.value, config.rows, config.cols, config.totalMines, row, col);
      startTimer();
    }

    if (cell.isMine) {
      gameOverLoss(cell);
      return;
    }

    revealRegion(board.value, config.rows, config.cols, row, col);
    if (checkWin(board.value, config.rows, config.cols, config.totalMines)) {
      finalizeWin();
    }
  }

  function handleSmartChord(row: number, col: number) {
    const cell = board.value[row][col];
    const neighbors: Cell[] = [];
    let flagged = 0;
    let closed = 0;
    let hiddenUnflagged = 0;

    forEachNeighbor(config.rows, config.cols, row, col, (nextRow, nextCol) => {
      const next = board.value[nextRow][nextCol];
      neighbors.push(next);
      if (next.isFlagged) flagged++;
      if (!next.isOpen) {
        closed++;
        if (!next.isFlagged) hiddenUnflagged++;
      }
    });

    if (closed === cell.count && hiddenUnflagged > 0) {
      neighbors.forEach((neighbor) => {
        if (!neighbor.isOpen && !neighbor.isFlagged) {
          neighbor.isFlagged = true;
          flagsPlaced.value++;
        }
      });
      return;
    }

    if (flagged === cell.count && hiddenUnflagged > 0) {
      neighbors.forEach((neighbor) => {
        if (!neighbor.isOpen && !neighbor.isFlagged) {
          reveal(neighbor.row, neighbor.col);
        }
      });
    }
  }

  function handleClick(row: number, col: number) {
    if (gameState.value === 'won' || gameState.value === 'lost') {
      return;
    }

    const cell = board.value[row][col];
    if (cell.isOpen && cell.count > 0) {
      handleSmartChord(row, col);
      return;
    }

    if (!cell.isOpen) {
      if (mode.value === 'flag') {
        toggleFlag(row, col);
      } else {
        reveal(row, col);
      }
    }
  }

  function handleRightClick(event: MouseEvent, row: number, col: number) {
    event.preventDefault();
    if (gameState.value !== 'won' && gameState.value !== 'lost') {
      toggleFlag(row, col);
    }
  }

  initGame();
  onUnmounted(stopTimer);

  return {
    board,
    estimatedMines,
    flagsPlaced,
    gameState,
    mode,
    numColors,
    remainMines,
    showSettings,
    tempConfig,
    timeElapsed,
    applySettings,
    handleClick,
    handleRightClick,
    initGame,
  };
}
