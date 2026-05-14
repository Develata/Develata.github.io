<script setup lang="ts">
import { useRoute } from 'vitepress';
import { computed, ref, watch } from 'vue';
import type { DefaultTheme } from 'vitepress';

const props = defineProps<{
  item: DefaultTheme.SidebarItem;
  depth: number;
}>();

const route = useRoute();
const collapsed = ref(!!props.item.collapsed);

watch(() => props.item.collapsed, (next) => {
  collapsed.value = !!next;
}, { immediate: true });

const hasChildren = computed(() => !!props.item.items?.length);
const isLink = computed(() => !!props.item.link);
const normalizedRoutePath = computed(() => normalizePath(route.path));
const normalizedLink = computed(() => normalizePath(props.item.link));
const isActive = computed(() => !!normalizedLink.value && normalizedRoutePath.value === normalizedLink.value);
const hasActive = computed(() => isActive.value || hasActiveDescendant(props.item.items, normalizedRoutePath.value));
const classes = computed(() => [
  `level-${props.depth}`,
  { collapsed: collapsed.value, collapsible: props.item.collapsed != null, 'is-link': isLink.value, 'is-active': isActive.value, 'has-active': hasActive.value },
]);
const headingTag = computed(() => (!hasChildren.value ? 'p' : `h${Math.min(props.depth + 2, 6)}`));

watch(hasActive, (next) => {
  if (next && props.item.collapsed != null) collapsed.value = false;
}, { immediate: true });

function onItemClick() {
  if (hasChildren.value && !props.item.link && props.item.collapsed != null) {
    collapsed.value = !collapsed.value;
  }
}

function onCaretClick(event: MouseEvent) {
  event.stopPropagation();
  if (props.item.collapsed != null) collapsed.value = !collapsed.value;
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') onItemClick();
}

function normalizePath(path?: string): string {
  if (!path) return '';
  return path.replace(/\/index$/u, '/').replace(/\/$/u, '') || '/';
}

function hasActiveDescendant(items: DefaultTheme.SidebarItem[] | undefined, path: string): boolean {
  return !!items?.some((item) => normalizePath(item.link) === path || hasActiveDescendant(item.items, path));
}
</script>

<template>
  <section class="NewsSidebarItem" :class="classes">
    <div
      v-if="item.text"
      class="item"
      :role="hasChildren ? 'button' : undefined"
      :tabindex="hasChildren ? 0 : undefined"
      @click="onItemClick"
      @keydown="onKeydown"
    >
      <div class="indicator" />

      <a
        v-if="item.link"
        class="link"
        :href="item.link"
        :rel="item.rel"
        :target="item.target"
      >
        <component :is="headingTag" class="text">{{ item.text }}</component>
      </a>
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

    <div v-if="hasChildren" class="items">
      <NewsSidebarItem
        v-for="child in item.items"
        :key="child.text"
        :item="child"
        :depth="depth + 1"
      />
    </div>
  </section>
</template>

<style scoped src="./news-sidebar-item.css"></style>
