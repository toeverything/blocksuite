import type { Page } from '@blocksuite/store';
import type { EditorContainer } from '../components/index.js';
import { BlockHub } from '@blocksuite/blocks';
import { assertExists } from '@blocksuite/global/utils';
import { asyncFocusRichText, tryUpdateFrameSize } from '@blocksuite/blocks';
import { getAllowSelectedBlocks } from '@blocksuite/blocks';

export const checkEditorElementActive = () =>
  document.activeElement?.closest('editor-container') != null;

export const createBlockHub: (
  editor: EditorContainer,
  page: Page
) => BlockHub = (editor: EditorContainer, page: Page) => {
  const blockHub = new BlockHub({
    enable_database: !!page.awarenessStore.getFlag('enable_database'),
    onDropCallback: (e, end) => {
      const dataTransfer = e.dataTransfer;
      assertExists(dataTransfer);
      const data = dataTransfer.getData('affine/block-hub');
      const blockProps = JSON.parse(data);
      if (blockProps.flavour === 'affine:database') {
        if (!page.awarenessStore.getFlag('enable_database')) {
          console.warn('database block is not enabled');
          return;
        }
      }
      const targetModel = end.model;
      const rect = end.position;
      page.captureSync();
      const distanceToTop = Math.abs(rect.top - e.y);
      const distanceToBottom = Math.abs(rect.bottom - e.y);
      const id = page.addSiblingBlock(
        targetModel,
        blockProps,
        distanceToTop < distanceToBottom ? 'right' : 'left'
      );
      asyncFocusRichText(page, id);
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
