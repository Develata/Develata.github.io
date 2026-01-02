<!--
  @file Sudoku.vue
  @description 数独游戏组件 (Sudoku)
  职责：
  1. 生成唯解数独题目。
  2. 提供数字填入、笔记模式与冲突提示。
  3. 支持回溯算法可视化求解。
-->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import confetti from 'canvas-confetti'

// --- 类型定义 ---
type Difficulty = 'Easy' | 'Medium' | 'Hard'
type GameState = 'playing' | 'won' | 'lost' | 'solving'

interface Cell {
  val: number
  fixed: boolean
  notes: Set<number>
  error: boolean
}

interface SaveData {
  grid: { val: number; fixed: boolean; notes: number[]; error: boolean }[]
  solution: number[]
  timer: number
  mistakes: number
  difficulty: Difficulty
}

// --- 配置 ---
const ANIMATION_DELAY = 20
const MAX_MISTAKES = 3

// --- 状态 ---
const grid = ref<Cell[]>([])
const solution = ref<number[]>([])
const selectedIdx = ref<number | null>(null)
const difficulty = ref<Difficulty>('Easy')
const gameState = ref<GameState>('playing')
const isNoteMode = ref(false)
const history = ref<string[]>([])
const timer = ref(0)
const mistakes = ref(0)

let timerId: number | null = null
let solveAbortController: AbortController | null = null

// --- 计算属性 ---
const numberCounts = computed(() => {
  const counts = Array(10).fill(0)
  grid.value.forEach(cell => {
    if (cell.val !== 0 && !cell.error) counts[cell.val]++
  })
  return counts
})

// --- 坐标映射 (核心修复) ---
function getGlobalIndex(boxIndex: number, cellIndex: number): number {
  // boxIndex: 0-8 (大宫格)
  // cellIndex: 0-8 (宫内格)
  const boxRow = Math.floor(boxIndex / 3)
  const boxCol = boxIndex % 3
  const cellRow = Math.floor(cellIndex / 3)
  const cellCol = cellIndex % 3

  const globalRow = boxRow * 3 + cellRow
  const globalCol = boxCol * 3 + cellCol

  return globalRow * 9 + globalCol
}

// --- 核心逻辑 ---

function initGame(newDiff?: Difficulty, loadSave = false) {
  if (newDiff) difficulty.value = newDiff
  if (solveAbortController) solveAbortController.abort()
  stopTimer()

  if (loadSave) {
    const saved = localStorage.getItem('sudoku-state')
    if (saved) {
      try {
        const data = JSON.parse(saved) as SaveData
        grid.value = data.grid.map(c => ({ ...c, notes: new Set(c.notes) }))
        solution.value = data.solution
        timer.value = data.timer
        mistakes.value = data.mistakes
        difficulty.value = data.difficulty
        gameState.value = 'playing'
        startTimer()
        return
      } catch (e) { localStorage.removeItem('sudoku-state') }
    }
  }
  newGame()
}

function newGame() {
  gameState.value = 'playing'
  mistakes.value = 0
  timer.value = 0
  history.value = []
  selectedIdx.value = null
  grid.value = [] // 清空以触发重新渲染

  const rawGrid = Array(9).fill(0).map(() => Array(9).fill(0))
  fillDiagonal(rawGrid)
  solveSudoku(rawGrid)

  solution.value = rawGrid.flat()

  const clues = difficulty.value === 'Easy' ? 45 : difficulty.value === 'Medium' ? 35 : 28
  removeDigits(rawGrid, 81 - clues)

  // 转换为扁平数组
  grid.value = rawGrid.flat().map(val => ({
    val,
    fixed: val !== 0,
    notes: new Set(),
    error: false
  }))

  saveState()
  startTimer()
}

function saveState() {
  if (gameState.value !== 'playing') return
  const data: SaveData = {
    grid: grid.value.map(c => ({ ...c, notes: Array.from(c.notes) })),
    solution: solution.value,
    timer: timer.value,
    mistakes: mistakes.value,
    difficulty: difficulty.value
  }
  localStorage.setItem('sudoku-state', JSON.stringify(data))
}

