import type {
  BlockComponentElement,
  EditingState,
  MouseMode,
  Point,
  TopLevelBlockModel,
} from '@blocksuite/blocks/std';
import {
  doesInSamePath,
  getClosestBlockElementByPoint,
  getHoveringFrame,
  isInEmptyDatabaseByPoint,
  Rect,
} from '@blocksuite/blocks/std';
import type { Point as ConnectorPoint, Rectangle } from '@blocksuite/connector';
import { simplifyPath } from '@blocksuite/connector';
import { route } from '@blocksuite/connector';
import type {
  Bound,
  Controller,
  PhasorElement,
  SurfaceManager,
  SurfaceViewport,
} from '@blocksuite/phasor';
import {
  contains,
  deserializeXYWH,
  intersects,
  isPointIn as isPointInFromPhasor,
  serializeXYWH,
} from '@blocksuite/phasor';
import type { Page } from '@blocksuite/store';
import { assertExists } from '@blocksuite/store';

import { isPinchEvent } from '../../__internal__/utils/gesture.js';
import { DragHandle } from '../../components/index.js';
import type {
  EdgelessContainer,
  EdgelessPageBlockComponent,
} from './edgeless-page-block.js';
import type { Selectable } from './selection-manager.js';

export const FRAME_MIN_WIDTH = 200;
export const FRAME_MIN_HEIGHT = 20;

export const DEFAULT_FRAME_WIDTH = 448;
export const DEFAULT_FRAME_HEIGHT = 72;
export const DEFAULT_FRAME_OFFSET_X = 30;
export const DEFAULT_FRAME_OFFSET_Y = 40;

export function isTopLevelBlock(
  selectable: Selectable | null
): selectable is TopLevelBlockModel {
  return !!selectable && 'flavour' in selectable;
}

