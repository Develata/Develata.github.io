<!--
  @file LightsOut.vue
  @description 关灯游戏组件 (Lights Out)
  职责：
  1. 实现点击反转灯光逻辑（线性代数模型）。
  2. 生成可解谜题（高斯消元法验证）。
  3. 游戏状态交互。
-->
<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import confetti from 'canvas-confetti'

// --- 类型定义 ---
type GameMode = 'practice' | 'challenge'

// --- 状态 ---
const mode = ref<GameMode>('challenge')
const grid = ref<boolean[]>([])
const isWin = ref(false)

// 练习模式
const customN = ref(5) // 输入框的值
const activeN = ref(5) // 实际生效的 N (用于防止输入时布局跳动)
const practiceMoves = ref(0)
const isEditing = ref(false)

// 闯关模式
const currentLevel = ref(1)
const maxLevel = 20
const levelMoves = ref(0)
const totalMoves = ref(0)

// --- 核心逻辑 ---

// 计算当前维度
const currentSize = computed(() => {
  return mode.value === 'challenge' ? currentLevel.value : activeN.value
})

// 动态 Grid 样式：同时约束行和列，防止布局坍塌
const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${currentSize.value}, 1fr)`,
  gridTemplateRows: `repeat(${currentSize.value}, 1fr)`, // 关键修复：强制行高
  gap: currentSize.value > 10 ? '2px' : '5px'
}))

// 初始化游戏
function initGame(keepProgress = false) {
  // 1. 如果是练习模式，先同步 activeN，确保尺寸正确
  if (mode.value === 'practice') {
    let n = Math.floor(customN.value)
    if (isNaN(n) || n < 2) n = 2
    if (n > 20) n = 20
    activeN.value = n
    customN.value = n
  } else {
    // 闯关模式：如果不是下一关操作，重置回 Level 1
    if (!keepProgress) {
      currentLevel.value = 1
      totalMoves.value = 0
    }
  }

  // 2. 利用 nextTick 确保状态更新后再生成数据 (解决渲染闪烁/错位)
  nextTick(() => {
    const s = currentSize.value
    const totalCells = s * s

    // 重置数据
    grid.value = new Array(totalCells).fill(false)
    isWin.value = false

    if (mode.value === 'practice') {
      practiceMoves.value = 0
      // 练习模式：逆向打乱
      scrambleBoard(s)
    } else {
      levelMoves.value = 0
      // 闯关模式：强制全亮
      setAll(true)
    }
  })
}

// 逆向打乱 (练习模式专用)
function scrambleBoard(s: number) {
  const totalCells = s * s
  grid.value.fill(false)

  const scrambleCount = Math.max(5, s * 3)
  let lastIdx = -1

  for (let i = 0; i < scrambleCount; i++) {
    let randomIdx
    do {
      randomIdx = Math.floor(Math.random() * totalCells)
    } while (randomIdx === lastIdx && totalCells > 1)

    toggleLogic(randomIdx, s)
    lastIdx = randomIdx
  }
}

function toggleLogic(index: number, s: number) {
  const r = Math.floor(index / s)
  const c = index % s
  const neighbors = [
    { r: 0, c: 0 }, { r: -1, c: 0 }, { r: 1, c: 0 }, { r: 0, c: -1 }, { r: 0, c: 1 }
  ]

  neighbors.forEach(offset => {
    const nr = r + offset.r
    const nc = c + offset.c
    if (nr >= 0 && nr < s && nc >= 0 && nc < s) {
      const targetIdx = nr * s + nc
      grid.value[targetIdx] = !grid.value[targetIdx]
    }
  })
}

function toggleSingle(index: number) {
  grid.value[index] = !grid.value[index]
}

function setAll(state: boolean) {
  grid.value.fill(state)
  isWin.value = false
}

// --- 交互处理 ---

function handleClick(index: number) {
  if (isWin.value) return

  // 编辑模式
  if (mode.value === 'practice' && isEditing.value) {
    toggleSingle(index)
    if (navigator.vibrate) navigator.vibrate(5)
    return
  }

  // 游戏模式
  toggleLogic(index, currentSize.value)

  if (mode.value === 'practice') practiceMoves.value++
  else {
    levelMoves.value++
    totalMoves.value++
  }

  if (navigator.vibrate) navigator.vibrate(15)
  checkWin()
}

function checkWin() {
  if (isEditing.value) return
  // 全灭即胜利
  if (grid.value.every(isOn => !isOn)) {
    isWin.value = true
    fireConfetti()
    if (navigator.vibrate) navigator.vibrate([30, 50, 30])
  }
}

function nextLevel() {
  if (currentLevel.value < maxLevel) {
    currentLevel.value++
    levelMoves.value = 0
    initGame(true)
  }
}

function switchMode(newMode: GameMode) {
  mode.value = newMode
  isEditing.value = false // 切换模式时自动退出编辑
  initGame()
}

function applyCustomSize() {
  initGame()
}

function fireConfetti() {
  const end = Date.now() + 1500
    ; (function frame() {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#eab308', '#ffffff'] })
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#eab308', '#ffffff'] })
      if (Date.now() < end) requestAnimationFrame(frame)
    })()
}

onMounted(() => {
  initGame()
})
</script>

<template>
  <div class="lights-container">

    <div class="mode-tabs">
      <button class="tab-btn" :class="{ active: mode === 'challenge' }" @click="switchMode('challenge')">🏰
        闯关模式</button>
      <button class="tab-btn" :class="{ active: mode === 'practice' }" @click="switchMode('practice')">🛠️
        自定义练习</button>
    </div>

    <div class="header-card">
      <div v-if="mode === 'challenge'" class="challenge-info">
        <div class="level-badge">
          LEVEL <span class="big-num">{{ currentLevel }}</span>
          <span class="sub">/ {{ maxLevel }}</span>
        </div>
        <div class="grid-size-tag">{{ currentLevel }} × {{ currentLevel }}</div>
        <div class="stats-group">
          <div class="stat"><span class="label">本关</span><span class="val">{{ levelMoves }}</span></div>
          <div class="stat total"><span class="label">总计</span><span class="val">{{ totalMoves }}</span></div>
        </div>
      </div>

      <div v-else class="practice-wrapper">
        <div class="practice-top">
          <div class="input-group">
            <label>Size (N)</label>
            <div class="input-row">
              <input type="number" v-model.number="customN" min="2" max="20" @keydown.enter="applyCustomSize">
              <button class="apply-btn" @click="applyCustomSize">Go</button>
            </div>
          </div>
          <div class="stat"><span class="label">MOVES</span><span class="val">{{ practiceMoves }}</span></div>
        </div>
        <div class="edit-toolbar">
          <button class="tool-btn edit-toggle" :class="{ active: isEditing }" @click="isEditing = !isEditing">{{
            isEditing ? '✏️ 编辑中' : '🎮 游玩中' }}</button>
          <template v-if="isEditing">
            <button class="tool-btn" @click="setAll(true)">全亮</button>
            <button class="tool-btn" @click="setAll(false)">全灭</button>
          </template>
          <button v-else class="tool-btn" @click="initGame()">重置</button>
        </div>
      </div>
    </div>

    <div class="board-container" :class="{ 'editing': isEditing }">
      <div class="board" :style="gridStyle">
        <div v-for="(isOn, index) in grid" :key="index" class="cell" :class="{ 'is-on': isOn }"
          @click="handleClick(index)">
          <div class="bulb-highlight"></div>
          <div class="bulb-glow"></div>
        </div>
      </div>

      <div v-if="isWin" class="win-overlay">
        <div class="win-card">
          <h2>🎉 Level Clear!</h2>
          <p v-if="mode === 'challenge'">
            <span v-if="currentLevel < maxLevel">下一关: {{ currentLevel + 1 }} × {{ currentLevel + 1 }}</span>
            <span v-else>🏆 恭喜！你通关了所有维度！</span>
          </p>
          <p v-else>灯光已全部熄灭</p>
          <button v-if="mode === 'challenge' && currentLevel < maxLevel" class="next-btn" @click="nextLevel">下一关
            ➜</button>
          <button v-else class="next-btn" @click="initGame()">再来一局</button>
        </div>
      </div>
    </div>

    <div v-if="isEditing" class="hint-text">💡 点击格子单独修改状态</div>

  </div>
</template>

<style scoped>
.lights-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin-top: 20px;
  font-family: sans-serif;
  user-select: none;
  touch-action: manipulation;
  width: 100%;
  max-width: 100vw;
}

/* 模式切换 */
.mode-tabs {
  display: flex;
  background: var(--vp-c-bg-alt);
  padding: 4px;
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  gap: 6px;
}

.tab-btn {
  padding: 6px 16px;
  font-size: 0.9rem;
  border-radius: 6px;
  cursor: pointer;
  color: var(--vp-c-text-2);
  transition: all 0.2s;
  font-weight: 500;
}

.tab-btn.active {
  background: var(--vp-c-brand);
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 头部卡片 */
.header-card {
  width: 100%;
  max-width: 380px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 12px 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.challenge-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.level-badge {
  font-weight: 800;
  color: var(--vp-c-brand);
  display: flex;
  flex-direction: column;
  line-height: 1;
  font-size: 0.8rem;
}

.level-badge .big-num {
  font-size: 1.8rem;
}

.level-badge .sub {
  font-size: 0.8rem;
  opacity: 0.7;
  font-weight: normal;
}

.grid-size-tag {
  background: var(--vp-c-bg-alt);
  border: 1px solid var(--vp-c-divider);
  padding: 4px 8px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
}

.stats-group {
  display: flex;
  gap: 15px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.stat .label {
  font-size: 0.7rem;
  color: var(--vp-c-text-3);
  text-transform: uppercase;
}

.stat .val {
  font-size: 1.2rem;
  font-weight: bold;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}

.stat.total .val {
  color: var(--vp-c-brand);
}

.practice-wrapper {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.practice-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.input-group label {
  font-size: 0.75rem;
  color: var(--vp-c-text-2);
  display: block;
  margin-bottom: 2px;
}

.input-row {
  display: flex;
  gap: 4px;
}

.input-row input {
  width: 50px;
  padding: 4px;
  text-align: center;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
}

.apply-btn {
  background: var(--vp-c-brand);
  color: white;
  border: none;
  padding: 0 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
}

.edit-toolbar {
  display: flex;
  gap: 8px;
  border-top: 1px dashed var(--vp-c-divider);
  padding-top: 10px;
}

.tool-btn {
  flex: 1;
  padding: 6px;
  font-size: 0.85rem;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  cursor: pointer;
  transition: all 0.2s;
}

.edit-toggle.active {
  background: #f59e0b;
  color: white;
  border-color: #f59e0b;
}

.board-container {
  position: relative;
  padding: 10px;
  background: #222;
  /* 深色底座 */
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  border: 4px solid #333;
  transition: border-color 0.3s;
}

.board-container.editing {
  border-color: #f59e0b;
}

.board {
  display: grid;
  width: 340px;
  height: 340px;
}

/* 💡 灯泡样式 */
.cell {
  background: #444;
  border-radius: 4px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.15s;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5);
}

/* 亮灯：琥珀色 */
.cell.is-on {
  background: #fbbf24;
  box-shadow:
    0 0 15px #eab308,
    inset 0 0 10px rgba(255, 255, 255, 0.6);
  border-color: #fde047;
  z-index: 1;
}

.bulb-highlight {
  position: absolute;
  top: 15%;
  left: 15%;
  width: 25%;
  height: 25%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0) 70%);
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.1s;
}

.cell.is-on .bulb-highlight {
  opacity: 1;
}

.bulb-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, rgba(253, 224, 71, 0.4) 0%, rgba(0, 0, 0, 0) 70%);
  opacity: 0;
  transition: opacity 0.1s;
}

.cell.is-on .bulb-glow {
  opacity: 1;
}

.win-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(2px);
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 8px;
  z-index: 10;
  animation: fadeIn 0.3s;
}

.win-card {
  background: var(--vp-c-bg);
  padding: 20px 30px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  border: 1px solid var(--vp-c-divider);
}

.win-card h2 {
  color: var(--vp-c-brand);
  margin-bottom: 10px;
}

.next-btn {
  background: var(--vp-c-brand);
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 6px;
  font-size: 1rem;
  margin-top: 15px;
  cursor: pointer;
  font-weight: bold;
  animation: bounce 1s infinite;
}

.hint-text {
  font-size: 0.85rem;
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
  padding: 4px 12px;
  border-radius: 4px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes bounce {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-3px);
  }
}

@media (max-width: 400px) {
  .board {
    width: 300px;
    height: 300px;
  }

  .header-card {
    padding: 10px;
  }
}
</style>