/**
 * @file bilingualMode.ts
 * @description 双语阅读模式的共享常量：切换组件与 config.mts 的首帧 head 脚本必须使用同一组值。
 */
export const BILINGUAL_MODE_KEY = 'vp-bilingual-mode';
export const BILINGUAL_BOTH_CLASS = 'bi-mode-both';

/** 首帧前执行：已保存「对照」时给 <html> 加类，避免先显示单语再跳成对照。 */
export const bilingualModeHeadScript = `;(() => { try { if (localStorage.getItem('${BILINGUAL_MODE_KEY}') === 'both') document.documentElement.classList.add('${BILINGUAL_BOTH_CLASS}') } catch (e) {} })()`;
