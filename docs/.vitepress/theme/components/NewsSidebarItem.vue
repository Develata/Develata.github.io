<script setup lang="ts">
import { VPLink } from 'vitepress/theme';
import { computed, inject, provide, ref, watch } from 'vue';
import type { DefaultTheme } from 'vitepress';
import { newsSidebarAccordionKey, newsSidebarActiveStateKey } from './newsSidebarAccordion';

const props = defineProps<{
  item: DefaultTheme.SidebarItem;
  depth: number;
  itemKey: string;
}>();

const collapsed = ref(!!props.item.collapsed);
const parentAccordion = inject(newsSidebarAccordionKey, null);
const activeState = inject(newsSidebarActiveStateKey, null);
const activeTopLevelKey = ref<string | null>(null);
const accordion = parentAccordion ?? {
  activeKey: activeTopLevelKey,
  setActiveKey: (key: string | null) => {
    activeTopLevelKey.value = key;
  },
};
const childActiveKey = ref(resolveDefaultChildKey());
const childAccordion = {
  activeKey: childActiveKey,
  setActiveKey: (key: string | null) => {
    childActiveKey.value = key;
  },
};

provide(newsSidebarAccordionKey, childAccordion);

watch(() => props.item.collapsed, (next) => {
  collapsed.value = !!next;
}, { immediate: true });

const hasChildren = computed(() => !!props.item.items?.length);
const isLink = computed(() => !!props.item.link);
const isExpandableTrigger = computed(() => hasChildren.value && !isLink.value && props.item.collapsed != null);
const isActive = computed(() => activeState?.value.exactActiveKey === props.itemKey);
const hasActive = computed(() => activeState?.value.activeKeys.has(props.itemKey) ?? false);
const classes = computed(() => [
  `level-${props.depth}`,
  { collapsed: collapsed.value, collapsible: props.item.collapsed != null, 'is-link': isLink.value, 'is-active': isActive.value, 'has-active': hasActive.value },
]);
const headingTag = computed(() => (!hasChildren.value ? 'p' : `h${Math.min(props.depth + 2, 6)}`));
const isAccordionItem = computed(() => hasChildren.value && props.item.collapsed != null);
const showCaretPlaceholder = computed(() => props.item.collapsed != null && isLink.value && !hasChildren.value);

watch(hasActive, (next) => {
  if (next && props.item.collapsed != null) {
    collapsed.value = false;
    if (isAccordionItem.value) accordion.setActiveKey(props.itemKey);
  }
}, { immediate: true });

watch(() => accordion.activeKey.value, (next) => {
  if (!isAccordionItem.value) return;
  collapsed.value = next !== props.itemKey;
}, { immediate: true });

function onItemClick() {
  if (isExpandableTrigger.value) {
    toggleCollapsed();
  }
}

function onCaretClick(event: MouseEvent) {
  event.stopPropagation();
  if (props.item.collapsed != null) toggleCollapsed();
}

function onKeydown(event: KeyboardEvent) {
  if (!isExpandableTrigger.value) return;
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  onItemClick();
}

function toggleCollapsed() {
  if (!isAccordionItem.value) {
    collapsed.value = !collapsed.value;
    return;
  }

  if (collapsed.value) {
    accordion.setActiveKey(props.itemKey);
    return;
  }

  accordion.setActiveKey(null);
}

function resolveDefaultChildKey(): string | null {
  const index = props.item.items?.findIndex((child) => child.items?.length && child.collapsed === false) ?? -1;
  if (index < 0) return null;
  const child = props.item.items?.[index];
  return `${props.itemKey}/${index}:${child?.text ?? 'item'}`;
}
</script>

<template>
  <section class="NewsSidebarItem" :class="classes">
    <div
      v-if="item.text"
      class="item"
      :role="isExpandableTrigger ? 'button' : undefined"
      :tabindex="isExpandableTrigger ? 0 : undefined"
      @click="onItemClick"
      @keydown="onKeydown"
    >
      <div class="indicator" />

      <VPLink
        v-if="item.link"
        class="link"
        :href="item.link"
        :rel="item.rel"
        :target="item.target"
        :no-icon="true"
      >
        <component :is="headingTag" class="text">{{ item.text }}</component>
        <span v-if="showCaretPlaceholder" class="caret-placeholder" aria-hidden="true">
          <span class="caret-icon">&gt;</span>
        </span>
      </VPLink>
      <component :is="headingTag" v-else class="text">{{ item.text }}</component>

      <button
        v-if="item.collapsed != null && hasChildren"
        class="caret"
        type="button"
        aria-label="toggle section"
        @click="onCaretClick"
      >
        <span class="caret-icon">&gt;</span>
      </button>
    </div>

    <div v-if="hasChildren && !collapsed" class="items">
      <NewsSidebarItem
        v-for="(child, index) in item.items"
        :key="child.text"
        :item="child"
        :depth="depth + 1"
        :item-key="`${itemKey}/${index}:${child.text ?? 'item'}`"
      />
    </div>
  </section>
</template>

<style scoped src="./news-sidebar-item.css"></style>
