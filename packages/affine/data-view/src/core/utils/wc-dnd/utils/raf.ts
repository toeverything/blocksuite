let rafId: number | null = null;
let rafCallback: ((delta: number) => void) | null = null;

export function raf(callback?: (delta: number) => void) {
  if (!callback) {
    rafCallback = null;
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    return;
  }
  const lastTime = performance.now();
  rafCallback = () => {
    rafId = null;
    callback(performance.now() - lastTime);
  };

  if (rafId === null) {
    rafId = requestAnimationFrame(time => {
      rafCallback?.(time);
    });
  }
}
