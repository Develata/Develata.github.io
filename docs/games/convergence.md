---
layout: page
title: "Convergence: The Gradient War"
sidebar: false
---

[//]: # (convergence page shell)

<div class="game-wrapper game-wrapper--convergence">
  <ConvergenceGame />
</div>

<style>
.game-wrapper {
  width: 100%;
  margin: 0 auto;
  padding: 0;
}

.game-wrapper--convergence {
  width: 100%;
}

.game-wrapper--convergence :deep(.game-container) {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
}

@media (min-width: 961px) {
  .game-wrapper--convergence {
    --convergence-max-height: min(78vh, calc(100vh - var(--vp-nav-height) - 3rem));
    position: relative;
    left: 50%;
    right: 50%;
    margin-left: -50vw;
    margin-right: -50vw;
    width: 100vw;
    max-width: 100vw;
    display: flex;
    justify-content: center;
  }

  .game-wrapper--convergence :deep(.game-container) {
    width: min(calc(100vw - 2rem), calc(var(--convergence-max-height) * 16 / 9));
    max-height: var(--convergence-max-height);
  }
}

@media (max-width: 960px) {
  .game-wrapper {
    width: 100vw;
    margin-left: calc(50% - 50vw);
  }

  .game-wrapper--convergence {
    width: 100vw;
  }

  .game-wrapper :deep(.game-container) {
    width: 100%;
    max-height: none;
    aspect-ratio: auto;
    border-radius: 0;
  }
}

</style>
