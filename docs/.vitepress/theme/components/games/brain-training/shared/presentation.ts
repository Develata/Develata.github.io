/**
 * Schedule a task stimulus against the next browser paint.
 *
 * Vue state is flushed first; the rAF timestamp then becomes the response-time
 * origin for the frame that presents the stimulus. A generation token makes
 * pending work cancellation-safe across restart, hidden-tab abort and unmount.
 */
import { nextTick } from 'vue';

export interface PresentationScheduler {
  afterNextPaint(callback: (timestamp: DOMHighResTimeStamp) => void): void;
  cancel(): void;
}

export function createPresentationScheduler(): PresentationScheduler {
  let frameId: number | null = null;
  let generation = 0;

  function cancel(): void {
    generation++;
    if (frameId !== null) {
      window.cancelAnimationFrame(frameId);
      frameId = null;
    }
  }

  function afterNextPaint(callback: (timestamp: DOMHighResTimeStamp) => void): void {
    cancel();
    const expectedGeneration = generation;
    void nextTick().then(() => {
      if (expectedGeneration !== generation) return;
      frameId = window.requestAnimationFrame((timestamp) => {
        frameId = null;
        if (expectedGeneration === generation) callback(timestamp);
      });
    });
  }

  return { afterNextPaint, cancel };
}
