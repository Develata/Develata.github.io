<!--
  @file Tetris.vue
  @description 俄罗斯方块游戏组件 (Tetris)
  职责：
  1. 实现方块的旋转、下落与碰撞逻辑 (SRS系统)。
  2. 行消除与积分计算。
  3. 下落预览 (Ghost Piece) 功能。
-->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import SpeedControl from './controls/SpeedControl.vue'
import GameControls from './controls/GameControls.vue'

// --- 类型定义 ---
type Point = { x: number; y: number }
// I, J, L, O, S, T, Z
type TetrominoType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z'
type TetrominoShape = number[][]
type GameStatus = 'IDLE' | 'PLAYING' | 'PAUSED' | 'GAME_OVER'

// --- 配置常量 ---
// GRID_SIZE 现在通过 CSS 变量控制，这里只定义行列数
const ROWS = 20
const COLS = 10
const INITIAL_SPEED = 800 // 毫秒
const MIN_SPEED = 100
const SPEED_DECREMENT = 50 // 每升一级减少的毫秒数

// 方块形状定义 (4x4 矩阵 或 3x3 矩阵，便于旋转)
const SHAPES: Record<TetrominoType, TetrominoShape> = {
    I: [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    J: [
        [1, 0, 0],
        [1, 1, 1],
        [0, 0, 0]
    ],
    L: [
        [0, 0, 1],
        [1, 1, 1],
        [0, 0, 0]
    ],
    O: [
        [1, 1],
        [1, 1]
    ],
    S: [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0]
    ],
    T: [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0]
    ],
    Z: [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0]
    ]
}

const COLORS: Record<TetrominoType, string> = {
    I: '#06b6d4', // Cyan
    J: '#3b82f6', // Blue
    L: '#f97316', // Orange
    O: '#eab308', // Yellow
    S: '#22c55e', // Green
    T: '#a855f7', // Purple
    Z: '#ef4444'  // Red
}

// --- 状态管理 ---
// 游戏面板：0 表示空，字符串表示颜色代码
const board = ref<string[][]>(Array.from({ length: ROWS }, () => Array(COLS).fill('')))
const currentPiece = ref<{ type: TetrominoType; shape: TetrominoShape; x: number; y: number } | null>(null)
const nextPieceType = ref<TetrominoType | null>(null)
const score = ref(0)
const level = ref(1)
const linesCleared = ref(0)
const highScore = ref(0)
const status = ref<GameStatus>('IDLE')
const speed = ref(INITIAL_SPEED)
const speedMultiplier = ref(1) // 倍速控制

let lastTime = 0
let animationFrameId: number | null = null
let dropCounter = 0 // 累积时间，用于控制下落

// --- 核心逻辑 ---

// 初始化游戏
function initGame() {
    // 清空面板
    board.value = Array.from({ length: ROWS }, () => Array(COLS).fill(''))
    score.value = 0
    linesCleared.value = 0
    level.value = 1
    speed.value = INITIAL_SPEED
    dropCounter = 0

    nextPieceType.value = getRandomType()
    spawnPiece()

    status.value = 'PLAYING'
    lastTime = 0
    startGameLoop()
}

