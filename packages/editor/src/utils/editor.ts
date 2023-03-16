import {
  asyncFocusRichText,
  BlockHub,
  EDGELESS_BLOCK_CHILD_PADDING,
  getAllowSelectedBlocks,
  getDefaultPage,
  getEdgelessPage,
  tryUpdateFrameSize,
  uploadImageFromLocal,
} from '@blocksuite/blocks';
import { assertExists } from '@blocksuite/global/utils';
import type { Page } from '@blocksuite/store';

import type { EditorContainer } from '../components/index.js';

export const checkEditorElementActive = () =>
  document.activeElement?.closest('editor-container') != null;

export const createBlockHub: (
  editor: EditorContainer,
  page: Page
) => BlockHub = (editor: EditorContainer, page: Page) => {
  const blockHub = new BlockHub({
    mouseRoot: editor,
    enableDatabase: !!page.awarenessStore.getFlag('enable_database'),
    onDropCallback: async (e, end, point) => {
      if (!page.root) {
        return;
      }
      const dataTransfer = e.dataTransfer;
      assertExists(dataTransfer);
      const data = dataTransfer.getData('affine/block-hub');
      let props = JSON.parse(data);
      if (props.flavour === 'affine:database') {
        if (!page.awarenessStore.getFlag('enable_database')) {
          console.warn('database block is not enabled');
          return;
        }
      }
      if (props.flavour === 'affine:embed' && props.type === 'image') {
        props = await uploadImageFromLocal(page);
      } else {
        props = [props];
      }

      if (end) {
        const { model, rect } = end;
        page.captureSync();
        const distanceToTop = Math.abs(rect.top - point.y);
        const distanceToBottom = Math.abs(rect.bottom - point.y);
        const ids = page.addSiblingBlocks(
          model,
          props,
          distanceToTop < distanceToBottom ? 'before' : 'after'
        );
        if (ids.length === 1) {
          asyncFocusRichText(page, ids[0]);
        }
      }

      if (editor.mode === 'page') {
        tryUpdateFrameSize(page, 1);
        return;
      }

      // In edgeless mode.
      const edgelessPageBlock = getEdgelessPage(page);
      assertExists(edgelessPageBlock);

      // Creates new frame block.
      if (!end) {
        page.captureSync();
        const { clientX, clientY } = e;
        const [x, y] = edgelessPageBlock.surface.toModelCoord(
          clientX - EDGELESS_BLOCK_CHILD_PADDING,
          clientY - EDGELESS_BLOCK_CHILD_PADDING
        );
        const xywh = `[${x},${y},720,480]`;
        const frameId = page.addBlock(
          'affine:frame',
          { xywh },
          page.root.id
        );
        const id = page.addBlock(props[0].flavour, {}, frameId);
        asyncFocusRichText(page, id);
      }

      tryUpdateFrameSize(page, edgelessPageBlock.surface.viewport.zoom);
    },
  });

  if (editor.mode === 'page') {
    const defaultPageBlock = getDefaultPage(page);
    assertExists(defaultPageBlock);
    blockHub.slots = defaultPageBlock.slots;
    blockHub.getAllowedBlocks = () =>
      getAllowSelectedBlocks(defaultPageBlock.model);
  } else {
    const edgelessPageBlock = getEdgelessPage(page);
    assertExists(edgelessPageBlock);
    blockHub.getAllowedBlocks = () =>
      getAllowSelectedBlocks(edgelessPageBlock.model);
  }

  return blockHub;
};
