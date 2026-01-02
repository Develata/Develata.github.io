<!--
  @file Sokoban.vue
  @description 推箱子游戏组件 (Sokoban)
  职责：
  1. 解析关卡地图数据。
  2. 实现以人为中心的推箱子移动逻辑。
  3. 提供撤销 (Undo) 和重置功能。
-->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import GameControls from './controls/GameControls.vue'

// --- 类型定义 ---
// 地图元素
enum Tile {
    Empty = ' ',
    Wall = '#',
    Player = '@',
    Box = '$',
    Goal = '.',
    BoxOnGoal = '*',
    PlayerOnGoal = '+'
}

type Position = { r: number; c: number }

// 关卡数据 (限制在 8x8 网格内的经典/自制关卡)
const LEVELS = [
    [
        // Level 1: Microban 1 (David W. Skinner)
        "  ##### ",
        "###   # ",
        "#  $  # ",
        "#  .  # ",
        "### @ # ",
        "  ##### "
    ],
    [
        // Level 2: Microban 2
        "  ##### ",
        "###   ##",
        "# . $  #",
        "###  $ #",
        "  #@ . #",
        "  ######"
    ],
    [
        // Level 3: Microban 3
        "   #### ",
        "####  ##",
        "#  $   #",
        "#  $   #",
        "#@.. ###",
        "#####   "
    ],
    [
        // Level 4: Mini Mover
        "########",
        "#  @   #",
        "# $ $  #",
        "# .  . #",
        "# $  $ #",
        "# .  . #",
        "########"
    ],
    [
        // Level 5: The Cross
        "  ####  ",
        "  #  #  ",
        "###  ###",
        "# @$ $ #",
        "### .###",
        "  #  #  ",
        "  ####  "
    ],
    [
        // Level 6: Tiny Trap
        "######",
        "#    #",
        "# $  #",
        "#  $ #",
        "# . .#",
        "# @  #",
        "######"
    ],
    [
        // Level 7: The Box
        "#######",
        "#  .  #",
        "# $ $ #",
        "# .@. #",
        "# $ $ #",
        "#  .  #",
        "#######"
    ],
    [
        // Level 8: Corridor
        "#######",
        "# . . #",
        "##### #",
        "# $ $ #",
        "# @   #",
        "#######"
    ],
    [
        // Level 9: Huddle
        "######",
        "# .. #",
        "# $$ #",
        "#@$$ #",
        "# .. #",
        "######"
    ],
    [
        // Level 10: Compact Challenge
        "########",
        "# .  . #",
        "#  $$  #",
        "#  @   #",
        "#  $$  #",
        "# .  . #",
        "########"
    ]
]

// --- 状态管理 ---
const currentLevelIndex = ref(0)
const grid = ref<Tile[][]>([])
const moves = ref(0)
const bestMoves = ref(0) // 当前关卡的最佳步数
const history = ref<{ grid: Tile[][], moves: number }[]>([])
const isWon = ref(false)

const playerPos = ref<Position>({ r: 0, c: 0 })

// --- 核心逻辑 ---

function loadLevel(index: number) {
    if (index < 0) index = 0
    if (index >= LEVELS.length) index = LEVELS.length - 1

    currentLevelIndex.value = index

    // Load Best Moves
    const saved = localStorage.getItem('sokoban-best')
    if (saved) {
        const data = JSON.parse(saved)
        bestMoves.value = data[index] || 0
    } else {
        bestMoves.value = 0
    }

    const levelStr = LEVELS[index]

    const maxCols = Math.max(...levelStr.map(row => row.length))

    grid.value = levelStr.map((rowStr, r) => {
        const row = rowStr.padEnd(maxCols, ' ').split('') as Tile[]
        const c = row.findIndex(cell => cell === Tile.Player || cell === Tile.PlayerOnGoal)
        if (c !== -1) {
            playerPos.value = { r, c }
        }
        return row
    })

    moves.value = 0
    history.value = []
    isWon.value = false
}