// --- 算法部分 ---
function shuffleArray(array: number[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
function fillDiagonal(g: number[][]) { for (let i = 0; i < 9; i += 3) fillBox(g, i, i) }
function fillBox(g: number[][], row: number, col: number) {
  const nums = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9])
  let idx = 0
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) g[row + i][col + j] = nums[idx++]
}
function checkIfSafe(g: number[][], r: number, c: number, num: number) {
  for (let x = 0; x < 9; x++) { if (g[r][x] === num) return false; if (g[x][c] === num) return false; }
  const sr = r - r % 3, sc = c - c % 3
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (g[sr + i][sc + j] === num) return false
  return true
}
function solveSudoku(g: number[][]): boolean {
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) if (g[r][c] === 0) {
    for (let n = 1; n <= 9; n++) if (checkIfSafe(g, r, c, n)) {
      g[r][c] = n; if (solveSudoku(g)) return true; g[r][c] = 0
    }
    return false
  }
  return true
}
function removeDigits(g: number[][], count: number) {
  const coords = Array.from({ length: 81 }, (_, i) => i)
  shuffleArray(coords)
  let removed = 0
  for (const idx of coords) {
    if (removed >= count) break
    const r = Math.floor(idx / 9), c = idx % 9
    if (g[r][c] !== 0) { g[r][c] = 0; removed++ }
  }
}

// --- 可视化求解 ---
async function visualizeSolve() {
  if (gameState.value !== 'playing') return
  if (!confirm('AI 托管将清空当前进度，确定吗？')) return
  gameState.value = 'solving'
  stopTimer()
  solveAbortController = new AbortController()

  grid.value.forEach(c => { if (!c.fixed) { c.val = 0; c.error = false; c.notes.clear() } })

  try {
    if (await solveStep(0, solveAbortController.signal)) {
      gameState.value = 'won'; fireConfetti(); localStorage.removeItem('sudoku-state')
    }
  } catch (e) { }
}

async function solveStep(idx: number, signal: AbortSignal): Promise<boolean> {
  if (signal.aborted) throw new Error()
  if (idx === 81) return true
  if (grid.value[idx].fixed) return solveStep(idx + 1, signal)

  const r = Math.floor(idx / 9), c = idx % 9
  for (let n = 1; n <= 9; n++) {
    if (checkIfSafeForView(r, c, n)) {
      grid.value[idx].val = n
      if (Math.random() > 0.7) await new Promise(r => setTimeout(r, ANIMATION_DELAY))
      if (await solveStep(idx + 1, signal)) return true
      grid.value[idx].val = 0
    }
  }
  return false
}

function checkIfSafeForView(r: number, c: number, num: number) {
  const g = grid.value
  for (let i = 0; i < 9; i++) {
    if (g[r * 9 + i].val === num && i !== c) return false
    if (g[i * 9 + c].val === num && i !== r) return false
  }
  const sr = r - r % 3, sc = c - c % 3
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    const idx = (sr + i) * 9 + (sc + j)
    if (g[idx].val === num && idx !== r * 9 + c) return false
  }
  return true
}

// --- 交互 ---
function selectCell(idx: number) {
  if (gameState.value !== 'playing') return
  selectedIdx.value = idx
}

function inputNumber(num: number) {
  if (selectedIdx.value === null || gameState.value !== 'playing') return
  const cell = grid.value[selectedIdx.value]
  if (cell.fixed) return

  saveSnapshot()

  if (isNoteMode.value) {
    if (cell.notes.has(num)) cell.notes.delete(num)
    else cell.notes.add(num)
  } else {
    if (cell.val === num) cell.val = 0
    else {
      cell.val = num
      cell.notes.clear()
      if (num !== solution.value[selectedIdx.value]) {
        cell.error = true
        mistakes.value++
        if (navigator.vibrate) navigator.vibrate(200)
        if (mistakes.value >= MAX_MISTAKES) {
          gameState.value = 'lost'; stopTimer(); localStorage.removeItem('sudoku-state')
        }
      } else {
        cell.error = false
        autoEraseNotes(selectedIdx.value, num)
        checkWin()
      }
    }
  }
  saveState()
}

function autoEraseNotes(idx: number, num: number) {
  const r = Math.floor(idx / 9), c = idx % 9
  const g = grid.value
  for (let i = 0; i < 9; i++) {
    g[r * 9 + i].notes.delete(num)
    g[i * 9 + c].notes.delete(num)
  }
  const sr = r - r % 3, sc = c - c % 3
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    g[(sr + i) * 9 + (sc + j)].notes.delete(num)
  }
}

function deleteNumber() {
  if (selectedIdx.value === null || gameState.value !== 'playing') return
  if (grid.value[selectedIdx.value].fixed) return
  saveSnapshot()
  grid.value[selectedIdx.value].val = 0
  grid.value[selectedIdx.value].error = false
  saveState()
}

function undo() {
  if (!history.value.length || gameState.value === 'solving') return
  const data = JSON.parse(history.value.pop()!)
  grid.value = data.grid.map((c: any) => ({ ...c, notes: new Set(c.notes) }))
  mistakes.value = data.mistakes
  saveState()
}

