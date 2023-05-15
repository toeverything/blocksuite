import {
  asyncFocusRichText,
  BlockHub,
  getAllowSelectedBlocks,
  getEdgelessPage,
  getServiceOrRegister,
  tryUpdateFrameSize,
  uploadImageFromLocal,
} from '@blocksuite/blocks';
import {
  type BlockComponentElement,
  getClosestFrameBlockElementById,
  getCurrentBlockRange,
  getHoveringFrame,
  type Point,
  Rect,
} from '@blocksuite/blocks/std';
import { PAGE_BLOCK_PADDING_BOTTOM } from '@blocksuite/global/config';
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
    onClickCard: async (data: { flavour: string; type?: string }) => {
      const models = [];

      const isDatabase = data.flavour === 'affine:database';
      if (isDatabase && !page.awarenessStore.getFlag('enable_database')) {
        console.warn('database block is not enabled');
        return;
      }
      if (data.flavour === 'affine:embed' && data.type === 'image') {
        models.push(...(await uploadImageFromLocal(page)));
      } else {
        models.push(data);
      }
      const last = page.root?.lastItem();
      const range = getCurrentBlockRange(page);
      if (range) {
        const arr = page.addSiblingBlocks(range.models[0], models, 'after');
        const lastId = arr[arr.length - 1];
        asyncFocusRichText(page, lastId);
      } else if (last) {
        // add to end
        let lastId = page.root?.lastItem()?.id;
        models.forEach(model => {
          lastId = page.addBlock(
            model.flavour ?? 'affine:paragraph',
            model,
            page.root?.lastItem()
          );
        });
        lastId && asyncFocusRichText(page, lastId);
      }
    },
    onDrop: async (e, point, end, type) => {
      const dataTransfer = e.dataTransfer;
      assertExists(dataTransfer);
      const data = dataTransfer.getData('affine/block-hub');
      const models = [];
      const props = JSON.parse(data);
      const isDatabase = props.flavour === 'affine:database';
      if (isDatabase && !page.awarenessStore.getFlag('enable_database')) {
        console.warn('database block is not enabled');
        return;
      }
      if (props.flavour === 'affine:embed' && props.type === 'image') {
        models.push(...(await uploadImageFromLocal(page)));
      } else {
        models.push(props);
      }

      let parentId;
      let focusId;
      if (end && type !== 'none') {
        const { model } = end;

        page.captureSync();

        if (type === 'database') {
          const ids = page.addBlocks(models, model);
          focusId = ids[0];
          parentId = model.id;
        } else {
          const parent = page.getParent(model);
          assertExists(parent);
          const ids = page.addSiblingBlocks(model, models, type);
          focusId = ids[0];
          parentId = parent.id;
        }

        // database init basic structure
        if (isDatabase) {
          const service = await getServiceOrRegister<'affine:database'>(
            props.flavour
          );
          service.initDatabaseBlock(page, model, focusId);
        }
      }

      if (editor.mode === 'page') {
        if (focusId) {
          asyncFocusRichText(page, focusId);
          tryUpdateFrameSize(page, 1);
        }
        return;
      }

      // In edgeless mode.
      const pageBlock = getEdgelessPage(page);
      assertExists(pageBlock);

      let frameId;
      if (focusId && parentId) {
        const targetFrameBlock = getClosestFrameBlockElementById(
          parentId,
          pageBlock
        ) as BlockComponentElement;
        assertExists(targetFrameBlock);
        frameId = targetFrameBlock.model.id;
      } else {
        // Creates new frame block on blank area.
        const result = pageBlock.addNewFrame(models, point);
        frameId = result.frameId;
        focusId = result.ids[0];
      }
      pageBlock.setSelection(frameId, true, focusId, point);
    },
    onDragStart: () => {
      if (editor.mode === 'page') {
        const defaultPageBlock = editor.querySelector('affine-default-page');
        assertExists(defaultPageBlock);
        defaultPageBlock.selection.clear();
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
        scale: 1,
      } as { container?: Element; rect?: Rect; scale: number };

      if (editor.mode === 'page') {
        const defaultPageBlock = editor.querySelector('affine-default-page');
        assertExists(defaultPageBlock);
        const rect = Rect.fromDOMRect(
          defaultPageBlock.pageBlockContainer.getBoundingClientRect()
        );
        rect.height -= PAGE_BLOCK_PADDING_BOTTOM;
        state.rect = rect;
      } else {
        const edgelessPageBlock = editor.querySelector('affine-edgeless-page');
        assertExists(edgelessPageBlock);
        state.scale = edgelessPageBlock.surface.viewport.zoom;
        const container = getHoveringFrame(point);
        if (container) {
          state.rect = Rect.fromDOM(container);
          state.container = container;
        }
      }
      return state;
    },
  });

  return blockHub;
};
