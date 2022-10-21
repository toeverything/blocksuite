import { GroupBlockModel } from '../../group-block';
import { ViewportState, EdgelessContainer } from './edgeless-page-block';
import type { XYWH } from './selection-manager';

const MIN_ZOOM = 0.3;

export function applyDeltaZoom(
  current: ViewportState,
  delta: number
): ViewportState {
  const val = (current.zoom * (100 + delta)) / 100;
  const newZoom = Math.max(val, MIN_ZOOM);
  // TODO ensure center stable
  return { ...current, zoom: newZoom };
}

export function applyDeltaCenter(
  current: ViewportState,
  deltaX: number,
  deltaY: number
): ViewportState {
  const newX = current.viewportX + deltaX;
  const newY = current.viewportY + deltaY;
  return { ...current, viewportX: newX, viewportY: newY };
}

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

export function toModelCoord(
  viewport: ViewportState,
  viewX: number,
  viewY: number
): [number, number] {
  const { viewportX, viewportY, zoom } = viewport;
  return [viewportX + viewX / zoom, viewportY + viewY / zoom];
}

export function toViewCoord(
  viewport: ViewportState,
  modelX: number,
  modelY: number
): [number, number] {
  const { viewportX, viewportY, zoom } = viewport;
  return [(modelX - viewportX) * zoom, (modelY - viewportY) * zoom];
}

export function getSelectionBoxBound(viewport: ViewportState, xywh: string) {
  const [modelX, modelY, modelW, modelH] = JSON.parse(xywh) as XYWH;
  const [x, y] = toViewCoord(viewport, modelX, modelY);
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
      const newState = applyDeltaCenter(viewport, dx, dy);
      container.signals.updateViewport.emit(newState);
    }
    // zoom
    else {
      const delta = e.deltaX !== 0 ? -e.deltaX : -e.deltaY;
      const newState = applyDeltaZoom(viewport, delta);
      container.signals.updateViewport.emit(newState);
    }
  };

  container.addEventListener('wheel', wheelHandler);
  const dispose = () => container.removeEventListener('wheel', wheelHandler);
  return dispose;
}