function saveSnapshot() {
  const snapshot = JSON.stringify({
    grid: grid.value.map(c => ({ ...c, notes: Array.from(c.notes) })),
    mistakes: mistakes.value
  })
  history.value.push(snapshot)
  if (history.value.length > 20) history.value.shift()
}

function checkWin() {
  if (grid.value.every(c => c.val !== 0 && !c.error)) {
    gameState.value = 'won'; stopTimer(); fireConfetti()
    localStorage.removeItem('sudoku-state')
  }
}

function fireConfetti() {
  confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } })
}

function handleKeydown(e: KeyboardEvent) {
  if (gameState.value !== 'playing') return
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault()

  if (selectedIdx.value !== null) {
    const r = Math.floor(selectedIdx.value / 9), c = selectedIdx.value % 9
    let nr = r, nc = c
    if (e.key === 'ArrowUp') nr = (r - 1 + 9) % 9
    if (e.key === 'ArrowDown') nr = (r + 1) % 9
    if (e.key === 'ArrowLeft') nc = (c - 1 + 9) % 9
    if (e.key === 'ArrowRight') nc = (c + 1) % 9
    selectedIdx.value = nr * 9 + nc
  }

  const k = parseInt(e.key)
  if (!isNaN(k) && k >= 1 && k <= 9) inputNumber(k)
  if (e.key === 'Backspace' || e.key === 'Delete') deleteNumber()
  if (e.key.toLowerCase() === 'n') isNoteMode.value = !isNoteMode.value
  if (e.key.toLowerCase() === 'z' && (e.ctrlKey || e.metaKey)) undo()
}

function startTimer() { if (!timerId) timerId = window.setInterval(() => timer.value++, 1000) }
function stopTimer() { if (timerId) { clearInterval(timerId); timerId = null } }
function formatTime(s: number) {
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
}

onMounted(() => {
  const hasSave = !!localStorage.getItem('sudoku-state')
  initGame(undefined, hasSave)
  window.addEventListener('keydown', handleKeydown)
})
onUnmounted(() => {
  stopTimer()
  if (solveAbortController) solveAbortController.abort()
  window.removeEventListener('keydown', handleKeydown)
})

function getCellClass(idx: number) {
  const cell = grid.value[idx]
  const classes = []

  if (cell.fixed) classes.push('fixed')
  if (cell.error) classes.push('error')

  if (selectedIdx.value !== null) {
    const sIdx = selectedIdx.value
    const r = Math.floor(idx / 9), c = idx % 9
    const sr = Math.floor(sIdx / 9), sc = sIdx % 9

    if (idx === sIdx) classes.push('selected')
    else if (r === sr || c === sc || (Math.floor(r / 3) === Math.floor(sr / 3) && Math.floor(c / 3) === Math.floor(sc / 3))) {
      classes.push('related')
    }
    if (cell.val !== 0 && grid.value[sIdx].val === cell.val) classes.push('same-num')
  }
  return classes
}
</script>

<template>
  <div class="sudoku-container">
    <div class="header">
      <div class="info-group">
        <div class="difficulty-select">
          <span v-for="diff in ['Easy', 'Medium', 'Hard']" :key="diff" :class="{ active: difficulty === diff }"
            @click="initGame(diff as Difficulty)">{{ diff }}</span>
        </div>
        <div class="stats">
          <span :class="{ 'danger': mistakes >= 2 }">Mistakes: {{ mistakes }}/3</span>
          <span>{{ formatTime(timer) }}</span>
        </div>
      </div>
    </div>

    <div class="board-container" v-if="grid.length === 81">
      <div class="sudoku-grid">
        <div v-for="boxIndex in 9" :key="boxIndex" class="big-box">
          <div v-for="cellIndex in 9" :key="cellIndex" class="cell"
            :class="getCellClass(getGlobalIndex(boxIndex - 1, cellIndex - 1))"
            @click="selectCell(getGlobalIndex(boxIndex - 1, cellIndex - 1))">
            <template v-if="grid[getGlobalIndex(boxIndex - 1, cellIndex - 1)]">
              <span v-if="grid[getGlobalIndex(boxIndex - 1, cellIndex - 1)].val !== 0">
                {{ grid[getGlobalIndex(boxIndex - 1, cellIndex - 1)].val }}
              </span>
              <div v-else class="notes-grid">
                <span v-for="n in 9" :key="n" class="note-num">
                  {{ grid[getGlobalIndex(boxIndex - 1, cellIndex - 1)].notes.has(n) ? n : '' }}
                </span>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="loading-placeholder">Loading...</div>

    <div class="controls">
      <!-- 1. 游戏结束状态：显示结果和重开按钮 -->
      <div v-if="gameState === 'won' || gameState === 'lost'" class="game-over-panel">
        <template v-if="gameState === 'won'">
          <h2>🎉 Solved!</h2>
          <p>Time: {{ formatTime(timer) }}</p>
        </template>
        <template v-else>
          <h2>💀 Game Over</h2>
          <p>Too many mistakes!</p>
        </template>
        <button class="btn-primary" @click="initGame()">New Game</button>
      </div>

      <!-- 2. 游戏进行中：显示操作盘 -->
      <template v-else>
        <div class="action-row">
          <button class="action-btn" @click="undo">↩️ Undo</button>
          <button class="action-btn" @click="deleteNumber">⌫ Erase</button>
          <button class="action-btn" :class="{ active: isNoteMode }" @click="isNoteMode = !isNoteMode">
            ✏️ Notes
          </button>
          <button class="action-btn special" @click="visualizeSolve">🤖 Solve</button>
        </div>
        <div class="numpad">
          <button v-for="n in 9" :key="n" class="num-btn" :class="{ 'completed': numberCounts[n] >= 9 }"
            @click="inputNumber(n)">{{ n }}</button>
        </div>
      </template>
    </div>

    <!-- 移除原有的 .overlay 遮罩层代码 -->
  </div>
