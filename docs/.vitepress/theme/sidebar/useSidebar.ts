import { useMediaQuery } from '@vueuse/core';
import { useData } from 'vitepress';
import { computed, onMounted, onUnmounted, ref, watchEffect, type Ref } from 'vue';
import type { DefaultTheme } from 'vitepress';
import { getSidebarGroups, getSidebarItems } from './support';

const isOpen = ref(false);

export function useSidebar() {
  const { frontmatter, page, theme } = useData<DefaultTheme.Config>();
  const is960 = useMediaQuery('(min-width: 960px)');
  const sidebar = computed(() => getSidebarItems(theme.value.sidebar, page.value.relativePath));

  const hasSidebar = computed(() => (
    frontmatter.value.sidebar !== false
    && sidebar.value.length > 0
    && frontmatter.value.layout !== 'home'
  ));

  const hasAside = computed(() => {
    if (frontmatter.value.layout === 'home') return false;
    if (frontmatter.value.aside != null) return !!frontmatter.value.aside;
    return theme.value.aside !== false;
  });

  const leftAside = computed(() => {
    if (!hasAside.value) return false;
    return frontmatter.value.aside == null
      ? theme.value.aside === 'left'
      : frontmatter.value.aside === 'left';
  });

  const sidebarGroups = computed(() => hasSidebar.value ? getSidebarGroups(sidebar.value) : []);
  const isSidebarEnabled = computed(() => hasSidebar.value && is960.value);

  return {
    isOpen,
    sidebar,
    sidebarGroups,
    hasSidebar,
    hasAside,
    leftAside,
    isSidebarEnabled,
    open: () => { isOpen.value = true; },
    close: () => { isOpen.value = false; },
    toggle: () => { isOpen.value = !isOpen.value; },
  };
}

export function useCloseSidebarOnEscape(open: Ref<boolean>, close: () => void) {
  let triggerElement: Element | null | undefined;

  watchEffect(() => {
    triggerElement = open.value ? document.activeElement : undefined;
  });

  const onEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && open.value) {
      close();
      (triggerElement as HTMLElement | null | undefined)?.focus?.();
    }
  };

  onMounted(() => window.addEventListener('keyup', onEscape));
  onUnmounted(() => window.removeEventListener('keyup', onEscape));
}
