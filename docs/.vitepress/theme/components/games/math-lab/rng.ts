/**
 * @file rng.ts
 * @description 可复现的轻量伪随机数发生器。
 */
export function createRng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}
