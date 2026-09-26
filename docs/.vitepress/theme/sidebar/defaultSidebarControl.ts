import { useRoute } from 'vitepress';
import { computed, ref, watchEffect, type ComputedRef, type Ref } from 'vue';
import type { DefaultTheme } from 'vitepress';
import { normalizeSidebarPath } from './normalizePath';

type SidebarItem = DefaultTheme.SidebarItem;

export interface DefaultSidebarControl {
  collapsed: Ref<boolean>;
  collapsible: ComputedRef<boolean>;
  isLink: ComputedRef<boolean>;
  isActiveLink: ComputedRef<boolean>;
  hasActiveLink: ComputedRef<boolean>;
  hasChildren: ComputedRef<boolean>;
  toggle: () => void;
}

export function useDefaultSidebarControl(item: ComputedRef<SidebarItem>): DefaultSidebarControl {
  const route = useRoute();
  const collapsed = ref(false);

  const collapsible = computed(() => item.value.collapsed != null);
  const isLink = computed(() => !!item.value.link);
  const hasChildren = computed(() => !!item.value.items?.length);
  const isActiveLink = computed(() => isSamePath(route.path, item.value.link));
  const hasActiveLink = computed(() => {
    if (isActiveLink.value) return true;
    return containsActiveLink(route.path, item.value.items);
  });

  watchEffect(() => {
    collapsed.value = !!(collapsible.value && item.value.collapsed);
    if (isActiveLink.value || hasActiveLink.value) {
      collapsed.value = false;
    }
  });

  function toggle() {
    if (collapsible.value) {
      collapsed.value = !collapsed.value;
    }
  }

  return {
    collapsed,
    collapsible,
    isLink,
    isActiveLink,
    hasActiveLink,
    hasChildren,
    toggle,
  };
}

function containsActiveLink(currentPath: string, items?: SidebarItem[]): boolean {
  if (!items?.length) return false;
  return items.some((item) => isSamePath(currentPath, item.link) || containsActiveLink(currentPath, item.items));
}

function isSamePath(currentPath?: string, targetPath?: string): boolean {
  return normalizeSidebarPath(currentPath) === normalizeSidebarPath(targetPath);
}
