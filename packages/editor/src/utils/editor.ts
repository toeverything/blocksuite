import {
  asyncFocusRichText,
  BlockHub,
  getAllowSelectedBlocks,
  getBookmarkInitialProps,
  getEdgelessPage,
  getServiceOrRegister,
  uploadImageFromLocal,
} from '@blocksuite/blocks';
import {
  type BlockComponentElement,
  getClosestNoteBlockElementById,
  getHoveringNote,
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
      // To make sure get the current page
      const page = editor.page;
      const models = [];

      const isDatabase = data.flavour === 'affine:database';

      if (isDatabase && !page.awarenessStore.getFlag('enable_database')) {
        console.warn('database block is not enabled');
        return;
      }

      if (data.flavour === 'affine:image' && data.type === 'image') {
        models.push(
          ...(await uploadImageFromLocal(page.blobs)).map(({ sourceId }) => ({
            flavour: 'affine:image',
            sourceId,
          }))
        );
      } else if (data.flavour === 'affine:bookmark') {
        const url = await getBookmarkInitialProps();
        url &&
          models.push({
            flavour: 'affine:bookmark',
            url,
          });
      } else {
        models.push(data);
      }

      const defaultNoteBlock =
        page.root?.children.findLast(
          block => block.flavour === 'affine:note'
        ) ?? page.addBlock('affine:note', {}, page.root?.id);

      // add to end
      let lastId;
      models.forEach(model => {
        lastId = page.addBlock(
          model.flavour ?? 'affine:paragraph',
          model,
          defaultNoteBlock
        );
      });
      lastId && asyncFocusRichText(page, lastId);
    },
    onDrop: async (e, point, end, type) => {
      // To make sure get the current page
      const page = editor.page;
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
      if (props.flavour === 'affine:image' && props.type === 'image') {
        models.push(
          ...(await uploadImageFromLocal(page.blobs)).map(({ sourceId }) => ({
            flavour: 'affine:image',
            sourceId,
          }))
        );
      } else if (props.flavour === 'affine:bookmark') {
        const url = await getBookmarkInitialProps();
        url &&
          models.push({
            flavour: 'affine:bookmark',
            url,
          });
      } else {
        models.push(props);
      }

      // In some cases, like cancel bookmark initial modal, there will be no models.
      if (!models.length) return;

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
          service.initDatabaseBlock(page, model, focusId, 'table');
        }
      }

      if (editor.mode === 'page') {
        if (focusId) {
          asyncFocusRichText(page, focusId);
        }
        return;
      }

      // In edgeless mode.
      const pageBlock = getEdgelessPage(page);
      assertExists(pageBlock);

      let noteId;
      if (focusId && parentId) {
        const targetNoteBlock = getClosestNoteBlockElementById(
          parentId,
          pageBlock
        ) as BlockComponentElement;
        assertExists(targetNoteBlock);
        noteId = targetNoteBlock.model.id;
      } else {
        // Creates new note block on blank area.
        const result = pageBlock.addNewNote(
          models,
          point,
          isDatabase ? { width: 752 } : undefined
        );
        noteId = result.noteId;
        focusId = result.ids[0];
        const model = page.getBlockById(focusId);
        assertExists(model);
        if (isDatabase) {
          const service = await getServiceOrRegister<'affine:database'>(
            props.flavour
          );
          service.initDatabaseBlock(page, model, model.id, 'table');
        }
      }
      pageBlock.setSelection(noteId, true, focusId, point);
    },
    onDragStart: () => {
      if (editor.mode === 'page') {
        const docPageBlock = editor.querySelector('affine-doc-page');
        assertExists(docPageBlock);
        // FIXME:
        // defaultPageBlock.selection?.clear();
      }
    },
    getAllowedBlocks: () => {
      if (editor.mode === 'page') {
        const docPageBlock = editor.querySelector('affine-doc-page');
        assertExists(docPageBlock);
        return getAllowSelectedBlocks(docPageBlock.model);
      } else {
        const edgelessPageBlock = editor.querySelector('affine-edgeless-page');
        assertExists(edgelessPageBlock);
        return getAllowSelectedBlocks(edgelessPageBlock.model);
      }
    },
    getHoveringNoteState: (point: Point) => {
      const state = {
        scale: 1,
      } as {
        container?: Element;
        rect?: Rect;
        scale: number;
      };

      if (editor.mode === 'page') {
        const docPageBlock = editor.querySelector('affine-doc-page');
        assertExists(docPageBlock);
        const rect = Rect.fromDOMRect(
          docPageBlock.pageBlockContainer.getBoundingClientRect()
        );
        rect.height -= PAGE_BLOCK_PADDING_BOTTOM;
        state.rect = rect;
      } else {
        const edgelessPageBlock = editor.querySelector('affine-edgeless-page');
        assertExists(edgelessPageBlock);
        state.scale = edgelessPageBlock.surface.viewport.zoom;
        const container = getHoveringNote(point);
        if (container) {
          state.rect = Rect.fromDOM(container);
          state.container = container;
        }
      }
      return state;
    },
    page,
  });

  return blockHub;
};
