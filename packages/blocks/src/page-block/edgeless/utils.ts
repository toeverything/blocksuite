import { GroupBlockModel } from '../../group-block';
import { EdgelessContainer } from './edgeless-page-block';
import type { ViewportState, XYWH } from './selection-manager';

function isPointIn(block: { xywh: string }, x: number, y: number): boolean {
  const a = JSON.parse(block.xywh) as [number, number, number, number];
  const [ax, ay, aw, ah] = a;
  return ax < x && x <= ax + aw && ay < y && y <= ay + ah;
}

export function pick(
  blocks: GroupBlockModel[],
  modelX: number,
  modelY: number
): GroupBlockModel | null {
  for (let i = blocks.length - 1; i >= 0; i--) {
    if (isPointIn(blocks[i], modelX, modelY)) {
      return blocks[i];
    }
  }
  return null;
}

export function getSelectionBoxBound(viewport: ViewportState, xywh: string) {
  const [modelX, modelY, modelW, modelH] = JSON.parse(xywh) as XYWH;
  const [x, y] = viewport.toViewCoord(modelX, modelY);
  return new DOMRect(x, y, modelW * viewport.zoom, modelH * viewport.zoom);
}

export function initWheelEventHandlers(container: EdgelessContainer) {
  const wheelHandler = (e: WheelEvent) => {
    e.preventDefault();

    const { viewport } = container;

    // pan
    if (!e.ctrlKey) {
      const dx = e.deltaX / viewport.zoom;
      const dy = e.deltaY / viewport.zoom;
      viewport.applyDeltaCenter(dx, dy);
      container.signals.viewportUpdated.emit();
    }
    // zoom
    else {
      const delta = e.deltaX !== 0 ? -e.deltaX : -e.deltaY;
      viewport.applyDeltaZoom(delta);
      container.signals.viewportUpdated.emit();
    }
  };

  container.addEventListener('wheel', wheelHandler);
  const dispose = () => container.removeEventListener('wheel', wheelHandler);
  return dispose;
}
