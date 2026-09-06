<script setup lang="ts">
import { computed, provide, ref } from 'vue';
import type { DefaultTheme } from 'vitepress';
import NewsSidebarItem from './NewsSidebarItem.vue';
import { newsSidebarAccordionKey, newsSidebarActiveStateKey, type AccordionController } from './newsSidebarAccordion';
import { normalizeSidebarPath } from '../sidebar/normalizePath';

const props = defineProps<{
  items: DefaultTheme.SidebarItem[];
  activePath?: string;
}>();

const activeKey = ref<string | null>(resolveDefaultActiveKey());
const accordion: AccordionController = {
  activeKey,
  setActiveKey: (key) => {
    activeKey.value = key;
  },
};

provide(newsSidebarAccordionKey, accordion);
provide(newsSidebarActiveStateKey, computed(() => resolveActiveState(props.items, normalizeSidebarPath(props.activePath))));

function resolveDefaultActiveKey(): string | null {
  const index = props.items.findIndex((item) => item.items?.length && item.collapsed === false);
  if (index < 0) return null;
  const item = props.items[index];
  return `${index}:${item.text ?? 'item'}`;
}

function resolveActiveState(items: DefaultTheme.SidebarItem[], activePath: string) {
  const activeKeys = new Set<string>();
  let exactActiveKey: string | null = null;

  const visit = (nodes: DefaultTheme.SidebarItem[], prefix = ''): boolean => {
    let hasMatch = false;
    nodes.forEach((node, index) => {
      const key = `${prefix}${index}:${node.text ?? 'item'}`;
      const isExactMatch = normalizeSidebarPath(node.link) === activePath;
      const childMatch = node.items?.length ? visit(node.items, `${key}/`) : false;
      if (isExactMatch) exactActiveKey = key;
      if (isExactMatch || childMatch) {
        activeKeys.add(key);
        hasMatch = true;
      }
    });
    return hasMatch;
  };

  visit(items);
  return { activeKeys, exactActiveKey };
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
