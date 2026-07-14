<script setup lang="ts">
import HomeHeroMathCanvas from './HomeHeroMathCanvas.vue'
</script>

<template>
  <div class="home-hero-info">
    <h1 class="home-hero-title" aria-label="Welcome to Develata's Space">
      <span class="home-hero-title__welcome" data-hero-glyph>Welcome to</span>
      <span class="home-hero-title__brand">
        <span class="home-hero-title__name" data-hero-glyph>Develata's</span>
        <span class="home-hero-title__space" data-hero-glyph>Space</span>
      </span>
    </h1>
    <HomeHeroMathCanvas />
  </div>
</template>

<style scoped>
.home-hero-info {
  --hero-ink: #24536a;
  --hero-level-1: #244f66;
  --hero-level-2: #2a596e;
  --hero-level-3: #306276;
  --hero-level-4: #376c80;
  --hero-level-5: #3f778a;
  --hero-path: #78d5d1;
  position: relative;
  min-width: 0;
}

.home-hero-title {
  position: relative;
  z-index: 0;
  display: flex;
  gap: 0.2em;
  align-items: baseline;
  margin: 0;
  color: var(--hero-ink);
  font-kerning: normal;
  font-synthesis: none;
  font-size: clamp(2.5rem, 6vw, 4rem);
  font-variant-ligatures: common-ligatures contextual;
  line-height: 1;
  letter-spacing: -0.045em;
  white-space: nowrap;
}

.home-hero-title__welcome,
.home-hero-title__name,
.home-hero-title__space {
  display: inline-block;
  color: var(--hero-ink);
}

.home-hero-title__welcome {
  font-weight: 600;
}

.home-hero-title__brand {
  display: inline-flex;
  gap: 0.2em;
  align-items: baseline;
}

.home-hero-title__name {
  font-weight: 660;
}

.home-hero-title__space {
  font-weight: 740;
  letter-spacing: -0.048em;
}

.home-hero-info.is-math-ready [data-hero-glyph] {
  animation: home-hero-ink-settle 1.6s cubic-bezier(0.22, 0.72, 0.24, 1) both;
}

:global(.dark .home-hero-info) {
  --hero-ink: #b9dce5;
  --hero-level-1: #77a7b7;
  --hero-level-2: #84b3c1;
  --hero-level-3: #91bfca;
  --hero-level-4: #9fcbd4;
  --hero-level-5: #add7dd;
  --hero-path: #83ddd6;
}

@keyframes home-hero-ink-settle {
  0% {
    opacity: 0.55;
  }

  48% {
    opacity: 0.86;
  }

  100% {
    opacity: 1;
  }
}

@media (max-width: 640px) {
  .home-hero-title {
    flex-direction: column;
    gap: 0.08em;
    align-items: flex-start;
    font-size: clamp(2.35rem, 10.2vw, 2.75rem);
  }

  .home-hero-title__brand {
    gap: 0.14em;
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-hero-info.is-math-ready [data-hero-glyph] {
    animation: none;
  }
}
</style>