function cloneGrid(g: Tile[][]): Tile[][] {
    return g.map(row => [...row])
}

function saveHistory() {
    if (history.value.length > 500) history.value.shift()
    history.value.push({
        grid: cloneGrid(grid.value),
        moves: moves.value
    })
}

function move(dr: number, dc: number) {
    if (isWon.value) return

    const pr = playerPos.value.r
    const pc = playerPos.value.c
    const nr = pr + dr
    const nc = pc + dc

    if (!isInBounds(nr, nc)) return

    const targetCell = grid.value[nr][nc]

    if (targetCell === Tile.Wall) return

    if (targetCell === Tile.Empty || targetCell === Tile.Goal) {
        saveHistory()
        updatePlayerPos(pr, pc, nr, nc)
        moves.value++
        return
    }

    if (targetCell === Tile.Box || targetCell === Tile.BoxOnGoal) {
        const nnr = nr + dr
        const nnc = nc + dc

        if (!isInBounds(nnr, nnc)) return

        const boxDestCell = grid.value[nnr][nnc]

        if (boxDestCell === Tile.Wall || boxDestCell === Tile.Box || boxDestCell === Tile.BoxOnGoal) {
            return
        }

        saveHistory()

        const newBoxTitle = (boxDestCell === Tile.Goal) ? Tile.BoxOnGoal : Tile.Box
        grid.value[nnr][nnc] = newBoxTitle

        updatePlayerPos(pr, pc, nr, nc)
        moves.value++

        checkWin()
    }
}

function updatePlayerPos(oldR: number, oldC: number, newR: number, newC: number) {
    const oldTitle = grid.value[oldR][oldC]
    grid.value[oldR][oldC] = (oldTitle === Tile.PlayerOnGoal) ? Tile.Goal : Tile.Empty

    const targetTitle = grid.value[newR][newC]
    const isTargetGoal = (targetTitle === Tile.Goal || targetTitle === Tile.BoxOnGoal || targetTitle === Tile.PlayerOnGoal)

    grid.value[newR][newC] = isTargetGoal ? Tile.PlayerOnGoal : Tile.Player
    playerPos.value = { r: newR, c: newC }
}

function isInBounds(r: number, c: number) {
    return r >= 0 && r < grid.value.length && c >= 0 && c < grid.value[0].length
}

function checkWin() {
    const hasUnplacedBox = grid.value.some(row => row.includes(Tile.Box))
    if (!hasUnplacedBox) {
        isWon.value = true

        // Update Best Moves
        if (bestMoves.value === 0 || moves.value < bestMoves.value) {
            bestMoves.value = moves.value

            // Save to LocalStorage
            const saved = localStorage.getItem('sokoban-best')
            const data = saved ? JSON.parse(saved) : {}
            data[currentLevelIndex.value] = bestMoves.value
            localStorage.setItem('sokoban-best', JSON.stringify(data))
        }
    }
}

function undo() {
    if (history.value.length === 0 || isWon.value) return
    const prev = history.value.pop()
    if (prev) {
        grid.value = prev.grid
        moves.value = prev.moves
        grid.value.forEach((row, r) => {
            row.forEach((cell, c) => {
                if (cell === Tile.Player || cell === Tile.PlayerOnGoal) {
                    playerPos.value = { r, c }
                }
            })
        })
    }
}

function reset() {
    loadLevel(currentLevelIndex.value)
}

function prevLevel() {
    if (currentLevelIndex.value > 0) loadLevel(currentLevelIndex.value - 1)
}

function nextLevel() {
    if (currentLevelIndex.value < LEVELS.length - 1) loadLevel(currentLevelIndex.value + 1)
}

