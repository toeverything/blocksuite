import type { BaseBlockModel } from '@blocksuite/store';
import { type Page } from '@blocksuite/store';

import {
  type Connectable,
  type EdgelessElement,
  type EdgelessTool,
  type TopLevelBlockModel,
} from '../../../__internal__/index.js';
import type { FrameBlockModel } from '../../../index.js';
import type { NoteBlockModel } from '../../../note-block/index.js';
import {
  Bound,
  clamp,
  deserializeXYWH,
  getQuadBoundsWithRotation,
  GRID_GAP_MAX,
  GRID_GAP_MIN,
  type PhasorElement,
  type PhasorElementWithText,
  ShapeElement,
  type SurfaceViewport,
  TextElement,
} from '../../../surface-block/index.js';
import type { SurfaceBlockComponent } from '../../../surface-block/surface-block.js';
import type { EdgelessPageBlockComponent } from '../edgeless-page-block.js';
import type { Selectable } from '../services/tools-manager.js';

export function isTopLevelBlock(
  selectable: BaseBlockModel | Selectable | BaseBlockModel | null
): selectable is TopLevelBlockModel {
  return !!selectable && 'flavour' in selectable;
}

export function isNoteBlock(
  element: BaseBlockModel | EdgelessElement | null
): element is NoteBlockModel {
  return !!element && 'flavour' in element && element.flavour === 'affine:note';
}

export function isFrameBlock(
  element: BaseBlockModel | EdgelessElement | null
): element is FrameBlockModel {
  return (
    !!element && 'flavour' in element && element.flavour === 'affine:frame'
  );
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

export function isConnectable(
  element: EdgelessElement | null
): element is Connectable {
  return !!element && element.connectable;
}

export function getSelectionBoxBound(viewport: SurfaceViewport, bound: Bound) {
  const { w, h } = bound;
  const [x, y] = viewport.toViewCoord(bound.x, bound.y);
  return new DOMRect(x, y, w * viewport.zoom, h * viewport.zoom);
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
    case 'frame':
      return 'crosshair';
    case 'text':
      return 'text';
    default:
      return 'default';
  }
}

export function pickSurfaceElementById(
  surface: SurfaceBlockComponent,
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
) {
  return edgeless.surface.pickById(id) as EdgelessElement | null;
}
