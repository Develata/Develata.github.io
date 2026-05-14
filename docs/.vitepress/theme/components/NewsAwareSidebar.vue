<script lang="ts" setup>
import { useScrollLock } from '@vueuse/core';
import { inBrowser, useData } from 'vitepress';
import { computed, ref, watch } from 'vue';
import NewsSidebarGroup from './NewsSidebarGroup.vue';
import { buildNewsArticleSidebar, isNewsArticlePath } from './newsSidebarTree';
import { useSidebar } from '../sidebar/useSidebar';

const { page } = useData();
const { sidebar, sidebarGroups, hasSidebar } = useSidebar();

const props = defineProps<{
  open: boolean;
}>();

const navEl = ref<HTMLElement | null>(null);
const isLocked = useScrollLock(inBrowser ? document.body : null);

watch([() => props.open, navEl], () => {
  if (props.open) {
    isLocked.value = true;
    navEl.value?.focus();
  } else {
    isLocked.value = false;
  }
}, { immediate: true, flush: 'post' });

const resolvedGroups = computed(() => {
  if (page.value.relativePath.startsWith('news/')) {
    return isNewsArticlePath(page.value.relativePath)
      ? buildNewsArticleSidebar(sidebar.value, page.value.relativePath)
      : sidebar.value;
  }

  return sidebarGroups.value;
});

const key = computed(() => `${page.value.relativePath}:${resolvedGroups.value.length}`);
</script>

<template>
  <aside
    v-if="hasSidebar"
    class="VPSidebar"
    :class="{ open }"
    @click.stop
  >
    <div class="curtain" />

    <nav id="VPSidebarNav" ref="navEl" class="nav" aria-labelledby="sidebar-aria-label" tabindex="-1">
      <span id="sidebar-aria-label" class="visually-hidden">Sidebar Navigation</span>

      <slot name="sidebar-nav-before" />
      <NewsSidebarGroup :items="resolvedGroups" :key="key" />
      <slot name="sidebar-nav-after" />
    </nav>
  </aside>
</template>

<style scoped src="./news-aware-sidebar.css"></style>
