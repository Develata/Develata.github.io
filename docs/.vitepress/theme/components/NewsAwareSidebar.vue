<script lang="ts" setup>
import { useScrollLock } from '@vueuse/core';
import { inBrowser, useData, useRoute } from 'vitepress';
import { computed, ref, watch } from 'vue';
import DefaultSidebarGroup from './DefaultSidebarGroup.vue';
import DailySidebarGroup from './DailySidebarGroup.vue';
import { buildNewsArticleSidebar, isNewsArticlePath } from './newsSidebarTree';
import { normalizeSidebarPath } from '../sidebar/normalizePath';
import { useSidebar } from '../sidebar/useSidebar';

const { page } = useData();
const route = useRoute();
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
  const sourcePath = page.value.relativePath.replace(/^daily\/news\//, 'news/');
  if (sourcePath.startsWith('news/')) {
    return isNewsArticlePath(sourcePath)
      ? buildNewsArticleSidebar(sidebar.value, sourcePath)
      : sidebar.value;
  }

  return sidebarGroups.value;
});

const key = computed(() => `${page.value.relativePath}:${resolvedGroups.value.length}`);
const activePath = computed(() => normalizeSidebarPath(route.path));
const useArchiveSidebar = computed(() => route.path.startsWith('/daily/'));
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
      <DailySidebarGroup
        v-if="useArchiveSidebar"
        :items="resolvedGroups"
        :active-path="activePath"
        :key="key"
      />
      <DefaultSidebarGroup
        v-else
        :items="resolvedGroups"
        :key="key"
      />
      <slot name="sidebar-nav-after" />
    </nav>
  </aside>
</template>

<style scoped src="./news-aware-sidebar.css"></style>
