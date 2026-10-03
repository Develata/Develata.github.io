<template>
  <section class="brain-training-notes" aria-label="解释边界与研究依据">
    <slot />
  </section>
</template>

<style>
.brain-training-notes {
  width: min(100%, 920px);
  margin: 0 auto;
  padding: 32px 20px 72px;
  border-top: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-2);
}

.brain-training-notes > :first-child {
  margin-top: 0;
}

.brain-training-notes h2 {
  margin: 0 0 18px;
  border: 0;
  color: var(--vp-c-text-1);
  font-size: clamp(1.35rem, 3vw, 1.75rem);
  letter-spacing: -0.02em;
}

.brain-training-notes h3 {
  margin: 30px 0 10px;
  color: var(--vp-c-text-1);
  font-size: 1rem;
}

.brain-training-notes p,
.brain-training-notes li {
  max-width: 76ch;
  font-size: 0.94rem;
  line-height: 1.78;
}

.brain-training-notes ul {
  max-width: 76ch;
  margin: 14px 0 0;
  padding-left: 1.25rem;
}

.brain-training-notes a {
  overflow-wrap: anywhere;
}

@media (max-width: 640px) {
  .brain-training-notes {
    padding: 26px 14px 52px;
  }
}
</style>
