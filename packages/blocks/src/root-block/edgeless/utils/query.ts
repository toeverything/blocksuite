import type { PointLocation } from '@blocksuite/global/utils';
import type { BlockModel } from '@blocksuite/store';

import { deserializeXYWH } from '@blocksuite/global/utils';
import { Bound } from '@blocksuite/global/utils';

import type { EmbedBlockModel } from '../../../_common/embed-block-helper/embed-block-model.js';
import type { Connectable } from '../../../_common/utils/index.js';
import type { AttachmentBlockModel } from '../../../attachment-block/index.js';
import type { BookmarkBlockModel } from '../../../bookmark-block/bookmark-model.js';
import type { EdgelessTextBlockModel } from '../../../edgeless-text/edgeless-text-model.js';
import type { EmbedFigmaModel } from '../../../embed-figma-block/embed-figma-model.js';
import type { EmbedGithubModel } from '../../../embed-github-block/index.js';
import type { EmbedHtmlModel } from '../../../embed-html-block/index.js';
import type { EmbedLinkedDocModel } from '../../../embed-linked-doc-block/embed-linked-doc-model.js';
import type { EmbedLoomModel } from '../../../embed-loom-block/embed-loom-model.js';
import type { EmbedSyncedDocModel } from '../../../embed-synced-doc-block/embed-synced-doc-model.js';
import type { EmbedYoutubeModel } from '../../../embed-youtube-block/embed-youtube-model.js';
import type { FrameBlockModel } from '../../../frame-block/index.js';
import type { ImageBlockModel } from '../../../image-block/index.js';
import type { NoteBlockModel } from '../../../note-block/index.js';
import type { Viewport } from '../../../root-block/edgeless/utils/viewport.js';
import type { GfxBlockModel } from '../block-model.js';
import type { EdgelessTool } from '../types.js';

import {
  type CanvasElementWithText,
  ConnectorElementModel,
  GRID_GAP_MAX,
  GRID_GAP_MIN,
  MindmapElementModel,
  ShapeElementModel,
  TextElementModel,
  clamp,
  getQuadBoundsWithRotation,
} from '../../../surface-block/index.js';
import { getElementsWithoutGroup } from './group.js';

export function isMindmapNode(
  element: GfxBlockModel | BlockSuite.EdgelessModel | null
) {
  return element?.group instanceof MindmapElementModel;
}

export function isTopLevelBlock(
  selectable: BlockModel | BlockSuite.EdgelessModel | BlockModel | null
): selectable is GfxBlockModel {
  return !!selectable && 'flavour' in selectable;
}

export function isNoteBlock(
  element: BlockModel | BlockSuite.EdgelessModel | null
): element is NoteBlockModel {
  return !!element && 'flavour' in element && element.flavour === 'affine:note';
}

export function isEdgelessTextBlock(
  element: BlockModel | BlockSuite.EdgelessModel | null
): element is EdgelessTextBlockModel {
  return (
    !!element &&
    'flavour' in element &&
    element.flavour === 'affine:edgeless-text'
  );
}

export function isFrameBlock(
  element: BlockModel | BlockSuite.EdgelessModel | null
): element is FrameBlockModel {
  return (
    !!element && 'flavour' in element && element.flavour === 'affine:frame'
  );
}

export function isImageBlock(
  element: BlockModel | BlockSuite.EdgelessModel | null
): element is ImageBlockModel {
  return (
    !!element && 'flavour' in element && element.flavour === 'affine:image'
  );
}

export function isAttachmentBlock(
  element: BlockModel | BlockSuite.EdgelessModel | null
): element is AttachmentBlockModel {
  return (
    !!element && 'flavour' in element && element.flavour === 'affine:attachment'
  );
}

export function isBookmarkBlock(
  element: BlockModel | BlockSuite.EdgelessModel | null
): element is BookmarkBlockModel {
  return (
    !!element && 'flavour' in element && element.flavour === 'affine:bookmark'
  );
}

