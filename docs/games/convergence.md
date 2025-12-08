---
layout: page
title: "Convergence: The Gradient War"
sidebar: false
---

# 🛰️ Convergence: The Gradient War

<div class="game-wrapper game-wrapper--convergence">
  <ConvergenceGame />
</div>

<style>
.game-wrapper {
  /* 桌面端：容器寬度跟隨頁面，高度完全由內容決定 */
  width: 100%;
  max-width: 100%; /* 移除限制，让它尽可能宽 */
  margin: 0 auto;
  padding: 0;
}

.game-wrapper--convergence .game-container {
  position: relative;
  width: 100%;
  /* 只負責 16:9，內部高度不再疊加限制 */
  aspect-ratio: 16 / 9;
  background: #02030b;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
}

@media (max-width: 960px) {
  /* 平板 / 橫屏手機：仍保留 16:9，比頁面更高時通過下滑查看完整內容 */
  .game-wrapper {
    width: 100vw;
    margin-left: calc(50% - 50vw);
  }

  .game-wrapper :deep(.game-container) {
    /* 移动端允许组件自适应为 9:16 */
    aspect-ratio: auto; 
    border-radius: 0;
  }
}

</style>