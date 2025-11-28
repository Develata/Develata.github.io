<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import confetti from 'canvas-confetti'

// --- 类型定义 ---
interface Cell {
  row: number
  col: number
  isMine: boolean
  isOpen: boolean
  isFlagged: boolean
  count: number // 周围雷数
  isExploded?: boolean // 踩雷标记
}

// --- 游戏配置状态 ---
const config = reactive({
  rows: 16,
  cols: 16,
  density: 15, // 百分比
  totalMines: 40
})

const tempConfig = reactive({
  rows: 16,
  cols: 16,
  density: 15
})

// --- 游戏运行状态 ---
const showSettings = ref(false)
const board = ref<Cell[][]>([])
const gameState = ref<'idle' | 'playing' | 'won' | 'lost'>('idle')
const flagsPlaced = ref(0)
const timeElapsed = ref(0)
const mode = ref<'dig' | 'flag'>('dig') 

let timerId: number | null = null

// --- 计算属性 ---
const remainMines = computed(() => config.totalMines - flagsPlaced.value)

const numColors = [
  '', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#f59e0b', '#06b6d4', '#111827', '#6b7280'
]

// --- 设置逻辑 ---
const estimatedMines = computed(() => {
  const totalCells = tempConfig.rows * tempConfig.cols
  return Math.floor(totalCells * (tempConfig.density / 100))
})

function applySettings() {
  let r = Math.max(5, Math.min(50, tempConfig.rows))
  let c = Math.max(5, Math.min(50, tempConfig.cols))
  let d = Math.max(1, Math.min(90, tempConfig.density))

  config.rows = r
  config.cols = c
  config.density = d
  config.totalMines = Math.floor((r * c) * (d / 100))
  config.totalMines = Math.max(1, Math.min(config.totalMines, r * c - 9))

  showSettings.value = false
  initGame()
}

// --- 核心逻辑 ---

function initGame() {
  stopTimer()
  timeElapsed.value = 0
  gameState.value = 'idle'
  flagsPlaced.value = 0
  
  const { rows, cols } = config
  const newBoard: Cell[][] = []
  
  for (let r = 0; r < rows; r++) {
    const row: Cell[] = []
    for (let c = 0; c < cols; c++) {
      row.push({
        row: r, col: c,
        isMine: false, isOpen: false, isFlagged: false, count: 0
      })
    }
    newBoard.push(row)
  }
  board.value = newBoard
}

function generateMines(excludeRow: number, excludeCol: number) {
  const { rows, cols, totalMines } = config
  let placed = 0
  
  while (placed < totalMines) {
    const r = Math.floor(Math.random() * rows)
    const c = Math.floor(Math.random() * cols)
    
    const isExcluded = Math.abs(r - excludeRow) <= 1 && Math.abs(c - excludeCol) <= 1

    if (!board.value[r][c].isMine && !isExcluded) {
      board.value[r][c].isMine = true
      placed++
    }
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!board.value[r][c].isMine) {
        board.value[r][c].count = countNeighborMines(r, c)
      }
    }
  }
}

function countNeighborMines(r: number, c: number): number {
  let count = 0
  const { rows, cols } = config
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const nr = r + dr
      const nc = c + dc
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board.value[nr][nc].isMine) {
        count++
      }
    }
  }
  return count
}

// --- 交互处理 (Updated) ---

// 统一点击入口
function handleClick(r: number, c: number) {
  if (gameState.value === 'won' || gameState.value === 'lost') return

  const cell = board.value[r][c]

  // 1. 如果点击的是【已翻开的数字】，触发智能判断 (Smart Chord)
  if (cell.isOpen && cell.count > 0) {
    handleSmartChord(r, c)
    return
  }

  // 2. 如果点击的是【未翻开的格子】，执行常规挖开或插旗
  if (!cell.isOpen) {
    if (mode.value === 'flag') {
      toggleFlag(r, c)
    } else {
      reveal(r, c)
    }
  }
}