function handleKeydown(e: KeyboardEvent) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault()
    }

    if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        undo()
        return
    }

    if (e.key === 'r' || e.key === 'R') {
        reset()
        return
    }

    switch (e.key) {
        case 'ArrowUp': case 'w': case 'W': move(-1, 0); break;
        case 'ArrowDown': case 's': case 'S': move(1, 0); break;
        case 'ArrowLeft': case 'a': case 'A': move(0, -1); break;
        case 'ArrowRight': case 'd': case 'D': move(0, 1); break;
    }
}

function handleControl(action: string) {
    switch (action) {
        case 'UP': move(-1, 0); break;
        case 'DOWN': move(1, 0); break;
        case 'LEFT': move(0, -1); break;
        case 'RIGHT': move(0, 1); break;
        case 'UNDO': undo(); break;
        case 'RESET': reset(); break;
    }
}

onMounted(() => {
    loadLevel(0)
    window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
})

</script>

<template>
    <div class="game-container">
        <div class="header">
            <div class="info-panel">
                <div class="level-info">
                    <span class="label">LEVEL</span>
                    <span class="value">{{ currentLevelIndex + 1 }}<span class="total">/{{ LEVELS.length
                    }}</span></span>
                </div>
                <div class="moves-info">
                    <span class="label">MOVES</span>
                    <span class="value">{{ moves }}</span>
                </div>
                <!-- 显示最佳步数 -->
                <div class="moves-info" v-if="bestMoves > 0">
                    <span class="label">BEST</span>
                    <span class="value best">{{ bestMoves }}</span>
                </div>
            </div>

            <div class="level-controls">
                <button class="nav-btn" @click="prevLevel" :disabled="currentLevelIndex === 0">◀</button>
                <button class="nav-btn" @click="nextLevel"
                    :disabled="currentLevelIndex === LEVELS.length - 1">▶</button>
            </div>
        </div>

        <div class="game-area">
            <div class="grid" v-if="grid.length" :style="{
                gridTemplateRows: `repeat(${grid.length}, 1fr)`,
                gridTemplateColumns: `repeat(${grid[0].length}, 1fr)`,
                aspectRatio: `${grid[0].length}/${grid.length}`
            }">
                <template v-for="(row, r) in grid">
                    <div v-for="(cell, c) in row" :key="`${r}-${c}`" class="cell" :class="{
                        'wall': cell === Tile.Wall,
                        'floor': cell !== Tile.Wall,
                        'goal': cell === Tile.Goal || cell === Tile.PlayerOnGoal || cell === Tile.BoxOnGoal
                    }">
                        <!-- 渲染逻辑更新：终点为灰色叉，在 CSS 中处理 -->

                        <div v-if="cell === Tile.Box" class="entity box">📦</div>
                        <div v-if="cell === Tile.BoxOnGoal" class="entity box on-goal">🎁</div>
                        <div v-if="cell === Tile.Player" class="entity player">😃</div>
                        <div v-if="cell === Tile.PlayerOnGoal" class="entity player">😃</div>
                    </div>
                </template>
            </div>

            <div v-if="isWon" class="overlay">
                <div class="msg-box">
                    <h2>LEVEL COMPLETE!</h2>
                    <p>Moves: {{ moves }}</p>
                    <button class="btn big" @click="nextLevel" v-if="currentLevelIndex < LEVELS.length - 1">Next Level
                        ➜</button>
                    <div v-else class="end-msg">🎉 全通关达成！🎉</div>
                </div>
            </div>
        </div>

        <div class="controls-area">
            <div class="actions">
                <button class="action-btn" @click="undo" title="Undo (Ctrl+Z)">↩️ Undo</button>
                <button class="action-btn" @click="reset" title="Reset (R)">🔄 Reset</button>
            </div>

            <GameControls @up="handleControl('UP')" @down="handleControl('DOWN')" @left="handleControl('LEFT')"
                @right="handleControl('RIGHT')" @action-b="undo" label-b="Undo" :hide-actions="false" label-a="Reset"
                @action-a="reset" />
        </div>

        <div class="instructions">
            推动所有的 📦 到 ✕ 标记处变成 🎁
        </div>
    </div>
</template>

