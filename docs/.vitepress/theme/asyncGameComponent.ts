/**
 * @file asyncGameComponent.ts
 * @description VitePress 游戏组件的统一异步加载边界。
 */
import { defineAsyncComponent, h } from 'vue';

export function createGameComponent(loader: () => Promise<any>) {
  return defineAsyncComponent({
    loader,
    loadingComponent: {
      render() {
        return h(
          'div',
          {
            role: 'status',
            style:
              'min-height: 180px; display: grid; place-items: center; color: var(--vp-c-text-2); font: 500 0.92rem/1.5 ui-monospace, monospace;',
          },
          'Loading interactive module…'
        );
      },
    },
    errorComponent: {
      render() {
        return h(
          'div',
          {
            role: 'alert',
            style:
              'margin: 32px auto; max-width: 620px; padding: 20px; border: 1px solid var(--vp-c-danger-2); border-radius: 12px; color: var(--vp-c-text-1);',
          },
          '交互模块加载失败。请检查网络后刷新页面。'
        );
      },
    },
    delay: 80,
    timeout: 15_000,
    onError(error, retry, fail, attempts) {
      if (attempts <= 1) globalThis.setTimeout(retry, 500);
      else fail(error);
    },
  });
}
