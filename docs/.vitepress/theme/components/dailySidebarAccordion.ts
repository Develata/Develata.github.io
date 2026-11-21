import type { ComputedRef, InjectionKey, Ref } from 'vue';

export interface AccordionController {
  activeKey: Ref<string | null>;
  setActiveKey: (key: string | null) => void;
}

export interface SidebarActiveState {
  activeKeys: ReadonlySet<string>;
  exactActiveKey: string | null;
}

export const dailySidebarAccordionKey: InjectionKey<AccordionController> = Symbol('daily-sidebar-accordion');
export const dailySidebarActiveStateKey: InjectionKey<ComputedRef<SidebarActiveState>> = Symbol('daily-sidebar-active-state');
