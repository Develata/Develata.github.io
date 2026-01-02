<!--
  @file Snake.vue
  @description 贪吃蛇游戏组件 (Snake)
  职责：
  1. 实现蛇的移动、进食与身体增长逻辑。
  2. 碰撞检测（墙壁与自身）。
  3. 移动端虚拟手柄支持。
-->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import SpeedControl from './controls/SpeedControl.vue'
import GameControls from './controls/GameControls.vue'

// --- 类型定义 ---
type Point = { x: number; y: number }
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
type GameStatus = 'IDLE' | 'PLAYING' | 'PAUSED' | 'GAME_OVER'

// --- 配置常量 ---
const GRID_SIZE = 20
const BOARD_SIZE = 20 // 20x20 网格
const INITIAL_SPEED = 130

// --- 状态管理 ---
const snake = ref<Point[]>([{ x: 10, y: 10 }])
const food = ref<Point>({ x: 5, y: 5 })
const direction = ref<Direction>('RIGHT')
const nextDirection = ref<Direction>('RIGHT') // 防止单帧多次转向导致自杀
const score = ref(0)
const highScore = ref(0)
const status = ref<GameStatus>('IDLE')
// const gameLoop = ref<number | null>(null) // 废弃
let lastTime = 0
let animationFrameId: number | null = null
const speed = ref(INITIAL_SPEED)
const speedMultiplier = ref(1)

// --- 核心逻辑 ---

// 初始化游戏
function initGame() {
  snake.value = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }]
  direction.value = 'RIGHT'
  nextDirection.value = 'RIGHT'
  score.value = 0
  status.value = 'PLAYING'
  speed.value = INITIAL_SPEED
  spawnFood()
  startGameLoop()
}

// 生成食物
function spawnFood() {
  let newFood: Point
  while (true) {
    newFood = {
      x: Math.floor(Math.random() * BOARD_SIZE),
      y: Math.floor(Math.random() * BOARD_SIZE)
    }
    // 确保食物不生成在蛇身上
    const onSnake = snake.value.some(segment => segment.x === newFood.x && segment.y === newFood.y)
    if (!onSnake) break
  }
  food.value = newFood
}

// 游戏循环 (RAF)
function gameLoop(timestamp: number) {
  if (!lastTime) lastTime = timestamp
  const deltaTime = timestamp - lastTime
  const effectiveSpeed = speed.value / speedMultiplier.value

  if (deltaTime >= effectiveSpeed) {
    moveSnake()
    lastTime = timestamp
  }

  if (status.value === 'PLAYING') {
    animationFrameId = requestAnimationFrame(gameLoop)
  }
}

function startGameLoop() {
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
  lastTime = 0
  animationFrameId = requestAnimationFrame(gameLoop)
}

function stopGameLoop() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
}

// 移动蛇
function moveSnake() {
  if (status.value !== 'PLAYING') return

  direction.value = nextDirection.value
  const head = snake.value[0]
  let newHead: Point = { ...head }

  switch (direction.value) {
    case 'UP': newHead.y -= 1; break
    case 'DOWN': newHead.y += 1; break
    case 'LEFT': newHead.x -= 1; break
    case 'RIGHT': newHead.x += 1; break
  }

  // 穿墙处理 (Wrap-around)
  if (newHead.x < 0) newHead.x = BOARD_SIZE - 1
  else if (newHead.x >= BOARD_SIZE) newHead.x = 0

  if (newHead.y < 0) newHead.y = BOARD_SIZE - 1
  else if (newHead.y >= BOARD_SIZE) newHead.y = 0

  // 碰撞检测 (只检测撞自己)
  if (checkCollision(newHead)) {
    gameOver()
    return
  }

  snake.value.unshift(newHead)

  // 吃食物
  if (newHead.x === food.value.x && newHead.y === food.value.y) {
    score.value += 10
    // 简单的加速机制
    if (score.value % 50 === 0 && speed.value > 50) {
      speed.value -= 5 // 每次加速更平滑一点
    }
    spawnFood()
  } else {
    snake.value.pop()
  }
}

// 碰撞检测
function checkCollision(p: Point): boolean {
  // 撞墙逻辑已在 moveSnake 中改为穿墙，此处只需检测撞自己
  // 检测是否撞到身体 (不包含尾巴，因为尾巴马上会移走)
  for (let i = 0; i < snake.value.length - 1; i++) {
    if (p.x === snake.value[i].x && p.y === snake.value[i].y) return true
  }
  return false
}

// 游戏结束
function gameOver() {
  status.value = 'GAME_OVER'
  stopGameLoop()
  if (score.value > highScore.value) {
    highScore.value = score.value
    localStorage.setItem('snake-highscore', highScore.value.toString())
  }
}

// 控制相关
function handleKeydown(e: KeyboardEvent) {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
    e.preventDefault()
  }

  if (status.value === 'IDLE' || status.value === 'GAME_OVER') {
    if (e.key === ' ' || e.key === 'Enter') initGame()
    return
  }

  if (e.key === ' ' && status.value === 'PLAYING') {
    status.value = 'PAUSED'
    stopGameLoop()
    return
  } else if (e.key === ' ' && status.value === 'PAUSED') {
    status.value = 'PLAYING'
    startGameLoop()
    return
  }

  if (status.value !== 'PLAYING') return

  switch (e.key) {
    case 'ArrowUp':
    case 'w':
    case 'W':
      if (direction.value !== 'DOWN') nextDirection.value = 'UP'
      break
    case 'ArrowDown':
    case 's':
    case 'S':
      if (direction.value !== 'UP') nextDirection.value = 'DOWN'
      break
    case 'ArrowLeft':
    case 'a':
    case 'A':
      if (direction.value !== 'RIGHT') nextDirection.value = 'LEFT'
      break
    case 'ArrowRight':
    case 'd':
    case 'D':
      if (direction.value !== 'LEFT') nextDirection.value = 'RIGHT'
      break
  }
}

