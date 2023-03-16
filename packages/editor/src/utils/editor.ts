import {
  asyncFocusRichText,
  BlockHub,
  getAllowSelectedBlocks,
  getEdgelessPage,
  tryUpdateFrameSize,
  uploadImageFromLocal,
} from '@blocksuite/blocks';
import { assertExists } from '@blocksuite/global/utils';
import type { BaseBlockModel, Page } from '@blocksuite/store';

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
      const blocks: Array<Partial<BaseBlockModel>> = [];
      const props = JSON.parse(data);
      if (props.flavour === 'affine:database') {
        if (!page.awarenessStore.getFlag('enable_database')) {
          console.warn('database block is not enabled');
          return;
        }
      }
      if (props.flavour === 'affine:embed' && props.type === 'image') {
        blocks.push(...(await uploadImageFromLocal(page)));
      } else {
        blocks.push(props);
      }

      if (end) {
        const { model, rect } = end;
        page.captureSync();
        const distanceToTop = Math.abs(rect.top - point.y);
        const distanceToBottom = Math.abs(rect.bottom - point.y);
        const ids = page.addSiblingBlocks(
          model,
          blocks,
          distanceToTop < distanceToBottom ? 'before' : 'after'
        );
        if (ids.length) {
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
        const [x, y] = edgelessPageBlock.surface.toModelCoord(clientX, clientY);
        const xywh = `[${x},${y},720,480]`;
        const frameId = page.addBlock(
          'affine:frame',
          { xywh },
          page.root.id
        );
        const ids = page.addBlocksByFlavour(
          blocks.map(({ flavour, ...blockProps }) => {
            assertExists(flavour);
            return {
              flavour,
              blockProps,
            };
          }),
          frameId
        );
        if (ids.length) {
          asyncFocusRichText(page, ids[0]);
        }
      }

      tryUpdateFrameSize(page, edgelessPageBlock.surface.viewport.zoom);
    },
  });

  if (editor.mode === 'page') {
    const defaultPageBlock = editor.querySelector('affine-default-page');
    assertExists(defaultPageBlock);
    blockHub.slots = defaultPageBlock.slots;
    blockHub.getAllowedBlocks = () =>
      getAllowSelectedBlocks(defaultPageBlock.model);
  } else {
    const edgelessPageBlock = editor.querySelector('affine-edgeless-page');
    assertExists(edgelessPageBlock);
    blockHub.getAllowedBlocks = () =>
      getAllowSelectedBlocks(edgelessPageBlock.model);
  }

  return blockHub;
};
