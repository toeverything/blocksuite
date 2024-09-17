import type {
  EmbedCardStyle,
  EmbedSyncedDocModel,
} from '@blocksuite/affine-model';
import type { BlockComponent } from '@blocksuite/block-std';
import type { BlockModel } from '@blocksuite/store';

import { GfxControllerIdentifier } from '@blocksuite/block-std/gfx';
import { assertExists, Bound } from '@blocksuite/global/utils';

import type { OnDragEndProps } from '../../services/index.js';

import { getBlockProps } from '../model/index.js';

function isEmbedSyncedDocBlock(
  element: BlockModel | BlockSuite.EdgelessModel | null
): element is EmbedSyncedDocModel {
  return (
    !!element &&
    'flavour' in element &&
    element.flavour === 'affine:embed-synced-doc'
  );
}

/**
 * @deprecated
 * This is a terrible hack to apply the drag preview,
 * do not use it.
 * We're migrating to a standard drag and drop API.
 */
export function convertDragPreviewDocToEdgeless({
  blockComponent,
  dragPreview,
  cssSelector,
  width,
  height,
  noteScale,
  state,
}: OnDragEndProps & {
  blockComponent: BlockComponent;
  cssSelector: string;
  width?: number;
  height?: number;
  style?: EmbedCardStyle;
}): boolean {
  const edgelessRoot = blockComponent.closest('affine-edgeless-root');
  if (!edgelessRoot) {
    return false;
  }

  const previewEl = dragPreview.querySelector(cssSelector);
  if (!previewEl) {
    return false;
  }
  const rect = previewEl.getBoundingClientRect();
  const border = 2;
  const controller = blockComponent.std.get(GfxControllerIdentifier);
  const { viewport } = controller;
  const { left: viewportLeft, top: viewportTop } = viewport;
  const currentViewBound = new Bound(
    rect.x - viewportLeft,
    rect.y - viewportTop,
    rect.width + border / noteScale,
    rect.height + border / noteScale
  );
  const currentModelBound = viewport.toModelBound(currentViewBound);

  // Except for embed synced doc block
  // The width and height of other card style should be fixed
  const newBound = isEmbedSyncedDocBlock(blockComponent.model)
    ? new Bound(
        currentModelBound.x,
        currentModelBound.y,
        (currentModelBound.w ?? width) * noteScale,
        (currentModelBound.h ?? height) * noteScale
      )
    : new Bound(
        currentModelBound.x,
        currentModelBound.y,
        (width ?? currentModelBound.w) * noteScale,
        (height ?? currentModelBound.h) * noteScale
      );

  const blockModel = blockComponent.model;
  const blockProps = getBlockProps(blockModel);

  // @ts-ignore TODO: fix after edgeless refactor
  const blockId = edgelessRoot.service.addBlock(
    blockComponent.flavour,
    {
      ...blockProps,
      xywh: newBound.serialize(),
    },
    // @ts-ignore TODO: fix after edgeless refactor
    edgelessRoot.surfaceBlockModel
  );

  // Embed synced doc block should extend the note scale
  // @ts-ignore TODO: fix after edgeless refactor
  const newBlock = edgelessRoot.service.getElementById(blockId);
  if (isEmbedSyncedDocBlock(newBlock)) {
    // @ts-ignore TODO: fix after edgeless refactor
    edgelessRoot.service.updateElement(newBlock.id, {
      scale: noteScale,
    });
  }

  const doc = blockComponent.doc;
  const host = blockComponent.host;
  const altKey = state.raw.altKey;
  if (!altKey) {
    doc.deleteBlock(blockModel);
    host.selection.setGroup('note', []);
  }

  // @ts-ignore TODO: fix after edgeless refactor
  edgelessRoot.service.selection.set({
    elements: [blockId],
    editing: false,
  });

  return true;
}

/**
 * @deprecated
 * This is a terrible hack to apply the drag preview,
 * do not use it.
 * We're migrating to a standard drag and drop API.
 */
export function convertDragPreviewEdgelessToDoc({
  blockComponent,
  dropBlockId,
  dropType,
  state,
  style,
}: OnDragEndProps & {
  blockComponent: BlockComponent;
  style?: EmbedCardStyle;
}): boolean {
  const doc = blockComponent.doc;
  const host = blockComponent.host;
  const targetBlock = doc.getBlockById(dropBlockId);
  if (!targetBlock) return false;

  const shouldInsertIn = dropType === 'in';
  const parentBlock = shouldInsertIn ? targetBlock : doc.getParent(targetBlock);
  assertExists(parentBlock);
  const parentIndex = shouldInsertIn
    ? 0
    : parentBlock.children.indexOf(targetBlock) +
      (dropType === 'after' ? 1 : 0);

  const blockModel = blockComponent.model;

  const { width, height, xywh, rotate, zIndex, ...blockProps } =
    getBlockProps(blockModel);
  if (style) {
    blockProps.style = style;
  }

  doc.addBlock(
    blockModel.flavour as never,
    blockProps,
    parentBlock,
    parentIndex
  );

  const altKey = state.raw.altKey;
  if (!altKey) {
    doc.deleteBlock(blockModel);
    host.selection.setGroup('gfx', []);
  }

  return true;
}
