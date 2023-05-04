import type { EdgelessPageBlockComponent } from '@blocksuite/blocks';
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
  getDefaultPage,
  getHoveringFrame,
  isDefaultPage,
  type Point,
  Rect,
} from '@blocksuite/blocks/std';
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
    onDropCallback: async (e, point, end, type) => {
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

        if (focusId) {
          // database init basic structure
          if (isDatabase) {
            const service = await getServiceOrRegister(props.flavour);
            service.initDatabaseBlock(page, model, focusId);
          }
        }

        if (editor.mode === 'page') {
          asyncFocusRichText(page, focusId);
          tryUpdateFrameSize(page, 1);
          return;
        }
      }

      // In edgeless mode.
      const pageBlock = getEdgelessPage(page) || getDefaultPage(page);
      assertExists(pageBlock);

      let frameId;
      if (focusId && parentId) {
        const targetFrameBlock = getClosestFrameBlockElementById(
          parentId,
          pageBlock
        ) as BlockComponentElement;
        assertExists(targetFrameBlock);
        frameId = targetFrameBlock.model.id;
      } else if (isDefaultPage(pageBlock)) {
        models.forEach(model => page.addBlock(model.flavour, model, model));
        return;
      } else {
        // Creates new frame block on blank area.
        const result = (pageBlock as EdgelessPageBlockComponent).addNewFrame(
          models,
          point
        );
        frameId = result.frameId;
        focusId = result.ids[0];
      }
      (pageBlock as EdgelessPageBlockComponent).setSelection(
        frameId,
        true,
        focusId,
        point
      );
    },
    onDragStarted: () => {
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
        state.rect = defaultPageBlock.innerRect;
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
