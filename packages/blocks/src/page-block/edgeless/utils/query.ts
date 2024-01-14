import type { BlockModel } from '@blocksuite/store';
import { type Page } from '@blocksuite/store';

import type { EmbedBlockModel } from '../../../_common/embed-block-helper/embed-block-model.js';
import {
  type Connectable,
  type EdgelessElement,
  type EdgelessTool,
  type Selectable,
  type TopLevelBlockModel,
} from '../../../_common/utils/index.js';
import type { BookmarkBlockModel } from '../../../bookmark-block/bookmark-model.js';
import type { EmbedGithubModel } from '../../../embed-github-block/index.js';
import type { EmbedLinkedDocModel } from '../../../embed-linked-doc-block/embed-linked-doc-model.js';
import type { EmbedYoutubeModel } from '../../../embed-youtube-block/embed-youtube-model.js';
import type { FrameBlockModel } from '../../../frame-block/index.js';
import type { ImageBlockModel } from '../../../image-block/index.js';
import type { NoteBlockModel } from '../../../note-block/index.js';
import {
  Bound,
  type CanvasElement,
  type CanvasElementWithText,
  clamp,
  deserializeXYWH,
  getQuadBoundsWithRotation,
  GRID_GAP_MAX,
  GRID_GAP_MIN,
  ShapeElement,
  type SurfaceViewport,
  TextElement,
} from '../../../surface-block/index.js';
import { getElementsWithoutGroup } from '../../../surface-block/managers/group-manager.js';
import type { SurfaceBlockComponent } from '../../../surface-block/surface-block.js';

export function isTopLevelBlock(
  selectable: BlockModel | Selectable | BlockModel | null
): selectable is TopLevelBlockModel {
  return !!selectable && 'flavour' in selectable;
}

export function isNoteBlock(
  element: BlockModel | EdgelessElement | null
): element is NoteBlockModel {
  return !!element && 'flavour' in element && element.flavour === 'affine:note';
}

export function isFrameBlock(
  element: BlockModel | EdgelessElement | null
): element is FrameBlockModel {
  return (
    !!element && 'flavour' in element && element.flavour === 'affine:frame'
  );
}

export function isImageBlock(
  element: BlockModel | EdgelessElement | null
): element is ImageBlockModel {
  return (
    !!element && 'flavour' in element && element.flavour === 'affine:image'
  );
}

export function isBookmarkBlock(
  element: BlockModel | EdgelessElement | null
): element is BookmarkBlockModel {
  return (
    !!element && 'flavour' in element && element.flavour === 'affine:bookmark'
  );
}

export function isEmbeddedBlock(
  element: BlockModel | EdgelessElement | null
): element is EmbedBlockModel {
  return (
    !!element && 'flavour' in element && /affine:embed-*/.test(element.flavour)
  );
}

export function isEmbedGithubBlock(
  element: BlockModel | EdgelessElement | null
): element is EmbedGithubModel {
  return (
    !!element &&
    'flavour' in element &&
    element.flavour === 'affine:embed-github'
  );
}

export function isEmbedYoutubeBlock(
  element: BlockModel | EdgelessElement | null
): element is EmbedYoutubeModel {
  return (
    !!element &&
    'flavour' in element &&
    element.flavour === 'affine:embed-youtube'
  );
}

export function isEmbedLinkedDocBlock(
  element: BlockModel | EdgelessElement | null
): element is EmbedLinkedDocModel {
  return (
    !!element &&
    'flavour' in element &&
    element.flavour === 'affine:embed-linked-doc'
  );
}

export function isCanvasElement(
  selectable: Selectable | null
): selectable is CanvasElement {
  return !isTopLevelBlock(selectable);
}

export function isCanvasElementWithText(
  element: Selectable
): element is CanvasElementWithText {
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

export function getBackgroundGrid(zoom: number, showGrid: boolean) {
  const step = zoom < 0.5 ? 2 : 1 / (Math.floor(zoom) || 1);
  const gap = clamp(20 * step * zoom, GRID_GAP_MIN, GRID_GAP_MAX);

  return {
    gap,
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

  return getElementsWithoutGroup(selected).reduce(
    (bounds, selectable, index) => {
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
    },
    new DOMRect()
  );
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
  getElementsWithoutGroup(selected).forEach(ele => {
    const bound = Bound.deserialize(ele.xywh);

    bounds.set(ele.id, {
      bound,
      rotate: ele.rotate,
    });
  });

  return bounds;
}
