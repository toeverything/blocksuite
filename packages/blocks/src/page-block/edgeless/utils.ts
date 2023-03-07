import type { SurfaceElement, SurfaceViewport } from '@blocksuite/phasor';
import {
  Bound,
  boundsContain,
  deserializeXYWH,
  isPointIn as isPointInFromPhasor,
  serializeXYWH,
} from '@blocksuite/phasor';

import type { TopLevelBlockModel } from '../../__internal__/index.js';
import type { EdgelessContainer } from './edgeless-page-block.js';
import type { Selectable } from './selection-manager.js';

// XXX: edgeless frame min length
export const FRAME_MIN_LENGTH = 20;

export function isTopLevelBlock(
  selectable: Selectable | null
): selectable is TopLevelBlockModel {
  return !!selectable && 'flavour' in selectable;
}

export function isSurfaceElement(
  selectable: Selectable | null
): selectable is SurfaceElement {
  return !isTopLevelBlock(selectable);
}

function isPointIn(
  block: { xywh: string },
  pointX: number,
  pointY: number
): boolean {
  const [x, y, w, h] = deserializeXYWH(block.xywh);
  return isPointInFromPhasor({ x, y, w, h }, pointX, pointY);
}

export function pickTop(
  blocks: TopLevelBlockModel[],
  modelX: number,
  modelY: number
): TopLevelBlockModel | null {
  for (let i = blocks.length - 1; i >= 0; i--) {
    const block = blocks[i];
    if (isPointIn(block, modelX, modelY)) {
      return block;
    }
  }
  return null;
}

export function pickInBound(blocks: TopLevelBlockModel[], bound: Bound) {
  return blocks.filter(block => {
    const [x, y, w, h] = deserializeXYWH(block.xywh);
    return boundsContain(bound, { x, y, w, h });
  });
}

export function getSelectionBoxBound(viewport: SurfaceViewport, xywh: string) {
  const [modelX, modelY, modelW, modelH] = deserializeXYWH(xywh);
  const [x, y] = viewport.toViewCoord(modelX, modelY);
  return new DOMRect(x, y, modelW * viewport.zoom, modelH * viewport.zoom);
}

export function initWheelEventHandlers(container: EdgelessContainer) {
  const wheelHandler = (e: WheelEvent) => {
    e.preventDefault();

    const { viewport } = container.surface;

    // pan
    if (!e.ctrlKey) {
      const dx = e.deltaX / viewport.zoom;
      const dy = e.deltaY / viewport.zoom;
      viewport.applyDeltaCenter(dx, dy);
      container.slots.viewportUpdated.emit();
    }
    // zoom
    else {
      const delta = e.deltaX !== 0 ? -e.deltaX : -e.deltaY;
      const { centerX, centerY } = viewport;
      const prevZoom = viewport.zoom;
      viewport.applyDeltaZoom(delta);

      const newZoom = viewport.zoom;
      const rect = container.getBoundingClientRect();

      // Perform zooming relative to the mouse position
      const [baseX, baseY] = container.surface.toModelCoord(
        e.clientX - rect.x,
        e.clientY - rect.y
      );

      const offsetX = centerX - baseX;
      const offsetY = centerY - baseY;
      const newCenterX = baseX + offsetX * (prevZoom / newZoom);
      const newCenterY = baseY + offsetY * (prevZoom / newZoom);
      viewport.setCenter(newCenterX, newCenterY);

      container.slots.viewportUpdated.emit();
    }
  };

  container.addEventListener('wheel', wheelHandler);
  const dispose = () => container.removeEventListener('wheel', wheelHandler);
  return dispose;
}

export function getXYWH(element: Selectable) {
  return isTopLevelBlock(element)
    ? element.xywh
    : serializeXYWH(element.x, element.y, element.w, element.h);
}

export function stopPropagation(event: Event) {
  event.stopPropagation();
}
