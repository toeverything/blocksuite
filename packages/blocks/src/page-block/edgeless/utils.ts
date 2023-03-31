import type { MouseMode, TopLevelBlockModel } from '@blocksuite/blocks/std';
import type { Point as ConnectorPoint } from '@blocksuite/connector';
import { Rectangle } from '@blocksuite/connector';
import { simplifyPath } from '@blocksuite/connector';
import { route } from '@blocksuite/connector';
import type {
  AttachedElementDirection,
  Bound,
  ConnectorElement,
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

import { isPinchEvent } from '../../__internal__/utils/gesture.js';
import type { EdgelessContainer } from './edgeless-page-block.js';
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

export function pickBy(
  surface: SurfaceManager,
  page: Page,
  x: number,
  y: number,
  filter: (element: Selectable) => boolean
): Selectable | null {
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

function pickById(surface: SurfaceManager, page: Page, id: string) {
  const blocks = (page.root?.children as TopLevelBlockModel[]) ?? [];
  const element = surface.pickById(id) || blocks.find(b => b.id === id);
  return element;
}

export function generateConnectorPath(
  startRect: Rectangle | null,
  endRect: Rectangle | null,
  startPoint: ConnectorPoint,
  endPoint: ConnectorPoint,
  originControllers: Controller[],
  // this indicating which part of the path is fixed when there are customized control points
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
    const part0 =
      fixed === 'start'
        ? originControllers.slice(0, customizedStart + 1)
        : route(startRect ? [startRect] : [], [startPoint, part0EndPoint]);

    const part1 = originControllers.slice(customizedStart, customizedEnd + 1);

    const part2StartPoint = originControllers[customizedEnd];
    const part2 =
      fixed === 'end'
        ? originControllers.slice(customizedEnd)
        : route(endRect ? [endRect] : [], [part2StartPoint, endPoint]);

    const finalPath = simplifyPath([
      ...part0.slice(0, -1),
      ...part1,
      ...part2.slice(1),
    ]);

    return finalPath;
  }

  return route([startRect, endRect].filter(r => !!r) as Rectangle[], [
    startPoint,
    endPoint,
  ]);
}

export function getAttachedPointByDirection(
  { x, y, w, h }: Rectangle,
  direction: AttachedElementDirection
) {
  switch (direction) {
    case 'top': {
      return { x: x + w / 2, y };
    }
    case 'right': {
      return { x: x + w, y: y + h / 2 };
    }
    case 'bottom': {
      return { x: x + w / 2, y: y + h };
    }
    case 'left': {
      return { x, y: y + h / 2 };
    }
  }
}

export function getAttachedPoint(
  x: number,
  y: number,
  rect?: Rectangle | null
) {
  if (!rect) {
    return { point: { x, y }, direction: 'left' as const };
  }
  const direction = rect.relativeDirection(x, y);
  const point = getAttachedPointByDirection(rect, direction);
  return { point, direction };
}

export function getConnectorAttachedInfo(
  element: ConnectorElement,
  surface: SurfaceManager,
  page: Page
) {
  const { startElement, endElement } = element;
  const start = startElement?.id
    ? pickById(surface, page, startElement.id)
    : null;
  const startRect = start
    ? new Rectangle(...deserializeXYWH(getXYWH(start)))
    : null;
  const startPoint =
    startRect && startElement
      ? getAttachedPointByDirection(startRect, startElement.direction)
      : {
          x: element.x + element.controllers[0].x,
          y: element.y + element.controllers[0].y,
        };

  const end = endElement?.id ? pickById(surface, page, endElement.id) : null;
  const endRect = end ? new Rectangle(...deserializeXYWH(getXYWH(end))) : null;
  const endPoint =
    endRect && endElement
      ? getAttachedPointByDirection(endRect, endElement.direction)
      : {
          x: element.x + element.controllers[element.controllers.length - 1].x,
          y: element.y + element.controllers[element.controllers.length - 1].y,
        };

  return {
    start: {
      element: startElement,
      rect: startRect,
      point: startPoint,
    },
    end: {
      element: endElement,
      rect: endRect,
      point: endPoint,
    },
  };
}
