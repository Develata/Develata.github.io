<template>
  <section class="action-log" :class="{ collapsed: collapsed }">
    <header @click="$emit('toggle')">
      <div class="header-left">
        <span class="toggle-icon">{{ collapsed ? '▶' : '▼' }}</span>
        <span>行动记录</span>
      </div>
      <small v-if="!collapsed">最近 {{ entries.length }} 条</small>
    </header>
    <ul v-show="!collapsed">
      <li v-for="entry in entries" :key="`${entry.turn}-${entry.summary}`">
        <span class="turn">#{{ entry.turn }}</span>
        <span class="summary">{{ entry.summary }}</span>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import type { ActionLogEntry } from '../core/types';

defineProps<{
  entries: ActionLogEntry[];
  collapsed: boolean;
}>();

defineEmits<{ (e: 'toggle'): void }>();
</script>

<style scoped>
.action-log {
  background: rgba(4, 6, 14, 0.9);
  border: 1px solid rgba(0, 255, 204, 0.25);
  color: #d8fff3;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: auto;
  flex: 1;
  min-height: 0;
  transition: flex 0.3s ease, min-height 0.3s ease;
}

.action-log.collapsed {
  flex: 0 0 auto;
  min-height: auto;
  gap: 0;
  padding-bottom: 10px;
}

header {
  display: flex;
  justify-content: space-between;
  text-transform: uppercase;
  font-size: 0.8rem;
  letter-spacing: 1px;
  cursor: pointer;
  user-select: none;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toggle-icon {
  font-size: 0.7rem;
  color: #00ffcc;
}

ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.78rem;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 6px;
}

li {
  display: flex;
  gap: 10px;
  align-items: baseline;
}

.turn {
  color: #00ffcc;
  font-weight: 600;
}

.summary {
  color: rgba(216, 255, 243, 0.85);
}
</style>