export function isEmbeddedBlock(
  element: BlockModel | BlockSuite.EdgelessModel | null
): element is EmbedBlockModel {
  return (
    !!element && 'flavour' in element && /affine:embed-*/.test(element.flavour)
  );
}

export function isEmbeddedLinkBlock(
  element: BlockModel | BlockSuite.EdgelessModel | null
) {
  return (
    isEmbeddedBlock(element) &&
    !isEmbedSyncedDocBlock(element) &&
    !isEmbedLinkedDocBlock(element)
  );
}

export function isEmbedGithubBlock(
  element: BlockModel | BlockSuite.EdgelessModel | null
): element is EmbedGithubModel {
  return (
    !!element &&
    'flavour' in element &&
    element.flavour === 'affine:embed-github'
  );
}

export function isEmbedYoutubeBlock(
  element: BlockModel | BlockSuite.EdgelessModel | null
): element is EmbedYoutubeModel {
  return (
    !!element &&
    'flavour' in element &&
    element.flavour === 'affine:embed-youtube'
  );
}

export function isEmbedLoomBlock(
  element: BlockModel | BlockSuite.EdgelessModel | null
): element is EmbedLoomModel {
  return (
    !!element && 'flavour' in element && element.flavour === 'affine:embed-loom'
  );
}

export function isEmbedFigmaBlock(
  element: BlockModel | BlockSuite.EdgelessModel | null
): element is EmbedFigmaModel {
  return (
    !!element &&
    'flavour' in element &&
    element.flavour === 'affine:embed-figma'
  );
}

export function isEmbedLinkedDocBlock(
  element: BlockModel | BlockSuite.EdgelessModel | null
): element is EmbedLinkedDocModel {
  return (
    !!element &&
    'flavour' in element &&
    element.flavour === 'affine:embed-linked-doc'
  );
}

export function isEmbedSyncedDocBlock(
  element: BlockModel | BlockSuite.EdgelessModel | null
): element is EmbedSyncedDocModel {
  return (
    !!element &&
    'flavour' in element &&
    element.flavour === 'affine:embed-synced-doc'
  );
}

export function isEmbedHtmlBlock(
  element: BlockModel | BlockSuite.EdgelessModel | null
): element is EmbedHtmlModel {
  return (
    !!element && 'flavour' in element && element.flavour === 'affine:embed-html'
  );
}

export function isCanvasElement(
  selectable: BlockSuite.EdgelessModel | null
): selectable is BlockSuite.SurfaceModel {
  return !isTopLevelBlock(selectable);
}

export function isCanvasElementWithText(
  element: BlockSuite.EdgelessModel
): element is CanvasElementWithText {
  return (
    element instanceof TextElementModel || element instanceof ShapeElementModel
  );
}

export function isConnectable(
  element: BlockSuite.EdgelessModel | null
): element is Connectable {
  return !!element && element.connectable;
}

export function getSelectionBoxBound(viewport: Viewport, bound: Bound) {
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
    case 'lasso':
      return 'crosshair';
    case 'text':
      return 'text';
    default:
      return 'default';
  }
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

export function getSelectedRect(selected: BlockSuite.EdgelessModel[]): DOMRect {
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

export type SelectableProps = {
  bound: Bound;
  rotate: number;
  path?: PointLocation[];
};

export function getSelectableBounds(
  selected: BlockSuite.EdgelessModel[]
): Map<string, SelectableProps> {
  const bounds = new Map();
  getElementsWithoutGroup(selected).forEach(ele => {
    const bound = Bound.deserialize(ele.xywh);
    const props: SelectableProps = {
      bound,
      rotate: ele.rotate,
    };

    if (isCanvasElement(ele) && ele instanceof ConnectorElementModel) {
      props.path = ele.absolutePath.map(p => p.clone());
    }

    bounds.set(ele.id, props);
  });

  return bounds;
}
