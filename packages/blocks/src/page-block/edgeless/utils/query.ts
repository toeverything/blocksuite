import {
  Bound,
  clamp,
  type PhasorElementWithText,
  ShapeElement,
  TextElement,
} from '@blocksuite/phasor';
import {
  type PhasorElement,
  type SurfaceManager,
  type SurfaceViewport,
} from '@blocksuite/phasor';
import {
  contains,
  deserializeXYWH,
  getQuadBoundsWithRotation,
  intersects,
  isPointIn as isPointInFromPhasor,
  serializeXYWH,
} from '@blocksuite/phasor';
import { GRID_GAP_MAX, GRID_GAP_MIN } from '@blocksuite/phasor';
import type { BaseBlockModel } from '@blocksuite/store';
import { type Page } from '@blocksuite/store';

import {
  type EdgelessElement,
  type EdgelessTool,
  type TopLevelBlockModel,
} from '../../../__internal__/index.js';
import type { EdgelessPageBlockComponent } from '../edgeless-page-block.js';
import type { Selectable } from '../services/tools-manager.js';

export function isTopLevelBlock(
  selectable: Selectable | BaseBlockModel | null
): selectable is TopLevelBlockModel {
  return !!selectable && 'flavour' in selectable;
}

export function isPhasorElement(
  selectable: Selectable | null
): selectable is PhasorElement {
  return !isTopLevelBlock(selectable);
}

export function isPhasorElementWithText(
  element: Selectable
): element is PhasorElementWithText {
  return element instanceof TextElement || element instanceof ShapeElement;
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

export function getXYWH(element: Selectable) {
  return isTopLevelBlock(element)
    ? element.xywh
    : serializeXYWH(element.x, element.y, element.w, element.h);
}

// https://developer.mozilla.org/en-US/docs/Web/CSS/cursor
export function getCursorMode(edgelessTool: EdgelessTool) {
  switch (edgelessTool.type) {
    case 'default':
      return 'default';
    case 'pan':
      return edgelessTool.panning ? 'grabbing' : 'grab';
    case 'brush':
    case 'eraser':
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
          child => child.flavour === 'affine:note'
        ) ?? [],
        modelX,
        modelY
      );
}

export function pickSurfaceElementById(
  surface: SurfaceManager,
  page: Page,
  id: string
) {
  const blocks =
    (page.root?.children.filter(
      child => child.flavour === 'affine:note'
    ) as TopLevelBlockModel[]) ?? [];
  const element = surface.pickById(id) || blocks.find(b => b.id === id);
  return element;
}

export function getBackgroundGrid(
  viewportX: number,
  viewportY: number,
  zoom: number,
  showGrid: boolean
) {
  const step = zoom < 0.5 ? 2 : 1 / (Math.floor(zoom) || 1);
  const gap = clamp(20 * step * zoom, GRID_GAP_MIN, GRID_GAP_MAX);
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

export function getSelectedRect(selected: Selectable[]): DOMRect {
  if (selected.length === 0) {
    return new DOMRect();
  }

  if (selected.length === 1) {
    const [x, y, w, h] = deserializeXYWH(selected[0].xywh);
    return new DOMRect(x, y, w, h);
  }

  return selected.reduce((bounds, selectable, index) => {
    const rotate = isTopLevelBlock(selectable) ? 0 : selectable.rotate;
    const [x, y, w, h] = deserializeXYWH(selectable.xywh);
    let { left, top, right, bottom } = getQuadBoundsWithRotation({
      x,
      y,
      w,
      h,
      rotate,
    });

    if (index !== 0) {
      left = Math.min(left, bounds.left);
      top = Math.min(top, bounds.top);
      right = Math.max(right, bounds.right);
      bottom = Math.max(bottom, bounds.bottom);
    }

    bounds.x = left;
    bounds.y = top;
    bounds.width = right - left;
    bounds.height = bottom - top;

    return bounds;
  }, new DOMRect());
}

export function getSelectableBounds(selected: Selectable[]): Map<
  string,
  {
    bound: Bound;
    rotate: number;
  }
> {
  const bounds = new Map<
    string,
    {
      bound: Bound;
      rotate: number;
    }
  >();
  for (const s of selected) {
    const bound = Bound.deserialize(s.xywh);
    let rotate = 0;

    if (!isTopLevelBlock(s)) {
      rotate = s.rotate ?? 0;
    }

    bounds.set(s.id, {
      bound,
      rotate,
    });
  }
  return bounds;
}

export function getEdgelessElement(
  edgeless: EdgelessPageBlockComponent,
  id: string
): EdgelessElement | null {
  return (
    edgeless.surface.pickById(id) ??
    <TopLevelBlockModel>edgeless.page.getBlockById(id) ??
    null
  );
}
