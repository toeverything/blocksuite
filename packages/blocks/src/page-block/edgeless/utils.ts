import type { EdgelessContainer } from './edgeless-page-block.js';
import type { ViewportState, XYWH } from './selection-manager.js';
import type { RootBlockModel } from '../../__internal__/index.js';
import type { SelectionEvent } from '../../__internal__/index.js';

export const DEFAULT_SPACING = 64;

// XXX: edgeless frame container padding
export const PADDING_X = 48;
export const PADDING_Y = 48;

// XXX: edgeless frame min length
export const FRAME_MIN_LENGTH = 20;

function isPointIn(block: { xywh: string }, x: number, y: number): boolean {
  const a = JSON.parse(block.xywh) as [number, number, number, number];
  const [ax, ay, aw, ah] = a;
  const paddedW = aw + PADDING_X;
  const paddedH = ah + PADDING_Y;
  return ax < x && x <= ax + paddedW && ay < y && y <= ay + paddedH;
}

export function pick(
  blocks: RootBlockModel[],
  modelX: number,
  modelY: number,
  container: EdgelessContainer,
  e: SelectionEvent
): RootBlockModel | null {
  for (let i = blocks.length - 1; i >= 0; i--) {
    const block = blocks[i];
    if (isPointIn(block, modelX, modelY)) {
      // if (
      //   isShapeBlock &&
      //   block.flavour === 'affine:shape' &&
      //   (target as ShapeBlockComponent).model === block
      // ) {
      //   return block;
      // } else if (!isShapeBlock && block.flavour !== 'affine:shape') {
      //   return block;
      // } else {
      //   continue;
      // }
      return block;
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
