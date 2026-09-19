<!-- Shared semantic frame; exercise state and controls remain owned by each module. -->
<script setup lang="ts">
import { withBase } from 'vitepress';

defineProps<{
  title: string;
  enTitle: string;
  description: string;
  accent?: string;
  darkAccent?: string;
}>();
</script>

<template>
  <main
    class="training-shell"
    :style="{
      '--training-accent-light': accent ?? 'var(--vp-c-brand-1)',
      '--training-accent-dark': darkAccent ?? accent ?? 'var(--vp-c-brand-1)',
      '--training-primary-bg': accent ?? 'var(--vp-c-brand-1)',
    }"
  >
    <header class="training-heading">
      <a class="back-link" :href="withBase('/games/brain-training/')">← Cognitive Lab</a>
      <p class="training-eyebrow">Evidence-aware practice</p>
      <h1>{{ title }} <span>{{ enTitle }}</span></h1>
      <p class="training-description">{{ description }}</p>
    </header>

    <aside class="claim-boundary" aria-label="科学解释边界">
      <strong>Interpretation boundary</strong>
      <span>分数描述当前任务、设备与输入条件下的表现；不用于诊断，也不代表 IQ、前额叶功能或现实能力。</span>
    </aside>

    <div class="training-body">
      <slot />
    </div>
  </main>
</template>

<style scoped src="./TrainingShell.css"></style>