function getRandomType(): TetrominoType {
    const types: TetrominoType[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z']
    return types[Math.floor(Math.random() * types.length)]
}

function spawnPiece() {
    const type = nextPieceType.value || getRandomType()
    nextPieceType.value = getRandomType()

    const shape = SHAPES[type]
    // 初始位置居中
    const startX = Math.floor((COLS - shape[0].length) / 2)
    const startY = 0 // 从顶部开始

    currentPiece.value = {
        type,
        shape: JSON.parse(JSON.stringify(shape)), // 深拷贝以支持旋转
        x: startX,
        y: startY
    }

    // 生成即碰撞 -> 游戏结束
    if (checkCollision(currentPiece.value!.shape, startX, startY)) {
        gameOver()
    }
}

// 旋转矩阵
function rotateMatrix(matrix: number[][]): number[][] {
    const N = matrix.length
    // 创建新矩阵：行列交换
    const rotated = matrix[0].map((val, index) => matrix.map(row => row[index]).reverse())
    return rotated
}

// 尝试旋转
function rotatePiece() {
    if (!currentPiece.value || status.value !== 'PLAYING') return

    const oldShape = currentPiece.value.shape
    const newShape = rotateMatrix(oldShape)

    // Wall Kick
    if (!checkCollision(newShape, currentPiece.value.x, currentPiece.value.y)) {
        currentPiece.value.shape = newShape
    } else if (!checkCollision(newShape, currentPiece.value.x - 1, currentPiece.value.y)) {
        currentPiece.value.x -= 1
        currentPiece.value.shape = newShape
    } else if (!checkCollision(newShape, currentPiece.value.x + 1, currentPiece.value.y)) {
        currentPiece.value.x += 1
        currentPiece.value.shape = newShape
    }
}

function movePiece(dx: number, dy: number) {
    if (!currentPiece.value || status.value !== 'PLAYING') return

    const newX = currentPiece.value.x + dx
    const newY = currentPiece.value.y + dy

    if (!checkCollision(currentPiece.value.shape, newX, newY)) {
        currentPiece.value.x = newX
        currentPiece.value.y = newY
        return true
    } else if (dy > 0) {
        // 向下移动碰到东西 -> 锁定方块
        lockPiece()
        return false
    }
    return false
}

// 硬降到底
function hardDrop() {
    if (!currentPiece.value || status.value !== 'PLAYING') return
    while (movePiece(0, 1)) {
        score.value += 2 // 硬降得分
    }
}

// 碰撞检测
function checkCollision(shape: number[][], x: number, y: number): boolean {
    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c] !== 0) {
                const boardX = x + c
                const boardY = y + r

                // 边界检查
                if (boardX < 0 || boardX >= COLS || boardY >= ROWS) {
                    return true
                }
                // 已有方块检查
                if (boardY >= 0 && board.value[boardY][boardX] !== '') {
                    return true
                }
            }
        }
    }
    return false
}

// 锁定方块并消除
function lockPiece() {
    if (!currentPiece.value) return

    const { shape, x, y, type } = currentPiece.value
    const color = COLORS[type]

    // 将当前方块固定到 board
    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c] !== 0) {
                const boardY = y + r
                const boardX = x + c
                if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
                    board.value[boardY][boardX] = color
                } else {
                    gameOver()
                    return
                }
            }
        }
    }

    clearLines()
    spawnPiece()
}

// 消除行
function clearLines() {
    let cleared = 0

    // 从底向上检查
    for (let r = ROWS - 1; r >= 0; r--) {
        if (board.value[r].every(cell => cell !== '')) {
            // 消除该行
            board.value.splice(r, 1)
            // 顶部补空行
            board.value.unshift(Array(COLS).fill(''))
            cleared++
            r++ // 需要重新检查该位置
        }
    }

    if (cleared > 0) {
        // 计分规则
        const points = [0, 100, 300, 500, 800]
        score.value += points[cleared] * level.value
        linesCleared.value += cleared

        // 升级逻辑
        level.value = Math.floor(linesCleared.value / 10) + 1
        // 速度增加
        speed.value = Math.max(MIN_SPEED, INITIAL_SPEED - (level.value - 1) * SPEED_DECREMENT)
    }
}

function gameOver() {
    status.value = 'GAME_OVER'
    stopGameLoop()
    if (score.value > highScore.value) {
        highScore.value = score.value
        localStorage.setItem('tetris-highscore', highScore.value.toString())
    }
}