// 智能和弦：自动插旗或自动挖开
function handleSmartChord(r: number, c: number) {
  const cell = board.value[r][c]
  const { rows, cols } = config
  
  // 获取周围邻居信息
  const neighbors: Cell[] = []
  let flaggedCount = 0
  let closedCount = 0 // 包含已插旗的
  let hiddenUnflaggedCount = 0 // 未翻开且未插旗的

  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue
      const nr = r + dr
      const nc = c + dc
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        const n = board.value[nr][nc]
        neighbors.push(n)
        if (n.isFlagged) flaggedCount++
        if (!n.isOpen) {
          closedCount++
          if (!n.isFlagged) hiddenUnflaggedCount++
        }
      }
    }
  }

  // 策略 A: 自动插旗 (Auto Flag)
  // 如果周围所有未翻开的格子数量(closedCount) 等于 该格子的数字(cell.count)
  // 说明这些未翻开的格子全是雷，自动把没插旗的插上旗
  if (closedCount === cell.count && hiddenUnflaggedCount > 0) {
    neighbors.forEach(n => {
      if (!n.isOpen && !n.isFlagged) {
        n.isFlagged = true
        flagsPlaced.value++
      }
    })
    // 插完旗后，状态变了，重新统计一下，以便看看是否满足策略B（立刻挖开剩余的）
    // 但在这个逻辑下，closedCount == cell.count，说明没有多余的安全格了，所以不需要策略B
    return 
  }

  // 策略 B: 自动挖开 (Auto Reveal / Chord)
  // 如果周围插旗的数量(flaggedCount) 已经等于 该格子的数字(cell.count)
  // 说明雷已经排完了，剩下的未翻开格子全是安全的，自动挖开
  if (flaggedCount === cell.count && hiddenUnflaggedCount > 0) {
    neighbors.forEach(n => {
      if (!n.isOpen && !n.isFlagged) {
        reveal(n.row, n.col)
      }
    })
  }
}

function handleRightClick(e: MouseEvent, r: number, c: number) {
  e.preventDefault() 
  if (gameState.value === 'won' || gameState.value === 'lost') return
  toggleFlag(r, c)
}

function toggleFlag(r: number, c: number) {
  const cell = board.value[r][c]
  if (cell.isOpen) return

  if (cell.isFlagged) {
    cell.isFlagged = false
    flagsPlaced.value--
  } else {
    cell.isFlagged = true
    flagsPlaced.value++
  }
}

function reveal(r: number, c: number) {
  const cell = board.value[r][c]
  if (cell.isFlagged || cell.isOpen) return

  // 第一次点击：生成雷
  if (gameState.value === 'idle') {
    gameState.value = 'playing'
    generateMines(r, c)
    startTimer()
  }

  // 踩雷判断 (注意：如果是 SmartChord 触发的递归，也会走到这里)
  if (cell.isMine) {
    gameOverLoss(cell)
    return
  }

  openCellRecursive(r, c)
  checkWin()
}

function openCellRecursive(r: number, c: number) {
  const { rows, cols } = config
  if (r < 0 || r >= rows || c < 0 || c >= cols) return
  
  const cell = board.value[r][c]
  if (cell.isOpen || cell.isFlagged) return
  
  cell.isOpen = true
  
  if (cell.count === 0) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        openCellRecursive(r + dr, c + dc)
      }
    }
  }
}

function checkWin() {
  const { rows, cols, totalMines } = config
  let openCount = 0
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board.value[r][c].isOpen) openCount++
    }
  }
  
  if (openCount === rows * cols - totalMines) {
    gameState.value = 'won'
    stopTimer()
    flagAllMines()
    fireConfetti()  //触发彩带特效
  }
}
function fireConfetti() {
  const duration = 2000;
  const end = Date.now() + duration;

  (function frame() {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'] // 使用你的游戏主题色
    });
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b']
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  }());
}
function gameOverLoss(triggerCell: Cell) {
  gameState.value = 'lost'
  stopTimer()
  triggerCell.isExploded = true
  
  const { rows, cols } = config
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = board.value[r][c]
      if (cell.isMine) cell.isOpen = true
    }
  }
}

function flagAllMines() {
  const { rows, cols } = config
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = board.value[r][c]
      if (cell.isMine && !cell.isFlagged) {
        cell.isFlagged = true
        flagsPlaced.value++
      }
    }
  }
}

function startTimer() {
  if (timerId) return
  timerId = window.setInterval(() => {
    timeElapsed.value++
  }, 1000)
}

function stopTimer() {
  if (timerId) {
    clearInterval(timerId)
    timerId = null
  }
}


// 初始化默认游戏
initGame()

</script>

