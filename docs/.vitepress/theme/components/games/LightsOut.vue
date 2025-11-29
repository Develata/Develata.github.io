<script setup lang="ts">
import { ref, computed, onMounted } from 'vue' // 移除未使用的 nextTick
import confetti from 'canvas-confetti'

// --- 状态管理 ---
const mode = ref<'practice' | 'challenge'>('challenge')
const grid = ref<boolean[]>([])
const isWin = ref(false)
const isEditing = ref(false)

// 游戏数据
const level = ref(1)      // 闯关当前关卡 (N)
const customN = ref(5)    // 练习模式输入值
const activeN = ref(5)    // 练习模式实际生效值 (新增：防止输入时布局错乱)
const moves = ref(0)      // 当前局步数
const totalMoves = ref(0) // 闯关总步数

// --- 计算属性 ---
const isChallenge = computed(() => mode.value === 'challenge')
// 修复：使用 activeN 而不是 customN，确保只有按下回车/失焦后才更新布局
const size = computed(() => isChallenge.value ? level.value : activeN.value)

// 动态网格样式
const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${size.value}, 1fr)`,
  gap: size.value > 10 ? '2px' : '5px'
}))

// --- 核心逻辑 ---

// 初始化游戏
function initGame(keepProgress = false) {
  // 修复：处理小数和边界值，并同步到 activeN
  if (!isChallenge.value) {
    let n = Math.floor(customN.value) // 取整
    if (isNaN(n)) n = 5
    n = Math.max(2, Math.min(20, n))  // 限制范围 2-20
    activeN.value = n
    customN.value = n // 回填修正后的值到输入框
  }

  const s = size.value
  const len = s * s
  
  // 1. 重置基础状态
  grid.value = new Array(len).fill(false)
  isWin.value = false
  
  // 2. 步数重置逻辑
  if (!keepProgress && isChallenge.value) {
    level.value = 1
    totalMoves.value = 0
  }
  moves.value = 0

  // 3. 生成盘面
  if (isChallenge.value) {
    // 闯关：强制全亮 (N=4,9,14 等均有解)
    grid.value.fill(true)
  } else {
    // 练习：生成随机可解局
    if (!keepProgress) scramble(s)
  }
}

// 逆向打乱：保证必解
function scramble(s: number) {
  // 确保从全灭开始打乱
  grid.value.fill(false)
  
  const count = Math.max(5, s * 3)
  let last = -1
  for (let i = 0; i < count; i++) {
    let idx
    do { idx = Math.floor(Math.random() * s * s) } while (idx === last)
    toggle(idx, s)
    last = idx
  }
}

// 切换灯状态 (核心算法)
function toggle(idx: number, s: number) {
  const r = Math.floor(idx / s)
  const c = idx % s
  // 上下左右 + 自己
  const neighbors = [[0,0], [0,-1], [0,1], [-1,0], [1,0]]
  
  neighbors.forEach(([dr, dc]) => {
    const nr = r + dr, nc = c + dc
    if (nr >= 0 && nr < s && nc >= 0 && nc < s) {
      const t = nr * s + nc
      grid.value[t] = !grid.value[t]
    }
  })
}

// --- 交互处理 ---

function handleClick(idx: number) {
  if (isWin.value) return

  // 编辑模式：仅切换单点
  if (!isChallenge.value && isEditing.value) {
    grid.value[idx] = !grid.value[idx]
    if (navigator.vibrate) navigator.vibrate(5)
    return
  }

  // 游戏模式
  toggle(idx, size.value)
  moves.value++
  if (isChallenge.value) totalMoves.value++

  if (navigator.vibrate) navigator.vibrate(15)
  
  // 胜利判定：全灭 (全是 false)
  if (grid.value.every(v => !v)) {
    isWin.value = true
    fireConfetti()
    if (navigator.vibrate) navigator.vibrate([30, 50, 30])
  }
}

// 关卡控制
function setMode(m: 'practice' | 'challenge') {
  mode.value = m
  isEditing.value = false
  initGame()
}

function nextLevel() {
  if (level.value < 20) {
    level.value++
    initGame(true) // 保留总步数
  }
}

function applySize() {
  // 仅调用 initGame，具体的数值修正逻辑在 initGame 内部处理
  initGame()
}

function fireConfetti() {
  confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#fbbf24', '#ffffff'] })
}

onMounted(() => initGame())
</script>

<template>
  <div class="lo-container">
    <div class="tabs">
      <button :class="{ active: isChallenge }" @click="setMode('challenge')">🏰 闯关模式</button>
      <button :class="{ active: !isChallenge }" @click="setMode('practice')">🛠️ 自由练习</button>
    </div>

    <div class="panel">
      <div v-if="isChallenge" class="info-row">
        <div class="badge">Lv.{{ level }}</div>
        <div class="stats">
          <span>本关: <b>{{ moves }}</b></span>
          <span class="total">总计: <b>{{ totalMoves }}</b></span>
        </div>
      </div>

      <div v-else class="practice-row">
        <div class="input-wrap">
          <span>N:</span>
          <!-- 修复：使用 .lazy 修饰符或仅在 change 时触发，避免输入过程中频繁重置 -->
          <input 
            type="number" 
            v-model.number="customN" 
            @change="applySize" 
            @keydown.enter="applySize"
            min="2" 
            max="20"
          >
        </div>
        <div class="tools">
          <button class="tool-btn" :class="{ on: isEditing }" @click="isEditing = !isEditing">
            {{ isEditing ? '✏️ 编辑中' : '✏️ 编辑' }}
          </button>
          <template v-if="isEditing">
            <button class="tool-btn" @click="grid.fill(true)">全亮</button>
            <button class="tool-btn" @click="grid.fill(false)">全灭</button>
          </template>
          <button v-else class="tool-btn" @click="initGame()">重置</button>
        </div>
      </div>
    </div>

    <div class="board-wrap" :class="{ editing: isEditing }">
      <div class="board" :style="gridStyle">
        <div 
          v-for="(on, i) in grid" 
          :key="i" 
          class="cell" 
          :class="{ on }"
          @click="handleClick(i)"
        >
          <div class="bulb"></div>
        </div>
      </div>

      <div v-if="isWin" class="win-mask">
        <div class="win-box">
          <h2>🎉 完美熄灭!</h2>
          <p v-if="isChallenge && level < 20">下一关: {{ level + 1 }} × {{ level + 1 }}</p>
          <p v-else>挑战完成！</p>
          <button v-if="isChallenge && level < 20" class="btn-main" @click="nextLevel">下一关 ➜</button>
          <button v-else class="btn-main" @click="initGame()">再来一局</button>
        </div>
      </div>
    </div>
    
    <div v-if="isEditing" class="tip">💡 点击格子单独修改状态</div>
  </div>
</template>

<style scoped>
.lo-container {
  display: flex; flex-direction: column; align-items: center; gap: 15px;
  margin-top: 20px; font-family: sans-serif; user-select: none;
  width: 100%; max-width: 100vw;
}

/* 选项卡 */
.tabs {
  display: flex; background: var(--vp-c-bg-alt); padding: 4px; border-radius: 8px; gap: 5px;
  border: 1px solid var(--vp-c-divider);
}
.tabs button {
  padding: 6px 14px; border-radius: 6px; font-size: 0.9rem; font-weight: 500;
  color: var(--vp-c-text-2); transition: all 0.2s;
}
.tabs button.active { background: var(--vp-c-brand); color: white; }

/* 面板 */
.panel {
  width: 100%; max-width: 360px; padding: 12px 16px;
  background: var(--vp-c-bg-soft); border-radius: 12px;
  border: 1px solid var(--vp-c-divider);
}
.info-row { display: flex; justify-content: space-between; align-items: center; }
.badge { font-size: 1.2rem; font-weight: 800; color: var(--vp-c-brand); }
.stats { display: flex; gap: 12px; font-size: 0.9rem; color: var(--vp-c-text-2); }
.stats b { color: var(--vp-c-text-1); font-size: 1.1rem; }
.stats .total b { color: var(--vp-c-brand); }

.practice-row { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
.input-wrap { display: flex; align-items: center; gap: 5px; font-size: 0.9rem; font-weight: bold; }
.input-wrap input {
  width: 50px; padding: 4px; text-align: center; border-radius: 4px;
  border: 1px solid var(--vp-c-divider); background: var(--vp-c-bg);
}
.tools { display: flex; gap: 6px; }
.tool-btn {
  padding: 4px 10px; font-size: 0.8rem; border-radius: 4px;
  border: 1px solid var(--vp-c-divider); background: var(--vp-c-bg);
  transition: all 0.2s;
}
.tool-btn:hover { border-color: var(--vp-c-brand); }
.tool-btn.on { background: #f59e0b; color: white; border-color: #f59e0b; }

/* 棋盘 */
.board-wrap {
  position: relative; padding: 10px; border-radius: 12px;
  background: #222; border: 3px solid #333;
  box-shadow: 0 10px 30px rgba(0,0,0,0.4);
  transition: border-color 0.3s;
}
.board-wrap.editing { border-color: #f59e0b; }

.board { display: grid; width: 320px; height: 320px; }

/* 灯泡单元格 */
.cell {
  background: #3a3a3a; border-radius: 3px; cursor: pointer;
  position: relative; overflow: hidden; transition: all 0.1s;
  box-shadow: inset 0 0 4px rgba(0,0,0,0.8);
}
/* 亮灯样式：琥珀色高光 */
.cell.on {
  background: #fbbf24;
  box-shadow: 0 0 12px #fbbf24, inset 0 0 4px rgba(255,255,255,0.7);
  z-index: 1;
}
/* 内部高光点 */
.bulb {
  position: absolute; top: 15%; left: 15%; width: 30%; height: 30%;
  background: radial-gradient(circle, rgba(255,255,255,0.9), transparent 70%);
  border-radius: 50%; opacity: 0; transition: opacity 0.1s;
}
.cell.on .bulb { opacity: 1; }

/* 胜利界面 */
.win-mask {
  position: absolute; inset: 0; background: rgba(0,0,0,0.75);
  backdrop-filter: blur(3px); border-radius: 10px; z-index: 10;
  display: flex; justify-content: center; align-items: center;
  animation: fadeIn 0.3s;
}
.win-box {
  background: var(--vp-c-bg); padding: 20px; border-radius: 12px;
  text-align: center; border: 1px solid var(--vp-c-divider);
  box-shadow: 0 10px 20px rgba(0,0,0,0.5);
}
.btn-main {
  margin-top: 10px; padding: 8px 20px; border-radius: 6px;
  background: var(--vp-c-brand); color: white; font-weight: bold;
  animation: bounce 1s infinite;
}

.tip { font-size: 0.8rem; color: #f59e0b; margin-top: -10px; }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }

@media (max-width: 400px) {
  .board { width: 300px; height: 300px; }
  .panel, .header { width: 320px; }
}
</style>