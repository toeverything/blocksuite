import type { Point as ConnectorPoint } from '@blocksuite/connector';
import type { Direction } from '@blocksuite/connector';
import { Rectangle, route, simplifyPath } from '@blocksuite/connector';
import type { PointerEventState } from '@blocksuite/lit';
import {
  Bound,
  type Controller,
  type PhasorElement,
  type SurfaceManager,
  type SurfaceViewport,
  TextElement,
} from '@blocksuite/phasor';
import { ConnectorElement, ConnectorMode } from '@blocksuite/phasor';
import {
  contains,
  deserializeXYWH,
  intersects,
  isPointIn as isPointInFromPhasor,
  normalizeWheelDeltaY,
  serializeXYWH,
} from '@blocksuite/phasor';
import { assertExists, type Page } from '@blocksuite/store';
import * as Y from 'yjs';

import {
  handleNativeRangeAtPoint,
  type MouseMode,
  Point,
  type TopLevelBlockModel,
} from '../../__internal__/index.js';
import { isPinchEvent } from '../../__internal__/utils/index.js';
import { DEFAULT_TEXT_COLOR } from './components/component-toolbar/change-text-button.js';
import { SurfaceTextEditor } from './components/surface-text-editor.js';
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

const ATTACHED_DISTANCE = 20;

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

export function pickBlocksByBound(
  blocks: TopLevelBlockModel[],
  bound: Omit<Bound, 'serialize'>
) {
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

      const zoom = normalizeWheelDeltaY(e.deltaY, viewport.zoom);
      viewport.setZoom(zoom);
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
    case 'connector':
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
        (page.root?.children as TopLevelBlockModel[]).filter(
          child => child.flavour === 'affine:frame'
        ) ?? [],
        modelX,
        modelY
      );
}

function pickById(surface: SurfaceManager, page: Page, id: string) {
  const blocks =
    (page.root?.children.filter(
      child => child.flavour === 'affine:frame'
    ) as TopLevelBlockModel[]) ?? [];
  const element = surface.pickById(id) || blocks.find(b => b.id === id);
  return element;
}

export function generateConnectorPath(
  startRect: Rectangle | null,
  endRect: Rectangle | null,
  startPoint: ConnectorPoint,
  endPoint: ConnectorPoint,
  originControllers: Controller[],
  mode: ConnectorMode = ConnectorMode.Orthogonal,
  // this indicating which part of the path is fixed when there are customized control points
  fixed?: 'start' | 'end'
) {
  if (mode !== ConnectorMode.Orthogonal) {
    return [startPoint, endPoint];
  }
  let customizedStart = Infinity;
  let customizedEnd = -1;
  originControllers.forEach((c, index) => {
    if (c.customized) {
      customizedStart = Math.min(customizedStart, index);
      customizedEnd = Math.max(customizedEnd, index);
    }
  });

  let path: ConnectorPoint[] = [];
  if (fixed && customizedEnd > -1) {
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

    path = simplifyPath([...part0.slice(0, -1), ...part1, ...part2.slice(1)]);
  } else {
    path = route([startRect, endRect].filter(r => !!r) as Rectangle[], [
      startPoint,
      endPoint,
    ]);
  }

  if (path.length < 3) {
    path = [startPoint, endPoint];
  }

  return path;
}

function getAttachedPointByDirection(
  { x, y, w, h }: Rectangle,
  direction: Direction
): ConnectorPoint {
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
    default: {
      throw new Error(`Unknown direction: ${direction}`);
    }
  }
}

export function getAttachedPoint(
  x: number,
  y: number,
  rect?: Rectangle | null
): { point: ConnectorPoint; position: ConnectorPoint | null } {
  if (!rect || !rect.contains(x, y)) {
    return { point: { x, y }, position: null };
  }
  const direction = rect.relativeDirection(x, y);
  const position = {
    x: (x - rect.x) / rect.w,
    y: (y - rect.y) / rect.h,
  };

  const attachedPoint = getAttachedPointByDirection(rect, direction);
  const distance = Math.sqrt(
    Math.pow(x - attachedPoint.x, 2) + Math.pow(y - attachedPoint.y, 2)
  );
  if (distance < ATTACHED_DISTANCE) {
    return {
      point: attachedPoint,
      position: {
        x: (attachedPoint.x - rect.x) / rect.w,
        y: (attachedPoint.y - rect.y) / rect.h,
      },
    };
  }

  return { point: { x, y }, position };
}