<template>
  <div class="minesweeper-container">
    <div class="header-card">
      <div class="top-row">
        <button 
          class="settings-btn" 
          :class="{ active: showSettings }"
          @click="showSettings = !showSettings"
        >
          ⚙️ 设置
        </button>
        
        <button class="reset-face" @click="initGame">
          <span v-if="gameState === 'won'">😎</span>
          <span v-else-if="gameState === 'lost'">😵</span>
          <span v-else-if="gameState === 'playing'">🤔</span>
          <span v-else>🙂</span>
        </button>

        <div class="lcd-screen timer">⏱️ {{ timeElapsed }}</div>
      </div>

      <div v-if="showSettings" class="settings-panel">
        <div class="setting-group">
          <label>规模 (行 x 列)</label>
          <div class="inputs">
            <input type="number" v-model="tempConfig.rows" min="5" max="50">
            <span>x</span>
            <input type="number" v-model="tempConfig.cols" min="5" max="50">
          </div>
        </div>

        <div class="setting-group">
          <label>雷区密度: {{ tempConfig.density }}%</label>
          <input 
            type="range" 
            v-model.number="tempConfig.density" 
            min="5" 
            max="40" 
            step="1"
          >
          <div class="preview-text">预计地雷: {{ estimatedMines }}</div>
        </div>

        <button class="apply-btn" @click="applySettings">✅ 应用并开始</button>
      </div>

      <div class="info-row" v-if="!showSettings">
        <div class="lcd-screen mines">💣 {{ remainMines }}</div>
        
        <div class="mode-toggle">
          <button 
            class="mode-btn"
            :class="{ active: mode === 'dig' }"
            @click="mode = 'dig'"
          >
            ⛏️ 挖开
          </button>
          <button 
            class="mode-btn"
            :class="{ active: mode === 'flag' }"
            @click="mode = 'flag'"
          >
            🚩 插旗
          </button>
        </div>
      </div>
    </div>

    <div class="board-wrapper">
      <div 
        class="board"
        :style="{ 
          gridTemplateColumns: `repeat(${config.cols}, 1fr)`,
        }"
        @contextmenu.prevent
      >
        <div 
          v-for="(row, r) in board" 
          :key="r" 
          class="row-group"
          style="display: contents;" 
        >
          <div 
            v-for="(cell, c) in row" 
            :key="`${r}-${c}`"
            class="cell"
            :class="{ 
              'open': cell.isOpen, 
              'closed': !cell.isOpen,
              'exploded': cell.isExploded,
              'flagged': cell.isFlagged
            }"
            @click="handleClick(r, c)"
            @contextmenu="handleRightClick($event, r, c)"
          >
            <template v-if="cell.isOpen">
              <span v-if="cell.isMine">💣</span>
              <span 
                v-else-if="cell.count > 0" 
                class="num" 
                :style="{ color: numColors[cell.count] }"
              >
                {{ cell.count }}
              </span>
            </template>
            <template v-else>
              <span v-if="cell.isFlagged" class="flag-icon">🚩</span>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.minesweeper-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  margin-top: 20px;
  font-family: sans-serif;
  user-select: none;
  touch-action: manipulation; 
}

/* 头部卡片 */
.header-card {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 16px;
  width: 100%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  transition: all 0.3s;
}

.top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.settings-btn {
  background: none;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  padding: 4px 10px;
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
  transition: all 0.2s;
}
.settings-btn:hover, .settings-btn.active {
  background: var(--vp-c-bg-alt);
  color: var(--vp-c-brand);
  border-color: var(--vp-c-brand);
}

.reset-face {
  font-size: 1.8rem;
  background: none;
  border: none;
  cursor: pointer;
  transition: transform 0.1s;
}
.reset-face:active { transform: scale(0.9); }

/* 设置面板 */
.settings-panel {
  background: var(--vp-c-bg-alt);
  padding: 12px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: slideDown 0.2s ease-out;
  border: 1px solid var(--vp-c-divider);
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.setting-group label {
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
  font-weight: 600;
}

.inputs {
  display: flex;
  align-items: center;
  gap: 8px;
}
.inputs input {
  flex: 1;
  padding: 6px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  text-align: center;
}

.preview-text {
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
  text-align: right;
}

.apply-btn {
  background: var(--vp-c-brand);
  color: white;
  border: none;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
}
.apply-btn:hover { background: var(--vp-c-brand-dark); }

/* 信息栏 */
.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  animation: fadeIn 0.3s;
}

.lcd-screen {
  background: #000;
  color: #f00;
  font-family: monospace;
  font-size: 1.2rem;
  padding: 4px 8px;
  border-radius: 4px;
  min-width: 60px;
  text-align: center;
}

.mode-toggle {
  display: flex;
  background: var(--vp-c-bg-alt);
  border-radius: 8px;
  padding: 2px;
  flex: 1;
  justify-content: center;
}

.mode-btn {
  flex: 1;
  padding: 6px 0;
  font-size: 0.9rem;
  border: none;
  background: transparent;
  color: var(--vp-c-text-2);
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
}

.mode-btn.active {
  background: var(--vp-c-brand);
  color: white;
}

/* 棋盘 */
.board-wrapper {
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  padding-bottom: 10px;
  display: flex;
  justify-content: center;
}

@media (max-width: 600px) {
  .board-wrapper {
    justify-content: flex-start;
    padding-left: 10px;
    padding-right: 10px;
  }
}

.board {
  display: grid;
  gap: 2px;
  background: var(--vp-c-divider);
  padding: 4px;
  border-radius: 4px;
}

.cell {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.1rem;
  cursor: pointer;
  border-radius: 2px;
  transition: background-color 0.1s;
}

.cell.closed {
  background: var(--vp-c-bg-alt);
  border: 1px outset var(--vp-c-divider);
}
.cell.closed:hover { filter: brightness(0.95); }

.cell.open {
  background: var(--vp-c-bg-soft);
  border: 1px solid transparent;
}

.cell.exploded { background: #ef4444 !important; border: none; }

.flag-icon { font-size: 0.9rem; }

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>