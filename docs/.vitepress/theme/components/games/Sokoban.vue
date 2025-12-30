<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'

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
type Move = {
    dir: Position,
    push: boolean // 是否是推箱子操作，用于撤销时判断是否拉回箱子
}

// 关卡数据 (经典的 Microban 关卡集)
const LEVELS = [
    [
        "  ##### ",
        "###   ##",
        "# @$ $ #",
        "### .###",
        "  # .#  ",
        "  ####  "
    ],
    [
        "  ##### ",
        "###   ##",
        "# . $  #",
        "###  $ #",
        "  #@ . #",
        "  ######"
    ],
    [
        "   #### ",
        "####  ##",
        "#  $   #",
        "#  $   #",
        "#@.. ###",
        "#####   "
    ],
    [ // Classic Level 1
        "    #####",
        "    #   #",
        "    #$  #",
        "  ###  $##",
        "  #  $ $ #",
        "### # ## #   ######",
        "#   # ## #####  ..#",
        "# $  $          ..#",
        "##### ### #@##  ..#",
        "    #     #########",
        "    #######"
    ],
    [
        "############",
        "#..  #     ###",
        "#..  # $  $  #",
        "#..  #$####  #",
        "#..    @ ##  #",
        "#..  # #  $ ##",
        "###### ##$ $ #",
        "  # $  $ $ $ #",
        "  #    #     #",
        "  ############"
    ]
]

// --- 状态管理 ---
const currentLevelIndex = ref(0)
const grid = ref<Tile[][]>([]) // 动态游戏网格
const moves = ref(0)
const history = ref<{ grid: Tile[][], moves: number }[]>([]) // 历史记录栈 (存完整快照最简单可靠)
const isWon = ref(false)

// 玩家位置缓存，方便查找
const playerPos = ref<Position>({ r: 0, c: 0 })

// --- 核心逻辑 ---

