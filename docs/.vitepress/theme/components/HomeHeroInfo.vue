<template>
  <div class="home-hero-info">
    <h1 class="home-hero-title" aria-label="Develata's Space">
      <span class="home-hero-title__name">Develata's</span>
      <span class="home-hero-title__space">Space</span>
    </h1>

    <p class="home-hero-tagline">
      <span>Mathematics <span class="home-hero-tagline__dot" aria-hidden="true">·</span>&nbsp;</span>
      <span>Code <span class="home-hero-tagline__dot" aria-hidden="true">·</span>&nbsp;</span>
      <span>Books <span class="home-hero-tagline__dot" aria-hidden="true">·</span>&nbsp;</span>
      <span>A little play</span>
    </p>
  </div>
</template>

<style scoped>
.home-hero-info {
  min-width: 0;
}

.home-hero-title {
  display: flex;
  gap: 0.18em;
  align-items: baseline;
  margin: 0;
  color: var(--vp-c-text-1);
  font-size: clamp(2.5rem, 6vw, 4rem);
  line-height: 1;
  letter-spacing: -0.045em;
  white-space: nowrap;
}

.home-hero-title__name {
  font-weight: 660;
}

.home-hero-title__space {
  color: #3568c7;
  font-weight: 780;
  letter-spacing: -0.055em;
}

@supports ((-webkit-background-clip: text) or (background-clip: text)) {
  .home-hero-title__space {
    background-image: linear-gradient(
      105deg,
      #3159b7 0%,
      #4a83df 37%,
      #439ba6 50%,
      #4a83df 63%,
      #3159b7 100%
    );
    background-position: 100% 50%;
    background-size: 220% 100%;
    color: transparent;
    -webkit-background-clip: text;
    background-clip: text;
    animation: home-hero-specular 2.4s cubic-bezier(0.22, 0.72, 0.24, 1) 280ms both;
  }
}

.home-hero-tagline {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 0.22rem;
  align-items: baseline;
  margin: 18px 0 0;
  color: var(--vp-c-text-2);
  font-size: clamp(0.98rem, 1.5vw, 1.18rem);
  font-weight: 430;
  line-height: 1.4;
  letter-spacing: -0.012em;
}

.home-hero-tagline__dot {
  margin-left: 0.48rem;
  color: color-mix(in srgb, var(--vp-c-brand-1) 44%, var(--vp-c-text-3));
  font-weight: 650;
}

:global(.dark .home-hero-title__space) {
  color: #aab8ff;
}

@supports ((-webkit-background-clip: text) or (background-clip: text)) {
  :global(.dark .home-hero-title__space) {
    background-image: linear-gradient(
      105deg,
      #6f92ee 0%,
      #b8c4ff 38%,
      #76d2d1 50%,
      #b8c4ff 62%,
      #6f92ee 100%
    );
    color: transparent;
  }
}

@keyframes home-hero-specular {
  from {
    background-position: 100% 50%;
  }

  to {
    background-position: 0% 50%;
  }
}

@media (max-width: 640px) {
  .home-hero-title {
    gap: 0.14em;
    font-size: clamp(2.35rem, 10.2vw, 2.75rem);
  }

  .home-hero-tagline {
    max-width: 20rem;
    margin-top: 14px;
    font-size: 0.98rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-hero-title__space {
    background-position: 0% 50%;
    animation: none;
  }
}
</style>