<style scoped>
.game-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    font-family: 'Courier New', Courier, sans-serif;
    margin: 20px 0;
    touch-action: pan-y;
}

.header {
    display: flex;
    width: 100%;
    max-width: 500px;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    background: var(--vp-c-bg-soft);
    padding: 10px 20px;
    border-radius: 12px;
    border: 1px solid var(--vp-c-divider);
}

.info-panel {
    display: flex;
    gap: 20px;
}

.level-info,
.moves-info {
    display: flex;
    flex-direction: column;
}

.label {
    font-size: 0.7rem;
    color: var(--vp-c-text-2);
    font-weight: bold;
}

.value {
    font-size: 1.2rem;
    font-weight: bold;
    color: var(--vp-c-brand);
}

.value.best {
    color: var(--vp-c-text-2);
    /* 区分最佳步数颜色 */
}

.total {
    font-size: 0.8rem;
    color: var(--vp-c-text-3);
    font-weight: normal;
}

.nav-btn {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    border: 1px solid var(--vp-c-divider);
    background: var(--vp-c-bg);
    cursor: pointer;
    font-size: 1.2rem;
    margin-left: 5px;
    transition: all 0.2s;
}

.nav-btn:hover:not(:disabled) {
    border-color: var(--vp-c-brand);
    color: var(--vp-c-brand);
}

.nav-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
}

.game-area {
    position: relative;
    width: 100%;
    max-width: 500px;
    background: var(--vp-c-bg-alt);
    padding: 20px;
    border-radius: 12px;
    border: 4px solid var(--vp-c-divider);
}

.grid {
    display: grid;
    gap: 1px;
    background: transparent;
    width: 100%;
    margin: 0 auto;
}

.cell {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 1.5rem;
}

.wall {
    background: #575757;
    border-radius: 2px;
    box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.5);
    background-image: linear-gradient(45deg, rgba(255, 255, 255, 0.05) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.05) 50%, rgba(255, 255, 255, 0.05) 75%, transparent 75%, transparent);
    background-size: 10px 10px;
}

.floor {
    background: var(--vp-c-bg);
}

.goal {
    background: var(--vp-c-bg);
}

/* 目标点的小圆点 */
/* .goal::after {
    content: '';
    position: absolute;
    width: 20%;
    height: 20%;
    background: var(--vp-c-danger);
    border-radius: 50%;
    opacity: 0.5;
} */

/* 灰色叉 (SVG 方式或伪元素) */
.goal::before {
    content: '✖';
    /* 使用 unicode 乘号或 X */
    position: absolute;
    color: #9ca3af;
    /* gray-400 */
    font-size: 1rem;
    opacity: 0.5;
}

.entity {
    position: relative;
    z-index: 2;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 90%;
    height: 90%;
    transition: transform 0.1s;
    user-select: none;
}

.box {
    font-size: 80%;
}

.overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 8px;
    z-index: 10;
    animation: fadeIn 0.3s;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

.msg-box {
    text-align: center;
    color: white;
}

.btn.big {
    margin-top: 15px;
    padding: 10px 25px;
    font-size: 1.2rem;
    background: var(--vp-c-brand);
    color: white;
    border: none;
    border-radius: 25px;
    cursor: pointer;
}

.controls-area {
    width: 100%;
    max-width: 500px;
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
}

.actions {
    display: flex;
    gap: 20px;
    /* Desktop only */
}

@media (max-width: 768px) {
    .actions {
        display: none;
        /* Mobile uses B button for undo */
    }
}

.action-btn {
    padding: 8px 15px;
    border-radius: 8px;
    background: var(--vp-c-bg-soft);
    border: 1px solid var(--vp-c-divider);
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
}

.action-btn:hover {
    background: var(--vp-c-brand-soft);
    border-color: var(--vp-c-brand);
}

.instructions {
    margin-top: 20px;
    color: var(--vp-c-text-3);
    font-size: 0.9rem;
}
</style>