function getAttachedPointByPosition(rect: Rectangle, position: ConnectorPoint) {
  const x = rect.x + rect.w * position.x;
  const y = rect.y + rect.h * position.y;

  const direction = rect.relativeDirection(x, y);
  const attachedPoint = getAttachedPointByDirection(rect, direction);
  const distance = Math.sqrt(
    Math.pow(x - attachedPoint.x, 2) + Math.pow(y - attachedPoint.y, 2)
  );
  if (distance < ATTACHED_DISTANCE) {
    return attachedPoint;
  }

  return { x, y };
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
      ? getAttachedPointByPosition(startRect, startElement.position)
      : {
          x: element.x + element.controllers[0].x,
          y: element.y + element.controllers[0].y,
        };

  const end = endElement?.id ? pickById(surface, page, endElement.id) : null;
  const endRect = end ? new Rectangle(...deserializeXYWH(getXYWH(end))) : null;
  const endPoint =
    endRect && endElement
      ? getAttachedPointByPosition(endRect, endElement.position)
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

export function isConnectorAndBindingsAllSelected(
  connector: ConnectorElement,
  selected: Selectable[]
) {
  const connectorSelected = selected.find(s => s.id === connector.id);
  if (!connectorSelected) {
    return false;
  }
  const { startElement, endElement } = connector;
  const startSelected = selected.find(s => s.id === startElement?.id);
  const endSelected = selected.find(s => s.id === endElement?.id);
  if (!startElement && !endElement) {
    return true;
  }
  if (!startElement && endSelected) {
    return true;
  }
  if (!endElement && startSelected) {
    return true;
  }
  if (startSelected && endSelected) {
    return true;
  }
  return false;
}

export function handleElementChangedEffectForConnector(
  element: Selectable,
  selected: Selectable[],
  surface: SurfaceManager,
  page: Page
) {
  if (element.type !== 'connector') {
    const bindingElements = surface.getBindingElements(element.id);
    bindingElements.forEach(bindingElement => {
      if (bindingElement instanceof ConnectorElement) {
        // if all connector and binding element are selected, they will process in common method.
        // like:
        // mode-controllers/default-mode: _handleSurfaceDragMove
        // components/edgeless-selected-rect: _onDragMove
        if (isConnectorAndBindingsAllSelected(bindingElement, selected)) {
          return;
        }
        const { startElement, endElement, id, x, y, controllers, mode } =
          bindingElement;
        const { start, end } = getConnectorAttachedInfo(
          bindingElement,
          surface,
          page
        );
        const fixed =
          startElement?.id === element.id
            ? 'end'
            : endElement?.id === element.id
            ? 'start'
            : undefined;

        const routes = generateConnectorPath(
          start.rect,
          end.rect,
          start.point,
          end.point,
          controllers.map(c => ({ ...c, x: c.x + x, y: c.y + y })),
          mode,
          fixed
        );

        surface.updateElement<'connector'>(id, {
          controllers: routes,
        });
      }
    });
  }
}

export function getBackgroundGrid(
  viewportX: number,
  viewportY: number,
  zoom: number,
  showGrid: boolean
) {
  const step = zoom < 0.5 ? 2 : 1 / (Math.floor(zoom) || 1);
  const gap = 20 * step * zoom;
  const translateX = -viewportX * zoom;
  const translateY = -viewportY * zoom;

  return {
    gap,
    translateX,
    translateY,
    grid: showGrid
      ? 'radial-gradient(var(--affine-edgeless-grid-color) 1px, var(--affine-background-primary-color) 1px)'
      : 'unset',
  };
}

export function addNote(
  edgeless: EdgelessPageBlockComponent,
  page: Page,
  event: PointerEventState,
  width = DEFAULT_FRAME_WIDTH
) {
  const frameId = edgeless.addFrameWithPoint(
    new Point(event.point.x, event.point.y),
    {
      width,
    }
  );
  page.addBlock('affine:paragraph', {}, frameId);
  edgeless.slots.mouseModeUpdated.emit({ type: 'default' });

  // Wait for mouseMode updated
  requestAnimationFrame(() => {
    const blocks =
      (page.root?.children.filter(
        child => child.flavour === 'affine:frame'
      ) as TopLevelBlockModel[]) ?? [];
    const element = blocks.find(b => b.id === frameId);
    if (element) {
      edgeless.slots.selectionUpdated.emit({
        selected: [element],
        active: true,
      });

      // Waiting dom updated, `frame mask` is removed
      edgeless.updateComplete.then(() => {
        // Cannot reuse `handleNativeRangeClick` directly here,
        // since `retargetClick` will re-target to pervious editor
        handleNativeRangeAtPoint(event.raw.clientX, event.raw.clientY);
      });
    }
  });
}

export function mountTextEditor(
  textElement: TextElement,
  edgeless: EdgelessPageBlockComponent
) {
  const textEditor = new SurfaceTextEditor();
  const pageBlockContainer = edgeless.pageBlockContainer;

  pageBlockContainer.appendChild(textEditor);
  textEditor.mount(textElement, edgeless);
  textEditor.vEditor?.focusEnd();
  edgeless.selection.switchToDefaultMode({
    selected: [textElement],
    active: true,
  });
}

export function addText(
  edgeless: EdgelessPageBlockComponent,
  event: PointerEventState
) {
  const selected = edgeless.surface.pickTop(event.x, event.y);
  if (!selected) {
    const [modelX, modelY] = edgeless.surface.viewport.toModelCoord(
      event.x,
      event.y
    );
    const id = edgeless.surface.addElement('text', {
      xywh: new Bound(modelX, modelY, 32, 32).serialize(),
      text: new Y.Text(),
      textAlign: 'left',
      fontSize: 24,
      color: DEFAULT_TEXT_COLOR,
    });
    edgeless.page.captureSync();
    const textElement = edgeless.surface.pickById(id);
    assertExists(textElement);
    if (textElement instanceof TextElement) {
      mountTextEditor(textElement, edgeless);
    }
  }
}

export function xywhArrayToObject(element: TopLevelBlockModel) {
  const [x, y, w, h] = deserializeXYWH(element.xywh);
  return {
    x,
    y,
    w,
    h,
  };
}
