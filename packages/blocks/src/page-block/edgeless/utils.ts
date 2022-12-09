import type { EdgelessContainer } from './edgeless-page-block';
import type { ViewportState, XYWH } from './selection-manager';
import type { RootBlockModels } from '../../__internal__';
import type { ShapeBlockComponent } from '../../shape-block';
import type { SelectionEvent } from '../../__internal__';

export const DEFAULT_SPACING = 64;

// XXX: edgeless group container padding
export const PADDING_X = 48;
export const PADDING_Y = 48;

// XXX: edgeless group min length
export const GROUP_MIN_LENGTH = 20;

function isPointIn(block: { xywh: string }, x: number, y: number): boolean {
  const a = JSON.parse(block.xywh) as [number, number, number, number];
  const [ax, ay, aw, ah] = a;
  const paddedW = aw + PADDING_X;
  const paddedH = ah + PADDING_Y;
  return ax < x && x <= ax + paddedW && ay < y && y <= ay + paddedH;
}

export function pick(
  blocks: RootBlockModels[],
  modelX: number,
  modelY: number,
  container: EdgelessContainer,
  e: SelectionEvent
): RootBlockModels | null {
  for (let i = blocks.length - 1; i >= 0; i--) {
    const block = blocks[i];
    if (block.flavour === 'affine:shape') {
      if (isPointIn(block, modelX, modelY)) {
        const items = container.getElementsByTagName('shape-block');
        for (let j = 0; j < items.length; j++) {
          const item = items.item(j) as ShapeBlockComponent;
          const collision = item.detectCollision(e.raw.offsetX, e.raw.offsetY);
          if (collision) {
            return block;
          }
        }
      }
    } else {
      if (isPointIn(block, modelX, modelY)) {
        return block;
      }
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
