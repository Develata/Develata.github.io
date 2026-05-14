<script setup lang="ts">
import type { DefaultTheme } from 'vitepress';
import NewsSidebarItem from './NewsSidebarItem.vue';

defineProps<{
  items: DefaultTheme.SidebarItem[];
}>();
</script>

<template>
  <div class="NewsSidebarGroup">
    <NewsSidebarItem
      v-for="item in items"
      :key="item.text"
      :item="item"
      :depth="0"
    />
  </div>
</template>