// 游戏循环
function gameLoop(timestamp: number) {
    if (!lastTime) lastTime = timestamp
    const deltaTime = timestamp - lastTime
    lastTime = timestamp

    dropCounter += deltaTime

    // 应用倍速
    const effectiveSpeed = speed.value / speedMultiplier.value

    if (dropCounter >= effectiveSpeed) {
        movePiece(0, 1)
        dropCounter = 0
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

// 控制相关
function handleKeydown(e: KeyboardEvent) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault()
    }

    if (status.value !== 'PLAYING') {
        if ((status.value === 'IDLE' || status.value === 'GAME_OVER') && (e.key === ' ' || e.key === 'Enter')) {
            initGame()
        } else if (status.value === 'PAUSED' && e.key === ' ') {
            status.value = 'PLAYING'
            startGameLoop()
        }
        return
    }

    if (e.key === ' ' && status.value === 'PLAYING') {
        hardDrop()
        return
    }

    if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        status.value = 'PAUSED'
        stopGameLoop()
        return
    }

    switch (e.key) {
        case 'ArrowUp': case 'w': case 'W': rotatePiece(); break
        case 'ArrowDown': case 's': case 'S': movePiece(0, 1); score.value += 1; break
        case 'ArrowLeft': case 'a': case 'A': movePiece(-1, 0); break
        case 'ArrowRight': case 'd': case 'D': movePiece(1, 0); break
    }
}

// 虚拟按键
function handleControl(action: string) {
    if (status.value !== 'PLAYING') return

    switch (action) {
        case 'LEFT': movePiece(-1, 0); break;
        case 'RIGHT': movePiece(1, 0); break;
        case 'DOWN': movePiece(0, 1); break;
        case 'ROTATE': rotatePiece(); break;
        case 'DROP': hardDrop(); break;
    }
}

onMounted(() => {
    window.addEventListener('keydown', handleKeydown)
    const saved = localStorage.getItem('tetris-highscore')
    if (saved) highScore.value = parseInt(saved)
})

onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
    stopGameLoop()
})

// 移除 renderBoard computed
// 改用直接获取当前块的渲染信息
const activeBlocks = computed(() => {
    if (!currentPiece.value) return []
    const blocks: { r: number, c: number, color: string }[] = []
    const { shape, x, y, type } = currentPiece.value
    const color = COLORS[type]
    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c]) {
                blocks.push({ r: y + r, c: x + c, color })
            }
        }
    }
    return blocks
})

// 预览下一个方块的形状
const nextPieceShape = computed(() => {
    if (!nextPieceType.value) return []
    return SHAPES[nextPieceType.value]
})

const nextPieceColor = computed(() => {
    if (!nextPieceType.value) return 'transparent'
    return COLORS[nextPieceType.value]
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
                    <span class="label">LEVEL</span>
                    <span class="value">{{ level }}</span>
                </div>
                <div class="score-item">
                    <span class="label">BEST</span>
                    <span class="value">{{ highScore }}</span>
                </div>
            </div>

            <SpeedControl v-model="speedMultiplier" />
        </div>

        <div class="game-content">
            <div class="game-area">
                <!-- 棋盘 -->
                <div class="board" :style="{
                    width: `calc(var(--grid-size) * ${COLS})`,
                    height: `calc(var(--grid-size) * ${ROWS})`
                }">
                    <!-- 已锁定的块 -->
                    <template v-for="(row, r) in board">
                        <template v-for="(cellColor, c) in row">
                            <div v-if="cellColor" :key="`locked-${r}-${c}`" class="block locked" :style="{
                                left: `calc(var(--grid-size) * ${c})`,
                                top: `calc(var(--grid-size) * ${r})`,
                                backgroundColor: cellColor
                            }">
                            </div>
                        </template>
                    </template>

                    <!-- 当前活动的块 -->
                    <div v-for="(block, i) in activeBlocks" :key="`active-${i}`" class="block active" :style="{
                        left: `calc(var(--grid-size) * ${block.c})`,
                        top: `calc(var(--grid-size) * ${block.r})`,
                        backgroundColor: block.color
                    }">
                    </div>

                    <!-- 遮罩层 -->
                    <div v-if="status !== 'PLAYING'" class="overlay">
                        <div v-if="status === 'IDLE'" class="start-msg">
                            <div class="tetris-logo">TETRIS</div>
                            <button class="btn" @click="initGame">开始游戏</button>
                        </div>
                        <div v-if="status === 'GAME_OVER'" class="game-over-msg">
                            <h2>GAME OVER</h2>
                            <p>最终得分: {{ score }}</p>
                            <button class="btn" @click="initGame">再玩一次</button>
                        </div>
                        <div v-if="status === 'PAUSED'" class="paused-msg">
                            <h2>PAUSED</h2>
                            <button class="btn" @click="() => { status = 'PLAYING'; startGameLoop() }">继续</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 侧边栏：预览下一个 + 操作说明 -->
            <div class="sidebar">
                <div class="next-piece-box">
                    <span class="label">NEXT</span>
                    <div class="next-piece-display" v-if="nextPieceType">
                        <div v-for="(row, r) in nextPieceShape" :key="r" class="preview-row">
                            <div v-for="(cell, c) in row" :key="c" class="preview-cell"
                                :style="{ backgroundColor: cell ? nextPieceColor : 'transparent' }">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 移动端控件 -->
        <GameControls @up="handleControl('ROTATE')" @down="handleControl('DOWN')" @left="handleControl('LEFT')"
            @right="handleControl('RIGHT')" @action-a="handleControl('ROTATE')" @action-b="handleControl('DROP')"
            label-a="Rot" label-b="Drop" />
    </div>
