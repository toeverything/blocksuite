import { BlockHub } from '@blocksuite/blocks';
import { asyncFocusRichText, tryUpdateFrameSize } from '@blocksuite/blocks';
import { getAllowSelectedBlocks } from '@blocksuite/blocks';
import { assertExists } from '@blocksuite/global/utils';
import type { Page } from '@blocksuite/store';
import type { BaseBlockModel } from '@blocksuite/store';

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
        props = await handleImageInsert(editor, props);
      }
      const targetModel = end.model;
      const rect = end.position;
      page.captureSync();
      const distanceToTop = Math.abs(rect.top - e.y);
      const distanceToBottom = Math.abs(rect.bottom - e.y);
      const id = page.addSiblingBlocks(
        targetModel,
        props,
        distanceToTop < distanceToBottom ? 'right' : 'left'
      );
      if (!Array.isArray(id)) {
        await asyncFocusRichText(page, id);
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

export const createImageInputElement = () => {
  const fileInput: HTMLInputElement = document.createElement('input');
  fileInput.type = 'file';
  fileInput.multiple = true;
  fileInput.accept = 'image/*';
  fileInput.style.position = 'fixed';
  fileInput.style.left = '0';
  fileInput.style.top = '0';
  fileInput.style.opacity = '0.001';
  return fileInput;
};

export const handleImageInsert = async <
  Props extends Partial<BaseBlockModel> = Partial<BaseBlockModel>
>(
  editor: EditorContainer,
  props: Props
): Promise<Props | Array<Props>> => {
  const fileInput = createImageInputElement();
  document.body.appendChild(fileInput);

  let resolvePromise: (
    value: Props | Array<Props> | PromiseLike<Props | Array<Props>>
  ) => void;
  const pending = new Promise<Props | Array<Props>>(resolve => {
    resolvePromise = resolve;
  });
  const onChange = async () => {
    if (!fileInput.files) return;
    const storage = await editor.page.blobs;
    assertExists(storage);
    const files = fileInput.files;
    if (files.length === 1) {
      const id = await storage.set(files[0]);
      props.sourceId = id;
      resolvePromise(props);
    } else {
      const res = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const id = await storage.set(file);
        res.push({ ...props, sourceId: id });
      }
      resolvePromise(res);
    }

    fileInput.removeEventListener('change', onChange);
    fileInput.remove();
  };

  fileInput.addEventListener('change', onChange);
  fileInput.click();
  return await pending;
};
