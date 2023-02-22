import type { SurfaceManager } from '@blocksuite/phasor';

import type { ViewportState } from './viewport-state.js';

export function initWheelEventHandlers(
  surface: SurfaceManager,
  container: ViewportState,
  root: HTMLCanvasElement
) {
  const wheelHandler = (e: WheelEvent) => {
    e.preventDefault();

    // pan
    if (!e.ctrlKey) {
      const dx = e.deltaX / container.zoom;
      const dy = e.deltaY / container.zoom;
      container.applyDeltaCenter(dx, dy);
      surface.setViewport(container.centerX, container.centerY, container.zoom);
    }
    // zoom
    else {
      const delta = e.deltaX !== 0 ? -e.deltaX : -e.deltaY;
      container.applyDeltaZoom(delta);
      surface.setViewport(container.centerX, container.centerY, container.zoom);
    }
  };

  root.addEventListener('wheel', wheelHandler);
  const dispose = () => root.removeEventListener('wheel', wheelHandler);
  return dispose;
}