// 虚拟按键控制
function setDirection(d: Direction) {
  if (status.value !== 'PLAYING') return
  if (d === 'UP' && direction.value !== 'DOWN') nextDirection.value = 'UP'
  if (d === 'DOWN' && direction.value !== 'UP') nextDirection.value = 'DOWN'
  if (d === 'LEFT' && direction.value !== 'RIGHT') nextDirection.value = 'LEFT'
  if (d === 'RIGHT' && direction.value !== 'LEFT') nextDirection.value = 'RIGHT'
}

// 生命周期
onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  const saved = localStorage.getItem('snake-highscore')
  if (saved) highScore.value = parseInt(saved)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  stopGameLoop()
})
</script>

<template>
  <div class="game-container">
    <div class="header">
      <div class="score-board">
        <div class="score-item">
          <span class="label">SCORE</span>
          <span class="value">{{ score }}</span>
        </div>
        <div class="score-item">
          <span class="label">BEST</span>
          <span class="value">{{ highScore }}</span>
        </div>
      </div>

      <SpeedControl v-model="speedMultiplier" />
    </div>

    <div class="game-area">
      <div class="board" :style="{ width: BOARD_SIZE * GRID_SIZE + 'px', height: BOARD_SIZE * GRID_SIZE + 'px' }">
        <!-- 蛇 -->
        <div v-for="(segment, index) in snake" :key="index" class="snake-segment" :class="{ 'head': index === 0 }"
          :style="{
            left: segment.x * GRID_SIZE + 'px',
            top: segment.y * GRID_SIZE + 'px',
            width: GRID_SIZE + 'px',
            height: GRID_SIZE + 'px'
          }"></div>
        <!-- 食物 -->
        <div class="food" :style="{
          left: food.x * GRID_SIZE + 'px',
          top: food.y * GRID_SIZE + 'px',
          width: GRID_SIZE + 'px',
          height: GRID_SIZE + 'px'
        }"></div>

        <!-- 遮罩层 -->
        <div v-if="status !== 'PLAYING' && status !== 'PAUSED'" class="overlay">
          <div v-if="status === 'IDLE'" class="start-msg">
            <p>按空格或点击开始</p>
            <button class="btn" @click="initGame">开始游戏</button>
          </div>
          <div v-if="status === 'GAME_OVER'" class="game-over-msg">
            <h2>GAME OVER</h2>
            <p>最终得分: {{ score }}</p>
            <button class="btn" @click="initGame">再玩一次</button>
          </div>
        </div>
        <div v-if="status === 'PAUSED'" class="overlay paused">
          <p>PAUSED</p>
          <button class="btn" @click="() => { status = 'PLAYING'; startGameLoop() }">继续</button>
        </div>
      </div>
    </div>

    <!-- 移动端控件 -->
    <GameControls @up="setDirection('UP')" @down="setDirection('DOWN')" @left="setDirection('LEFT')"
      @right="setDirection('RIGHT')" @action-a="initGame" label-a="Start" :hide-actions="status === 'PLAYING'" />

    <div class="instructions">
      使用键盘方向键或 WASD 控制移动，空格暂停
    </div>
  </div>
</template>

<style scoped>
.game-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: 'Courier New', Courier, monospace;
  margin: 20px 0;
  touch-action: pan-y;
  /* 允许垂直滚动，解决移动端必须滑动背景才能看到按钮的问题 */
}

.header {
  margin-bottom: 20px;
  width: 100%;
  max-width: 400px;
  display: flex;
  /* 改为 flex 布局 */
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.score-board {
  display: flex;
  justify-content: space-between;
  background: var(--vp-c-bg-soft);
  padding: 8px 15px;
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  flex-grow: 1;
  /* 让记分板占据更多空间 */
}



.score-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.label {
  font-size: 0.8rem;
  color: var(--vp-c-text-2);
}

.value {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--vp-c-brand);
}

.game-area {
  position: relative;
  padding: 10px;
  background: var(--vp-c-bg-alt);
  border-radius: 12px;
  border: 2px solid var(--vp-c-divider);
}

.board {
  position: relative;
  background-color: #222;
  /* 游戏背景深色 */
  overflow: hidden;
}

.snake-segment {
  position: absolute;
  background-color: var(--vp-c-brand);
  border: 1px solid #222;
  box-sizing: border-box;
  border-radius: 4px;
}

.snake-segment.head {
  background-color: var(--vp-c-brand-light);
  z-index: 10;
}

.food {
  position: absolute;
  background-color: var(--vp-c-danger, #f43f5e);
  border-radius: 50%;
  box-shadow: 0 0 10px var(--vp-c-danger, #f43f5e);
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  z-index: 20;
}

.btn {
  margin-top: 15px;
  padding: 8px 20px;
  background: var(--vp-c-brand);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1.1rem;
  transition: opacity 0.2s;
}

.btn:hover {
  opacity: 0.9;
}

.game-over-msg h2 {
  color: #ff4444;
  margin-bottom: 10px;
}



.instructions {
  margin-top: 20px;
  color: var(--vp-c-text-3);
  font-size: 0.9rem;
}
</style>
