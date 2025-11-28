<script setup lang="ts">
import { ref, computed } from 'vue'

// --- 类型定义 ---
type Player = 1 | 2 | 0 // 1: 黑子(玩家), 2: 白子(AI/玩家2), 0: 空
type Mode = 'PVP' | 'PVE'

// --- 游戏配置 ---
const BOARD_SIZE = 15
const DIRECTIONS = [
  [1, 0], [0, 1], [1, 1], [1, -1] // 横、竖、右斜、左斜
]

// --- 状态 ---
const board = ref<Player[]>(Array(BOARD_SIZE * BOARD_SIZE).fill(0))
const currentPlayer = ref<Player>(1) // 黑子先手
const gameMode = ref<Mode>('PVE')
const winner = ref<Player | 0>(0)
const isAiThinking = ref(false)
const lastMove = ref<number>(-1) // 记录最后一步，高亮显示

// --- 新增：历史记录栈 ---
const history = ref<number[]>([]) 

// --- 计算属性 ---
const statusText = computed(() => {
  if (winner.value === 1) return '🏆 黑棋获胜！'
  if (winner.value === 2) return '🎉 白棋获胜！'
  if (isAiThinking.value) return '🤖 思考中...'
  return `👉 轮到: ${currentPlayer.value === 1 ? '黑棋 (●)' : '白棋 (○)'}`
})

// 是否可以悔棋
const canUndo = computed(() => {
  if (isAiThinking.value) return false
  if (gameMode.value === 'PVP') return history.value.length > 0
  // PVE模式下，必须至少走了2步（你一步AI一步）才能悔棋，防止回退到AI的回合
  return history.value.length >= 2
})

// --- 核心逻辑 ---

// 落子
function handleMove(index: number) {
  if (board.value[index] !== 0 || winner.value !== 0 || isAiThinking.value) return

  // 执行落子
  placePiece(index, currentPlayer.value)

  // 检查胜利
  if (checkWin(index, currentPlayer.value)) {
    winner.value = currentPlayer.value
    return
  }

  // 切换回合
  currentPlayer.value = currentPlayer.value === 1 ? 2 : 1

  // AI 回合
  if (gameMode.value === 'PVE' && currentPlayer.value === 2) {
    isAiThinking.value = true
    setTimeout(() => {
      makeAiMove()
      isAiThinking.value = false
    }, 100)
  }
}

function placePiece(index: number, player: Player) {
  board.value[index] = player
  lastMove.value = index
  // 记录历史
  history.value.push(index)
}

// --- 新增：悔棋功能 ---
function undoMove() {
  if (!canUndo.value) return

  // 如果游戏已经结束，悔棋后要重置胜利状态
  winner.value = 0

  if (gameMode.value === 'PVP') {
    // 双人模式：回退 1 步
    const lastIdx = history.value.pop()
    if (lastIdx !== undefined) {
      board.value[lastIdx] = 0
      // 切换回上一个玩家
      currentPlayer.value = currentPlayer.value === 1 ? 2 : 1
    }
  } else {
    // 人机模式：回退 2 步 (AI一步 + 玩家一步)
    // 1. 撤销 AI 的步子
    const aiIdx = history.value.pop()
    if (aiIdx !== undefined) board.value[aiIdx] = 0
    
    // 2. 撤销 玩家 的步子
    const playerIdx = history.value.pop()
    if (playerIdx !== undefined) board.value[playerIdx] = 0
    
    // 确保轮到玩家
    currentPlayer.value = 1
  }

  // 更新最后一步的高亮显示
  if (history.value.length > 0) {
    lastMove.value = history.value[history.value.length - 1]
  } else {
    lastMove.value = -1
  }
}

