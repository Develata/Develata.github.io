<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{ enabled: boolean; lead: number; contacts: number; stopped: boolean; distance: number }>()
defineEmits<{ toggle: [] }>()
const gap = computed(() => {
  const metres = Math.abs(props.lead).toFixed(1)
  if (props.stopped) return `AI 已停止 · 相距 ${metres} m`
  if (Math.abs(props.lead) < 0.05) return '并驾齐驱 · 0.0 m'
  return props.lead > 0 ? `↑ AI 领先 ${metres} m` : `↓ 你领先 ${metres} m`
})
</script>
<template>
  <div class="nr-rival">
    <button class="nr-ghost-toggle" :aria-pressed="enabled" aria-label="显示 AI 残影" @click="$emit('toggle')">
      <i aria-hidden="true"></i>AI 残影 <span>{{ enabled ? '开' : '关' }}</span>
    </button>
    <div v-if="enabled" class="nr-rival-gap">{{ gap }}</div>
    <div v-if="enabled && contacts" class="nr-rival-contact">AI 碰撞 {{ contacts }} 次</div>
    <span class="nr-distance">已跑 {{ Math.floor(distance).toLocaleString('en-US') }} m</span>
  </div>
</template>
<style scoped>
.nr-rival { position:absolute; right:calc(var(--nr-safe-right) + var(--nr-hud-gap));
  top:calc(var(--nr-safe-top) + var(--nr-hud-gap) + 54px); text-align:right;
  color:#e5f9fa; font-size:11px; font-variant-numeric:tabular-nums; pointer-events:none; }
.nr-ghost-toggle { display:inline-flex; gap:7px; align-items:center; min-height:36px;
  border:1px solid #a0dce655; border-radius:4px; background:#16313dd9; color:#e5f9fa;
  padding:6px 10px; pointer-events:auto; }
.nr-ghost-toggle i { width:6px; height:6px; border-radius:50%; background:#70efff; }
.nr-ghost-toggle[aria-pressed="false"] i { background:#99a7ad; }
.nr-ghost-toggle span { opacity:.7; font-size:10px; }
.nr-rival-gap,.nr-rival-contact { margin-top:4px; padding:3px 7px; border-radius:3px; background:#16313dd9; }
.nr-rival-contact { color:#ffe0b5; }
.nr-distance { display:block; margin-top:6px; text-shadow:0 1px 4px #123; }
</style>