</template>

<style scoped>
.sudoku-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  margin-top: 20px;
  font-family: sans-serif;
  user-select: none;
  touch-action: manipulation;
}

.header,
.controls {
  width: 100%;
  max-width: 360px;
}

.info-group {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
}

.difficulty-select {
  display: flex;
  gap: 4px;
  background: var(--vp-c-bg-soft);
  padding: 4px;
  border-radius: 8px;
}

.difficulty-select span {
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
}

.difficulty-select span.active {
  background: var(--vp-c-brand);
  color: white;
  font-weight: bold;
}

.stats .danger {
  color: #ef4444;
  font-weight: bold;
}

.board-container {
  width: 100%;
  max-width: 360px;
  background: var(--vp-c-text-1);
  /* 粗边框颜色 */
  padding: 2px;
  /* 外框粗细 */
  border-radius: 4px;
}

/* 外层 Grid (3x3 宫格) */
.sudoku-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 2px;
  /* 宫格之间的粗线宽度 */
  background-color: var(--vp-c-text-1);
}

/* 内层 Grid (宫格内的3x3单元格) */
.big-box {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 1px;
  /* 单元格之间的细线宽度 */
  background-color: var(--vp-c-text-3);
  /* 细线颜色 */
}

/* 单元格 */
.cell {
  background-color: var(--vp-c-bg);
  /* 单元格背景色 */
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  cursor: pointer;
  position: relative;
}

.cell.fixed {
  font-weight: 700;
  color: var(--vp-c-text-1);
}

.cell:not(.fixed) {
  color: var(--vp-c-brand);
}

.cell.error {
  background: #fecaca !important;
  color: #ef4444 !important;
}

.dark .cell.error {
  background: #7f1d1d !important;
}

.cell.related {
  background: var(--vp-c-bg-soft);
}

.cell.same-num {
  background: #b1d2f9;
}

.dark .cell.same-num {
  background: #1e3a8a;
}

.cell.selected {
  background: #60a5fa !important;
  color: white !important;
}

.notes-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.note-num {
  font-size: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--vp-c-text-2);
  line-height: 1;
}

.action-row {
  display: flex;
  gap: 8px;
  margin-bottom: 15px;
}

.action-btn {
  flex: 1;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-alt);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn.active {
  background: var(--vp-c-brand);
  color: white;
  border-color: var(--vp-c-brand);
}

.action-btn.special {
  color: #f59e0b;
  border-color: #f59e0b;
}

.numpad {
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  gap: 4px;
}

.num-btn {
  aspect-ratio: 1;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-brand);
  font-weight: bold;
  cursor: pointer;
  font-size: 1.2rem;
}

.num-btn.completed {
  opacity: 0.2;
  pointer-events: none;
}

/* 新增：结算面板样式 */
.game-over-panel {
  text-align: center;
  padding: 20px;
  background: var(--vp-c-bg-soft);
  border-radius: 12px;
  border: 1px solid var(--vp-c-divider);
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 移除原有的 .overlay 和 .modal 样式 */
.btn-primary {
  background: var(--vp-c-brand);
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 6px;
  margin-top: 15px;
  cursor: pointer;
}

.loading-placeholder {
  height: 350px;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 450px) {

  .board-container,
  .header,
  .controls {
    max-width: 95vw;
  }

  .num-btn {
    font-size: 1rem;
  }

  .action-btn {
    padding: 8px;
    font-size: 0.8rem;
  }

  .cell {
    font-size: 1.2rem;
  }
}
</style>