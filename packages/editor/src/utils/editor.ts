import { BlockHub } from '@blocksuite/blocks';
import { asyncFocusRichText, tryUpdateFrameSize } from '@blocksuite/blocks';
import { getAllowSelectedBlocks } from '@blocksuite/blocks';
import { uploadImageFromLocal } from '@blocksuite/blocks';
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
    enable_database: !!page.awarenessStore.getFlag('enable_database'),
    onDropCallback: async (e, end) => {
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

      const targetModel = end.model;
      const rect = end.position;
      page.captureSync();
      const distanceToTop = Math.abs(rect.top - e.y);
      const distanceToBottom = Math.abs(rect.bottom - e.y);
      const ids = page.addSiblingBlocks(
        targetModel,
        props,
        distanceToTop < distanceToBottom ? 'before' : 'after'
      );
      if (ids.length === 1) {
        await asyncFocusRichText(page, ids[0]);
      }
      tryUpdateFrameSize(page, 1);
    },
  });

  if (editor.mode === 'page') {
    const defaultPageBlock = editor.querySelector('affine-default-page');
    assertExists(defaultPageBlock);
    blockHub.updateSelectedRectsSignal =
      defaultPageBlock.signals.updateSelectedRects;
    blockHub.getAllowedBlocks = () =>
      getAllowSelectedBlocks(defaultPageBlock.model);
  } else {
    const edgelessPageBlock = editor.querySelector('affine-edgeless-page');
    assertExists(edgelessPageBlock);
    blockHub.getAllowedBlocks = () =>
      getAllowSelectedBlocks(edgelessPageBlock.pageModel);
  }

  return blockHub;
};