// 检查胜利条件
function checkWin(index: number, player: Player): boolean {
  const x = index % BOARD_SIZE
  const y = Math.floor(index / BOARD_SIZE)

  for (const [dx, dy] of DIRECTIONS) {
    let count = 1
    let i = 1
    while (true) {
      const nx = x + dx * i
      const ny = y + dy * i
      if (nx < 0 || nx >= BOARD_SIZE || ny < 0 || ny >= BOARD_SIZE) break
      if (board.value[ny * BOARD_SIZE + nx] !== player) break
      count++
      i++
    }
    i = 1
    while (true) {
      const nx = x - dx * i
      const ny = y - dy * i
      if (nx < 0 || nx >= BOARD_SIZE || ny < 0 || ny >= BOARD_SIZE) break
      if (board.value[ny * BOARD_SIZE + nx] !== player) break
      count++
      i++
    }
    if (count >= 5) return true
  }
  return false
}

// 重置游戏
function resetGame() {
  board.value = Array(BOARD_SIZE * BOARD_SIZE).fill(0)
  currentPlayer.value = 1
  winner.value = 0
  lastMove.value = -1
  isAiThinking.value = false
  history.value = [] // 清空历史
}

function switchMode(mode: Mode) {
  gameMode.value = mode
  resetGame()
}

// --- AI 算法 (保持不变) ---
function makeAiMove() {
  if (board.value.every(p => p === 0)) {
    const center = Math.floor(BOARD_SIZE * BOARD_SIZE / 2)
    handleMove(center)
    return
  }

  let bestMove = -1
  let maxScore = -Infinity
  const candidates = getCandidates()
  
  for (const idx of candidates) {
    const attackScore = evaluatePoint(idx, 2)
    const defenseScore = evaluatePoint(idx, 1)
    let score = attackScore + defenseScore

    if (attackScore >= 100000) score += 1000000
    if (defenseScore >= 100000) score += 500000

    if (score > maxScore) {
      maxScore = score
      bestMove = idx
    }
  }

  if (bestMove !== -1) {
    placePiece(bestMove, 2)
    if (checkWin(bestMove, 2)) {
      winner.value = 2
    } else {
      currentPlayer.value = 1
    }
  }
}

function getCandidates(): number[] {
  const cands = new Set<number>()
  for (let i = 0; i < board.value.length; i++) {
    if (board.value[i] !== 0) {
      const x = i % BOARD_SIZE
      const y = Math.floor(i / BOARD_SIZE)
      const range = 2
      for (let dy = -range; dy <= range; dy++) {
        for (let dx = -range; dx <= range; dx++) {
          if (dx === 0 && dy === 0) continue
          const nx = x + dx
          const ny = y + dy
          if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE) {
            const idx = ny * BOARD_SIZE + nx
            if (board.value[idx] === 0) {
              cands.add(idx)
            }
          }
        }
      }
    }
  }
  if (cands.size === 0) {
    return board.value.map((v, i) => v === 0 ? i : -1).filter(i => i !== -1)
  }
  return Array.from(cands)
}

function evaluatePoint(index: number, role: Player): number {
  let score = 0
  const x = index % BOARD_SIZE
  const y = Math.floor(index / BOARD_SIZE)

  for (const [dx, dy] of DIRECTIONS) {
    const line: number[] = [] 
    for (let i = -4; i <= 4; i++) {
      const nx = x + dx * i
      const ny = y + dy * i
      if (nx < 0 || nx >= BOARD_SIZE || ny < 0 || ny >= BOARD_SIZE) {
        line.push(2)
      } else {
        const val = board.value[ny * BOARD_SIZE + nx]
        if (i === 0) line.push(1)
        else if (val === role) line.push(1)
        else if (val === 0) line.push(0)
        else line.push(2)
      }
    }
    score += getLineScore(line)
  }
  return score
}

function getLineScore(line: number[]): number {
  const str = line.join('')
  if (str.includes('11111')) return 100000
  if (str.includes('011110')) return 10000
  if (str.includes('011112') || str.includes('211110') || str.includes('10111') || str.includes('11101') || str.includes('11011')) return 1000
  if (str.includes('011100') || str.includes('001110')) return 1000
  if (str.includes('01112') || str.includes('21110') || str.includes('10110') || str.includes('01101')) return 100
  if (str.includes('001100') || str.includes('011000') || str.includes('000110')) return 100
  return 0
}
</script>

