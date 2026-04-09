import type { SceneUiSnapshot } from './types';

export class SceneUiBridge {
  private readonly listeners = new Set<(snapshot: SceneUiSnapshot) => void>();

  constructor(private readonly buildSnapshot: () => SceneUiSnapshot) {}

  subscribe(listener: (snapshot: SceneUiSnapshot) => void) {
    this.listeners.add(listener);
    listener(this.buildSnapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  notify() {
    if (this.listeners.size === 0) return;
    const snapshot = this.buildSnapshot();
    this.listeners.forEach((listener) => listener(snapshot));
  }

  clear() {
    this.listeners.clear();
  }
}
