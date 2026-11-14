<template>
  <section class="buff-panel">
    <header>
      <span>算子奖励</span>
      <small v-if="buffs.length === 0">击败敌人以触发三选一</small>
    </header>

    <div v-if="buffs.length === 0" class="empty">
      <p>暂无奖励。</p>
    </div>
    <div v-else class="buff-grid">
      <button
        v-for="buff in buffs"
        :key="buff.id"
        class="buff-card"
        @click="handleSelect(buff.id)"
      >
        <strong>{{ buff.label }}</strong>
        <span>{{ buff.description }}</span>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { BuffDefinition, BuffId } from '../core/types';

const props = defineProps<{ buffs: BuffDefinition[] }>();
const emit = defineEmits<{ (e: 'select', id: BuffId): void }>();

const handleSelect = (id: BuffId) => {
  emit('select', id);
};
</script>

<style scoped>
.buff-panel {
  background: rgba(8, 10, 24, 0.85);
  border: 1px solid rgba(0, 255, 204, 0.25);
  padding: 16px;
  color: #d8fff3;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: auto;
  flex: 1;
  min-height: 0;
}

header {
  display: flex;
  justify-content: space-between;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-size: 0.85rem;
}

.empty {
  border: 1px dashed rgba(255, 255, 255, 0.2);
  padding: 12px;
  text-align: center;
  font-size: 0.8rem;
  color: rgba(216, 255, 243, 0.7);
}

.buff-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 10px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;
}

.buff-card {
  background: rgba(3, 12, 20, 0.85);
  border: 1px solid rgba(0, 255, 204, 0.3);
  color: #d8fff3;
  padding: 10px;
  text-align: left;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: border-color 0.2s ease, transform 0.2s ease;
}

.buff-card strong {
  letter-spacing: 0.5px;
}

.buff-card span {
  font-size: 0.75rem;
  color: rgba(216, 255, 243, 0.8);
}

.buff-card:hover {
  border-color: #00ffcc;
  transform: translateY(-2px);
}
</style>