<template>
  <div class="gomoku-container">
    <div class="header">
      <div class="controls">
        <button class="btn" :class="{ active: gameMode === 'PVP' }" @click="switchMode('PVP')">👥 双人</button>
        <button class="btn" :class="{ active: gameMode === 'PVE' }" @click="switchMode('PVE')">🤖 人机</button>
      </div>
      <div class="status">{{ statusText }}</div>
      
      <div class="action-btns">
        <button 
          class="btn undo" 
          :disabled="!canUndo" 
          @click="undoMove"
          title="悔棋"
        >
          ↩️
        </button>
        <button class="btn reset" @click="resetGame">重置</button>
      </div>
    </div>

    <div class="board-wrapper">
      <div class="board">
        <div v-for="i in BOARD_SIZE - 1" :key="'h'+i" class="grid-line horizontal" :style="{ top: (i * 100 / BOARD_SIZE) + '%' }"></div>
        <div v-for="i in BOARD_SIZE - 1" :key="'v'+i" class="grid-line vertical" :style="{ left: (i * 100 / BOARD_SIZE) + '%' }"></div>

        <div 
          v-for="(cell, index) in board" 
          :key="index" 
          class="cell"
          @click="handleMove(index)"
        >
          <div 
            v-if="cell !== 0" 
            class="piece" 
            :class="{ 
              'black': cell === 1, 
              'white': cell === 2,
              'last-move': lastMove === index 
            }"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gomoku-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 20px 0;
  font-family: sans-serif;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.header {
  width: 100%;
  max-width: 500px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.action-btns {
  display: flex;
  gap: 8px;
}

.status {
  font-weight: bold;
  color: var(--vp-c-text-1);
  font-size: 0.95rem;
}

.btn {
  padding: 6px 12px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn.active {
  background: var(--vp-c-brand);
  color: white;
  border-color: var(--vp-c-brand);
}
.btn:hover:not(.active):not(:disabled) {
  border-color: var(--vp-c-brand);
  color: var(--vp-c-brand);
}

.board-wrapper {
  padding: 15px;
  background: #eebb77;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.board {
  position: relative;
  width: min(85vw, 450px);
  height: min(85vw, 450px);
  display: grid;
  grid-template-columns: repeat(15, 1fr);
  grid-template-rows: repeat(15, 1fr);
  user-select: none;
  cursor: crosshair;
}

@media (max-width: 600px) {
  .board {
    width: 96vw;
    height: 96vw;
  }
  .board-wrapper {
    padding: 8px;
  }
  .btn {
    padding: 6px 10px;
    font-size: 0.85rem;
  }
  .header {
    flex-wrap: wrap;
    gap: 10px;
    justify-content: center;
  }
  .status {
    width: 100%;
    text-align: center;
    order: -1; /* 手机上把状态文字放到最上面 */
    margin-bottom: 5px;
  }
}

.grid-line {
  position: absolute;
  background-color: #5d4037;
}
.horizontal {
  left: 3.33%;
  right: 3.33%;
  height: 1px;
}
.vertical {
  top: 3.33%;
  bottom: 3.33%;
  width: 1px;
}

.cell {
  z-index: 10;
  display: flex;
  justify-content: center;
  align-items: center;
}

.piece {
  width: 80%;
  height: 80%;
  border-radius: 50%;
  box-shadow: 1px 1px 3px rgba(0,0,0,0.4);
  position: relative;
}

.piece.black {
  background: radial-gradient(circle at 30% 30%, #666, #000);
}

.piece.white {
  background: radial-gradient(circle at 30% 30%, #fff, #ddd);
}

.piece.last-move::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 30%;
  height: 30%;
  background-color: red;
  border-radius: 50%;
}
</style>