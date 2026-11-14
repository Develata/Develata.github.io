<!--
  @file TicTacToe.vue
  @description 井字棋游戏组件 (Tic Tac Toe)
  职责：
  1. 3x3 棋盘逻辑。
  2. 极小化极大算法 (Minimax) 实现不可战胜的 AI。
-->
<script setup lang="ts">
import { ref, computed, watch } from 'vue'

// --- 类型定义 ---
type Player = 'X' | 'O' | null
type Mode = 'PVP' | 'PVE' // PVP: 双人, PVE: 人机

// --- 状态管理 ---
const board = ref<Player[]>(Array(9).fill(null))
const xIsNext = ref(true) // true: X的回合, false: O的回合
const gameMode = ref<Mode>('PVE') // 默认人机
const isAiThinking = ref(false)   // AI 思考状态，防止连点

// 计算当前获胜者
const winner = computed(() => calculateWinner(board.value))
// 计算是否平局
const isDraw = computed(() => !winner.value && board.value.every(cell => cell !== null))
// 当前玩家符号
const currentPlayer = computed(() => xIsNext.value ? 'X' : 'O')

// 胜利组合
const lines = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
]

// --- 核心逻辑 ---

// 基础胜负判断
function calculateWinner(squares: Player[]): Player {
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i]
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a]
    }
  }
  return null
}

// 玩家点击格子
function handleMove(index: number) {
  // 如果格子有字、有人赢了、或者是AI回合，则不能点
  if (board.value[index] || winner.value || isAiThinking.value) return

  // 玩家落子
  makeMove(index, currentPlayer.value)

  // 如果是人机模式，且游戏未结束，触发AI
  if (gameMode.value === 'PVE' && !winner.value && !isDraw.value) {
    isAiThinking.value = true
    // 延迟 500ms 模拟思考，体验更好
    setTimeout(() => {
      makeAiMove()
      isAiThinking.value = false
    }, 500)
  }
}

// 执行落子动作
function makeMove(index: number, player: Player) {
  board.value[index] = player
  xIsNext.value = !xIsNext.value
}

// 重置游戏
function resetGame() {
  board.value = Array(9).fill(null)
  xIsNext.value = true
  isAiThinking.value = false
}

// 切换模式
function switchMode(mode: Mode) {
  gameMode.value = mode
  resetGame()
}

// --- AI 核心算法 (Minimax) ---

function makeAiMove() {
  // AI 总是扮演 'O'
  const bestMoveIndex = getBestMove(board.value)
  if (bestMoveIndex !== -1) {
    makeMove(bestMoveIndex, 'O')
  }
}

// 获取最优步
function getBestMove(currentBoard: Player[]): number {
  let bestScore = -Infinity
  let move = -1

  // 遍历所有空格子
  for (let i = 0; i < 9; i++) {
    if (currentBoard[i] === null) {
      // 试着走这一步
      currentBoard[i] = 'O'
      // 预测这一步的分数
      const score = minimax(currentBoard, 0, false)
      // 撤销这一步 (回溯)
      currentBoard[i] = null

      if (score > bestScore) {
        bestScore = score
        move = i
      }
    }
  }
  return move
}

// 极小化极大算法递归
function minimax(currentBoard: Player[], depth: number, isMaximizing: boolean): number {
  const result = calculateWinner(currentBoard)

  // 终止条件：分数判定
  if (result === 'O') return 10 - depth // AI 赢，分数越高越好，减去深度是为了让AI尽快赢
  if (result === 'X') return depth - 10 // 玩家赢，分数越低越好
  if (currentBoard.every(cell => cell !== null)) return 0 // 平局

  if (isMaximizing) {
    // AI 回合 (找最大分)
    let bestScore = -Infinity
    for (let i = 0; i < 9; i++) {
      if (currentBoard[i] === null) {
        currentBoard[i] = 'O'
        const score = minimax(currentBoard, depth + 1, false)
        currentBoard[i] = null
        bestScore = Math.max(score, bestScore)
      }
    }
    return bestScore
  } else {
    // 玩家回合 (假设玩家极其聪明，会找最小分来坑AI)
    let bestScore = Infinity
    for (let i = 0; i < 9; i++) {
      if (currentBoard[i] === null) {
        currentBoard[i] = 'X'
        const score = minimax(currentBoard, depth + 1, true)
        currentBoard[i] = null
        bestScore = Math.min(score, bestScore)
      }
    }
    return bestScore
  }
}
</script>