</template>

<style scoped>
/* CSS变量控制网格大小，实现动态缩放 */
.game-container {
    --grid-size: 25px;
    /* 默认桌面端大小 */

    display: flex;
    flex-direction: column;
    align-items: center;
    font-family: 'Courier New', Courier, monospace;
    margin: 20px 0;
    user-select: none;
    touch-action: pan-y;
}

/* 响应式调整 */
@media (max-width: 400px) {
    .game-container {
        --grid-size: 20px;
        /* 小屏幕缩小网格 */
    }
}

.header {
    margin-bottom: 15px;
    width: 100%;
    max-width: 400px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
}

.score-board {
    display: flex;
    justify-content: space-around;
    background: var(--vp-c-bg-soft);
    padding: 10px;
    border-radius: 8px;
    border: 1px solid var(--vp-c-divider);
    flex-grow: 1;
}

.score-item {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.label {
    font-size: 0.75rem;
    color: var(--vp-c-text-2);
    margin-bottom: 2px;
}

.value {
    font-size: 1.2rem;
    font-weight: bold;
    color: var(--vp-c-brand);
}

.game-content {
    display: flex;
    gap: 20px;
    align-items: flex-start;
}

@media (max-width: 600px) {
    .game-content {
        flex-direction: column;
        align-items: center;
    }

    .sidebar {
        flex-direction: row;
        width: 100%;
        justify-content: center;
    }

    .instructions {
        display: none;
    }
}

.game-area {
    position: relative;
    padding: 5px;
    background: var(--vp-c-bg-alt);
    border-radius: 8px;
    border: 4px solid var(--vp-c-divider);
}

.board {
    background-color: #1a1a1a;
    position: relative;
    overflow: hidden;
    /* 必须显式设置尺寸，否则 overflow hidden 可能失效? 但这里 height 由 style 决定没问题 */
}

/* 使用 CSS 变量渲染的大小 */
.block {
    position: absolute;
    width: var(--grid-size);
    height: var(--grid-size);
    box-sizing: border-box;
    border: 1px solid rgba(0, 0, 0, 0.1);
}

/* 网格背景线 */
.board::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image:
        linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
    background-size: var(--grid-size) var(--grid-size);
    pointer-events: none;
}


.overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: white;
    z-index: 20;
}

.tetris-logo {
    font-size: 2.5rem;
    font-weight: 800;
    margin-bottom: 20px;
    background: linear-gradient(to right, #ef4444, #eab308, #22c55e, #3b82f6, #a855f7);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    letter-spacing: 2px;
}

.sidebar {
    display: flex;
    flex-direction: column;
    gap: 20px;
    width: 120px;
}

.next-piece-box {
    background: var(--vp-c-bg-soft);
    padding: 10px;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100px;
    justify-content: center;
}

.next-piece-display {
    display: flex;
    flex-direction: column;
    gap: 1px;
    margin-top: 5px;
}

.preview-row {
    display: flex;
    gap: 1px;
}

.preview-cell {
    width: 15px;
    height: 15px;
    border-radius: 2px;
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

.game-over-msg h2,
.paused-msg h2 {
    margin-bottom: 15px;
    color: #fff;
}



.desktop-only {
    display: block;
}
</style>
