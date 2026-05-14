<script setup lang="ts">
import { provide, ref } from 'vue';
import type { DefaultTheme } from 'vitepress';
import NewsSidebarItem from './NewsSidebarItem.vue';
import { newsSidebarAccordionKey, type AccordionController } from './newsSidebarAccordion';

const props = defineProps<{
  items: DefaultTheme.SidebarItem[];
}>();

const activeKey = ref<string | null>(resolveDefaultActiveKey());
const accordion: AccordionController = {
  activeKey,
  setActiveKey: (key) => {
    activeKey.value = key;
  },
};

provide(newsSidebarAccordionKey, accordion);

function resolveDefaultActiveKey(): string | null {
  const index = props.items.findIndex((item) => item.items?.length && item.collapsed === false);
  if (index < 0) return null;
  const item = props.items[index];
  return `${index}:${item.text ?? 'item'}`;
}
</script>

<template>
  <div class="NewsSidebarGroup">
    <NewsSidebarItem
      v-for="(item, index) in items"
      :key="item.text"
      :item="item"
      :depth="0"
      :item-key="`${index}:${item.text ?? 'item'}`"
    />
  </div>
</template>