<template>
  <div class="game-container">
    <div class="mode-selector">
      <button class="mode-btn" :class="{ active: gameMode === 'PVP' }" @click="switchMode('PVP')">
        👥 本地双人
      </button>
      <button class="mode-btn" :class="{ active: gameMode === 'PVE' }" @click="switchMode('PVE')">
        🤖 人机对战 (困难)
      </button>
    </div>

    <div class="status">
      <div v-if="winner" class="msg winner">
        🎉 获胜者: {{ winner === 'X' && gameMode === 'PVE' ? '你' : winner }}
      </div>
      <div v-else-if="isDraw" class="msg draw">🤝 平局</div>
      <div v-else class="msg turn">
        <span v-if="isAiThinking">🤖 思考中...</span>
        <span v-else>👉 轮到: {{ currentPlayer === 'X' && gameMode === 'PVE' ? '你 (X)' : currentPlayer }}</span>
      </div>
    </div>

    <div class="board" :class="{ 'ai-thinking': isAiThinking }">
      <div v-for="(cell, index) in board" :key="index" class="square" :class="{
        'x-style': cell === 'X',
        'o-style': cell === 'O',
        'clickable': !cell && !winner && !isAiThinking
      }" @click="handleMove(index)">
        {{ cell }}
      </div>
    </div>

    <button class="reset-btn" @click="resetGame">重新开始</button>
  </div>
</template>

<style scoped>
.game-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 20px 0;
  font-family: 'Arial', sans-serif;
  user-select: none;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

/* 模式切换按钮 */
.mode-selector {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  background: var(--vp-c-bg-soft);
  padding: 5px;
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
}

.mode-btn {
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--vp-c-text-2);
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.mode-btn:hover {
  color: var(--vp-c-text-1);
}

.mode-btn.active {
  background: var(--vp-c-bg);
  color: var(--vp-c-brand);
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 状态栏 */
.status {
  margin-bottom: 15px;
  height: 30px;
  font-size: 1.2rem;
  font-weight: bold;
}

.msg.winner {
  color: var(--vp-c-brand);
  animation: pop 0.3s;
}

.msg.draw {
  color: var(--vp-c-text-2);
}

.msg.turn {
  color: var(--vp-c-text-1);
}

/* 棋盘样式 */
.board {
  display: grid;
  grid-template-columns: repeat(3, 90px);
  grid-template-rows: repeat(3, 90px);
  gap: 8px;
  background-color: var(--vp-c-divider);
  padding: 8px;
  border-radius: 12px;
  transition: opacity 0.3s;
}

.board.ai-thinking {
  opacity: 0.8;
  pointer-events: none;
  /* 思考时禁止点击 */
}

.square {
  background-color: var(--vp-c-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  font-weight: 700;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.square.clickable {
  cursor: pointer;
}

.square.clickable:hover {
  background-color: var(--vp-c-bg-soft);
}

.x-style {
  color: var(--vp-c-brand);
}

.o-style {
  color: var(--vp-c-danger, #f43f5e);
}

/* 重置按钮 */
.reset-btn {
  margin-top: 25px;
  padding: 10px 24px;
  background-color: var(--vp-c-bg-alt);
  color: var(--vp-c-text-1);
  border: 1px solid var(--vp-c-divider);
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.reset-btn:hover {
  border-color: var(--vp-c-brand);
  color: var(--vp-c-brand);
}

@keyframes pop {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }

  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>