// 解析地图
function loadLevel(index: number) {
    if (index < 0) index = 0
    if (index >= LEVELS.length) index = LEVELS.length - 1

    currentLevelIndex.value = index
    const levelStr = LEVELS[index]

    // 转换为二维数组
    // 找到最大宽度
    const maxCols = Math.max(...levelStr.map(row => row.length))

    grid.value = levelStr.map((rowStr, r) => {
        const row = rowStr.padEnd(maxCols, ' ').split('') as Tile[]
        // 查找玩家初始位置
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

// 深度克隆 Grid
function cloneGrid(g: Tile[][]): Tile[][] {
    return g.map(row => [...row])
}

// 记录历史
function saveHistory() {
    // 限制历史长度防止内存爆炸（虽然 Sokoban 状态很小）
    if (history.value.length > 500) history.value.shift()
    history.value.push({
        grid: cloneGrid(grid.value),
        moves: moves.value
    })
}

// 移动逻辑
function move(dr: number, dc: number) {
    if (isWon.value) return

    const pr = playerPos.value.r
    const pc = playerPos.value.c
    const nr = pr + dr // Next Row
    const nc = pc + dc // Next Col

    // 检查越界
    if (!isInBounds(nr, nc)) return

    const targetCell = grid.value[nr][nc]

    // 1. 碰到墙
    if (targetCell === Tile.Wall) return

    // 2. 碰到空地或目标点 -> 移动
    if (targetCell === Tile.Empty || targetCell === Tile.Goal) {
        saveHistory()
        updatePlayerPos(pr, pc, nr, nc)
        moves.value++
        return
    }

    // 3. 碰到箱子 -> 尝试推
    if (targetCell === Tile.Box || targetCell === Tile.BoxOnGoal) {
        const nnr = nr + dr // Open Row (Box destination)
        const nnc = nc + dc

        if (!isInBounds(nnr, nnc)) return

        const boxDestCell = grid.value[nnr][nnc]

        // 箱子后面是墙或另一个箱子 -> 推不动
        if (boxDestCell === Tile.Wall || boxDestCell === Tile.Box || boxDestCell === Tile.BoxOnGoal) {
            return
        }

        // 推箱子!
        saveHistory()

        // 移动箱子
        // 若目标位是 Goal，则变成 BoxOnGoal，否则 Box
        const newBoxTitle = (boxDestCell === Tile.Goal) ? Tile.BoxOnGoal : Tile.Box
        grid.value[nnr][nnc] = newBoxTitle

        // 移动玩家到箱子原来的位置
        updatePlayerPos(pr, pc, nr, nc)
        moves.value++

        checkWin()
    }
}

function updatePlayerPos(oldR: number, oldC: number, newR: number, newC: number) {
    // 处理旧位置：如果是 PlayerOnGoal，离开后变成 Goal；否则变成 Empty
    const oldTitle = grid.value[oldR][oldC]
    grid.value[oldR][oldC] = (oldTitle === Tile.PlayerOnGoal) ? Tile.Goal : Tile.Empty

    // 处理新位置：如果是 Goal 或 BoxOnGoal(箱子被推走了，原来下面肯定是Goal?)
    // 注意：updatePlayerPos 是在箱子已经移走之后调用的，所以此时 grid[newR][newC] 依然是旧的 Box/BoxOnGoal 或者是 Empty/Goal
    // 不对，推箱子逻辑里，先改了箱子目标位，但箱子原位置还没改（还是 Box/BoxOnGoal），这里覆盖它

    const targetTitle = grid.value[newR][newC]
    // 这里要注意：如果原来是 BoxOnGoal，说明这格是 Goal；如果原来是 Goal，也是 Goal。
    // 如果原来是 Box，说明是 Empty。
    // 但是在 move() 函数里没有清除箱子原位置，直接让 updatePlayerPos 覆盖是可行的，只要知道底下是不是 Goal

    // 简单的判断：如果 grid[newR][newC] 曾经是 Goal/BoxOnGoal/PlayerOnGoal，那它底下就是 Goal
    // 但因为我们每步都修改 grid，所以要看 symbol。
    // BoxOnGoal, Goal, PlayerOnGoal 都意味着底层是 Goal

    const isTargetGoal = (targetTitle === Tile.Goal || targetTitle === Tile.BoxOnGoal || targetTitle === Tile.PlayerOnGoal)

    grid.value[newR][newC] = isTargetGoal ? Tile.PlayerOnGoal : Tile.Player
    playerPos.value = { r: newR, c: newC }
}

function isInBounds(r: number, c: number) {
    return r >= 0 && r < grid.value.length && c >= 0 && c < grid.value[0].length
}

function checkWin() {
    // 检查是否所有 Box 都在 Goal 上，或者是否还有任何普通 Box
    // 只要 grid 里没有 Tile.Box ($)，说明所有箱子都变成了 Tile.BoxOnGoal (*)
    const hasUnplacedBox = grid.value.some(row => row.includes(Tile.Box))
    if (!hasUnplacedBox) {
        isWon.value = true
    }
}

// 撤销
function undo() {
    if (history.value.length === 0 || isWon.value) return
    const prev = history.value.pop()
    if (prev) {
        grid.value = prev.grid
        moves.value = prev.moves
        // 重新定位玩家
        grid.value.forEach((row, r) => {
            row.forEach((cell, c) => {
                if (cell === Tile.Player || cell === Tile.PlayerOnGoal) {
                    playerPos.value = { r, c }
                }
            })
        })
    }
}

// 重置
function reset() {
    loadLevel(currentLevelIndex.value)
}

function prevLevel() {
    if (currentLevelIndex.value > 0) loadLevel(currentLevelIndex.value - 1)
}

function nextLevel() {
    if (currentLevelIndex.value < LEVELS.length - 1) loadLevel(currentLevelIndex.value + 1)
}

// 键盘控制
function handleKeydown(e: KeyboardEvent) {
    // 防止滚动
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

// 虚拟按键
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
            </div>

            <div class="level-controls">
                <button class="nav-btn" @click="prevLevel" :disabled="currentLevelIndex === 0">◀</button>
                <button class="nav-btn" @click="nextLevel"
                    :disabled="currentLevelIndex === LEVELS.length - 1">▶</button>
            </div>
        </div>

        <div class="game-area">
            <!-- 动态渲染 Grid -->
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
                        <!-- 实体层 -->
                        <div v-if="cell === Tile.Box" class="entity box">📦</div>
                        <div v-if="cell === Tile.BoxOnGoal" class="entity box on-goal">🎁</div>
                        <div v-if="cell === Tile.Player" class="entity player">😃</div>
                        <div v-if="cell === Tile.PlayerOnGoal" class="entity player">😃</div>
                    </div>
                </template>
            </div>

            <!-- 胜利遮罩 -->
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

        <!-- 操作区 -->
        <div class="controls-area">
            <div class="actions">
                <button class="action-btn" @click="undo" title="Undo (Ctrl+Z)">↩️ Undo</button>
                <button class="action-btn" @click="reset" title="Reset (R)">🔄 Reset</button>
            </div>

            <div class="d-pad">
                <button class="d-btn up" @click="handleControl('UP')">▲</button>
                <div class="h-row">
                    <button class="d-btn left" @click="handleControl('LEFT')">◀</button>
                    <button class="d-btn down" @click="handleControl('DOWN')">▼</button>
                    <button class="d-btn right" @click="handleControl('RIGHT')">▶</button>
                </div>
            </div>
        </div>

        <div class="instructions">
            推动所有的 📦 到 . 标记处变成 🎁
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
    /* Emoji size */
}

.wall {
    background: #575757;
    border-radius: 2px;
    box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.5);
}

.floor {
    background: var(--vp-c-bg);
}

.goal {
    background: var(--vp-c-bg);
}

/* 目标点的小圆点 */
.goal::after {
    content: '';
    position: absolute;
    width: 20%;
    height: 20%;
    background: var(--vp-c-danger);
    border-radius: 50%;
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

.d-pad {
    display: none;
    /* Desktop default hidden */
    flex-direction: column;
    align-items: center;
    gap: 5px;
}

@media (max-width: 768px) {
    .d-pad {
        display: flex;
    }
}

.h-row {
    display: flex;
    gap: 45px;
}

.d-btn {
    width: 50px;
    height: 50px;
    background: var(--vp-c-bg-soft);
    border: 1px solid var(--vp-c-divider);
    border-radius: 12px;
    font-size: 1.2rem;
    color: var(--vp-c-text-1);
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: 0 4px 0 rgba(0, 0, 0, 0.1);
}

.d-btn:active {
    transform: translateY(4px);
    box-shadow: none;
    background: var(--vp-c-brand-soft);
}

.instructions {
    margin-top: 20px;
    color: var(--vp-c-text-3);
    font-size: 0.9rem;
}
</style>