export function isPhasorElement(
  selectable: Selectable | null
): selectable is PhasorElement {
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

export function pickTopBlock(
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

export function pickBlocksByBound(blocks: TopLevelBlockModel[], bound: Bound) {
  return blocks.filter(block => {
    const [x, y, w, h] = deserializeXYWH(block.xywh);
    const blockBound = { x, y, w, h };
    return contains(bound, blockBound) || intersects(bound, blockBound);
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
    if (!isPinchEvent(e)) {
      const dx = e.deltaX / viewport.zoom;
      const dy = e.deltaY / viewport.zoom;
      viewport.applyDeltaCenter(dx, dy);
      container.slots.viewportUpdated.emit();
    }
    // zoom
    else {
      const { centerX, centerY } = viewport;
      const prevZoom = viewport.zoom;

      const rect = container.getBoundingClientRect();
      // Perform zooming relative to the mouse position
      const [baseX, baseY] = container.surface.toModelCoord(
        e.clientX - rect.x,
        e.clientY - rect.y
      );

      let delta = e.deltaX !== 0 ? -e.deltaX : -e.deltaY;
      // The delta step when using the mouse wheel is greater than 100, resulting in overly fast zooming
      // Chromium reports deltaX/deltaY scaled by host device scale factor.
      // https://bugs.chromium.org/p/chromium/issues/detail?id=1324819
      if (Math.abs(delta) > 100) {
        delta = 10 * Math.sign(delta);
      }
      viewport.applyDeltaZoom(delta);
      const newZoom = viewport.zoom;

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

// https://developer.mozilla.org/en-US/docs/Web/CSS/cursor
export function getCursorMode(mouseMode: MouseMode) {
  switch (mouseMode.type) {
    case 'default':
      return 'default';
    case 'pan':
      return mouseMode.panning ? 'grabbing' : 'grab';
    case 'brush':
    case 'shape':
      return 'crosshair';
    case 'text':
      return 'text';
    default:
      return 'default';
  }
}

export function createDragHandle(pageBlock: EdgelessPageBlockComponent) {
  return new DragHandle({
    // Drag handle should be at the same level with EditorContainer
    container: pageBlock.mouseRoot as HTMLElement,
    onDropCallback(point, blocks, editingState) {
      const page = pageBlock.page;
      if (editingState) {
        const { rect, model, element } = editingState;
        const models = blocks.map(b => b.model);
        if (models.length === 1 && doesInSamePath(page, model, models[0])) {
          return;
        }

        let parentId;

        page.captureSync();

        if (isInEmptyDatabaseByPoint(point, model, element, models)) {
          page.moveBlocks(models, model);
          parentId = model.id;
        } else {
          const distanceToTop = Math.abs(rect.top - point.y);
          const distanceToBottom = Math.abs(rect.bottom - point.y);
          const parent = page.getParent(model);
          assertExists(parent);
          page.moveBlocks(
            models,
            parent,
            model,
            distanceToTop < distanceToBottom
          );
          parentId = parent.id;
        }

        pageBlock.setSelectionByBlockId(parentId, true);
        return;
      }

      // blank area
      page.captureSync();
      pageBlock.moveBlocksToNewFrame(
        blocks.map(b => b.model),
        point
      );
    },
    setSelectedBlocks(
      selectedBlocks: EditingState | BlockComponentElement[] | null
    ) {
      return;
    },
    getSelectedBlocks() {
      return [];
    },
    getClosestBlockElement(point: Point) {
      if (pageBlock.mouseMode.type !== 'default') return null;
      const hoveringFrame = getHoveringFrame(point);
      if (!hoveringFrame) return null;
      return getClosestBlockElementByPoint(
        point,
        { container: hoveringFrame, rect: Rect.fromDOM(hoveringFrame) },
        pageBlock.surface.viewport.zoom
      );
    },
  });
}

export function pickBy(
  surface: SurfaceManager,
  page: Page,
  x: number,
  y: number,
  filter: (element: Selectable) => boolean
) {
  const [modelX, modelY] = surface.viewport.toModelCoord(x, y);
  const selectedShapes = surface.pickByPoint(modelX, modelY).filter(filter);

  return selectedShapes.length
    ? selectedShapes[selectedShapes.length - 1]
    : pickTopBlock(
        (page.root?.children as TopLevelBlockModel[]) ?? [],
        modelX,
        modelY
      );
}

export function generatePath(
  startRect: Rectangle | null,
  endRect: Rectangle | null,
  startPoint: ConnectorPoint,
  endPoint: ConnectorPoint,
  originControllers: Controller[],
  fixed?: 'start' | 'end'
) {
  let customizedStart = Infinity;
  let customizedEnd = -1;
  originControllers.forEach((c, index) => {
    if (c.customized) {
      customizedStart = Math.min(customizedStart, index);
      customizedEnd = Math.max(customizedEnd, index);
    }
  });
  if (customizedEnd > -1) {
    const part0EndPoint = originControllers[customizedStart];
    const part0 = route(startRect ? [startRect] : [], [
      startPoint,
      part0EndPoint,
    ]);
    const part1 = originControllers.slice(customizedStart, customizedEnd + 1);
    const part2StartPoint = originControllers[customizedEnd];
    const part2 = route(endRect ? [endRect] : [], [part2StartPoint, endPoint]);

    let finalPath: Controller[];
    if (fixed === 'start') {
      finalPath = simplifyPath([
        ...originControllers.slice(0, customizedEnd + 1),
        ...part2.slice(1),
      ]);
    } else if (fixed === 'end') {
      finalPath = simplifyPath([
        ...part0.slice(0, -1),
        ...originControllers.slice(customizedStart),
      ]);
    } else {
      finalPath = simplifyPath([
        ...part0.slice(0, -1),
        ...part1,
        ...part2.slice(1),
      ]);
    }

    return finalPath;
  }

  return route([startRect, endRect].filter(r => !!r) as Rectangle[], [
    startPoint,
    endPoint,
  ]);
}
