import {
  asyncFocusRichText,
  BlockHub,
  getAllowSelectedBlocks,
  getEdgelessPage,
  getServiceOrRegister,
  tryUpdateFrameSize,
  uploadImageFromLocal,
} from '@blocksuite/blocks';
import { getHoveringFrame, Point, Rect } from '@blocksuite/blocks/std';
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
      const dataTransfer = e.dataTransfer;
      assertExists(dataTransfer);
      const data = dataTransfer.getData('affine/block-hub');
      const blocks = [];
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

        // database init basic structure
        if (props.flavour === 'affine:database') {
          const service = await getServiceOrRegister(props.flavour);
          service.initDatabaseBlock(page, model, ids[0]);
        }

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
        const ids = edgelessPageBlock.addNewFrame(
          blocks,
          new Point(e.clientX, e.clientY)
        );
        if (ids.length) {
          asyncFocusRichText(page, ids[0]);
        }
      }

      tryUpdateFrameSize(page, edgelessPageBlock.surface.viewport.zoom);
    },
    onDragStarted: () => {
      if (editor.mode === 'page') {
        const defaultPageBlock = editor.querySelector('affine-default-page');
        assertExists(defaultPageBlock);
        defaultPageBlock.slots.selectedRectsUpdated.emit([]);
      }
    },
    getAllowedBlocks: () => {
      if (editor.mode === 'page') {
        const defaultPageBlock = editor.querySelector('affine-default-page');
        assertExists(defaultPageBlock);
        return getAllowSelectedBlocks(defaultPageBlock.model);
      } else {
        const edgelessPageBlock = editor.querySelector('affine-edgeless-page');
        assertExists(edgelessPageBlock);
        return getAllowSelectedBlocks(edgelessPageBlock.model);
      }
    },
    getHoveringFrameState: (point: Point) => {
      const state = {
        rect: null,
        scale: 1,
      } as { rect: Rect | null; scale: number };

      if (editor.mode === 'page') {
        const defaultPageBlock = editor.querySelector('affine-default-page');
        assertExists(defaultPageBlock);
        state.rect = defaultPageBlock.innerRect;
      } else {
        const edgelessPageBlock = editor.querySelector('affine-edgeless-page');
        assertExists(edgelessPageBlock);
        state.scale = edgelessPageBlock.surface.viewport.zoom;
        const hoveringFrame = getHoveringFrame(point);
        if (hoveringFrame) {
          state.rect = Rect.fromDOM(hoveringFrame);
        }
      }
      return state;
    },
  });

  return blockHub;
};
