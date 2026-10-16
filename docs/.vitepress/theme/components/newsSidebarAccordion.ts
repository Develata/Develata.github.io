import type { ComputedRef, InjectionKey, Ref } from 'vue';

export interface AccordionController {
  activeKey: Ref<string | null>;
  setActiveKey: (key: string | null) => void;
}

export interface SidebarActiveState {
  activeKeys: ReadonlySet<string>;
  exactActiveKey: string | null;
}

export const newsSidebarAccordionKey: InjectionKey<AccordionController> = Symbol('news-sidebar-accordion');
export const newsSidebarActiveStateKey: InjectionKey<ComputedRef<SidebarActiveState>> = Symbol('news-sidebar-active-state');
