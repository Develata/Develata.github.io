import type { InjectionKey, Ref } from 'vue';

export interface AccordionController {
  activeKey: Ref<string | null>;
  setActiveKey: (key: string | null) => void;
}

export const newsSidebarAccordionKey: InjectionKey<AccordionController> = Symbol('news-sidebar-accordion');
