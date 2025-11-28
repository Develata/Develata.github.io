<script setup lang="ts">
import { withBase } from 'vitepress'

// 游戏数据列表
const games = [
  {
    id: 'tictactoe',
    title: '井字棋',
    enTitle: 'Tic Tac Toe',
    desc: '经典的逻辑对弈，挑战不可战胜的算法（或者只是单纯的菜鸡互啄）。',
    icon: '⭕',
    link: '/games/tictactoe',
    tag: 'Logic',
    color: '#3498db'
  },
  {
    id: 'gomoku',
    title: '五子棋',
    enTitle: 'Gomoku',
    desc: '在 nxn 的棋盘上体验纯粹的策略博弈，AI 具备较高的防守反击能力。',
    icon: '⚫',
    link: '/games/gomoku',
    tag: 'Strategy',
    color: '#8b5cf6' // 紫色
  },
  {
    id: 'life',
    title: '康威生命游戏',
    enTitle: 'Game of Life',
    desc: '零玩家游戏，观察细胞在数学规则下的繁衍与生灭。',
    icon: '🧬',
    link: '/games/gameoflife',
    tag: 'Simulation',
    color: '#10b981', 
  },
  {
    id: 'minesweeper',
    title: '扫雷',
    enTitle: 'Minesweeper',
    desc: '在数字的雷区中寻找真相，致敬 Windows 经典。',
    icon: '💣',
    link: '#',
    tag: 'Puzzle',
    color: '#f59e0b',
    disabled: true
  }
]
</script>

<template>
  <div class="game-hub">
    <div class="hub-header">
      <h1 class="glitch-title">Game Lab</h1>
      <p class="subtitle">代码构建的数字游乐场</p>
    </div>

    <div class="game-grid">
      <a 
        v-for="game in games" 
        :key="game.id" 
        :href="game.disabled ? 'javascript:void(0)' : withBase(game.link)"
        class="game-card"
        :class="{ 'is-disabled': game.disabled }"
      >
        <div class="card-content">
          <div class="card-top">
            <span class="icon-box">{{ game.icon }}</span>
            <span class="tag" :style="{ color: game.color, borderColor: game.color + '40', backgroundColor: game.color + '10' }">
              {{ game.tag }}
            </span>
          </div>
          
          <h3 class="game-title">
            {{ game.title }}
            <span class="game-en-title">{{ game.enTitle }}</span>
          </h3>
          
          <p class="game-desc">{{ game.desc }}</p>
          
          <div class="card-footer">
            <span v-if="game.disabled" class="status-text">🚧 开发中...</span>
            <span v-else class="play-btn">Start Game ➜</span>
          </div>
        </div>
        
        <div class="card-bg-decoration" :style="{ background: game.color }"></div>
      </a>
    </div>
  </div>
</template>

<style scoped>
/* 容器布局 */
.game-hub {
  max-width: 1100px;
  margin: 0 auto;
  padding: 40px 20px;
}

/* 头部样式 */
.hub-header {
  text-align: center;
  margin-bottom: 60px;
  animation: fadeInDown 0.8s ease-out;
}

.glitch-title {
  font-size: 3.5rem;
  font-weight: 800;
  background: -webkit-linear-gradient(315deg, var(--vp-c-brand) 25%, var(--vp-c-brand-2));
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 10px;
  letter-spacing: -1px;
  line-height: 1.2;
}

.subtitle {
  font-size: 1.2rem;
  color: var(--vp-c-text-2);
  font-weight: 500;
}

/* 网格布局 */
.game-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}
@media (max-width: 600px) {
  .game-hub {
    padding: 20px 16px; /* 减小手机端边距 */
  }
  
  .glitch-title {
    font-size: 2.5rem; /* 标题字号调小 */
  }
  
  .game-card:not(.is-disabled):hover {
    /* 手机端取消悬停上浮效果，因为手机没有 hover */
    transform: none; 
  }
}
/* 卡片核心样式 */
.game-card {
  position: relative;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  overflow: hidden;
  text-decoration: none !important;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  display: flex;
  flex-direction: column;
}

.game-card:not(.is-disabled):hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.1);
  border-color: var(--vp-c-brand-1);
}

.game-card:not(.is-disabled):hover .play-btn {
  color: var(--vp-c-brand-1);
  transform: translateX(5px);
}

/* 卡片内容区 */
.card-content {
  padding: 24px;
  position: relative;
  z-index: 2;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.icon-box {
  font-size: 2.5rem;
  line-height: 1;
}

.tag {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 20px;
  border-width: 1px;
  border-style: solid;
}

.game-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
  margin: 0 0 10px 0;
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}

.game-en-title {
  font-size: 0.9rem;
  color: var(--vp-c-text-3);
  font-weight: 400;
  margin-top: 2px;
}

.game-desc {
  font-size: 0.95rem;
  color: var(--vp-c-text-2);
  line-height: 1.6;
  margin-bottom: 20px;
  flex-grow: 1;
}

.card-footer {
  margin-top: auto;
  padding-top: 15px;
  border-top: 1px solid var(--vp-c-divider);
  display: flex;
  justify-content: flex-end;
}

.play-btn {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--vp-c-text-2);
  transition: all 0.3s;
}

/* 禁用状态 */
.is-disabled {
  opacity: 0.6;
  cursor: not-allowed;
  filter: grayscale(0.8);
}

.card-bg-decoration {
  position: absolute;
  top: -50px;
  right: -50px;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  opacity: 0.05;
  filter: blur(20px);
  z-index: 1;
  transition: all 0.5s;
}

.game-card:hover .card-bg-decoration {
  transform: scale(1.5);
  opacity: 0.1;
}

@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>