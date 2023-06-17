import { assertExists } from '@blocksuite/global/utils';
import type { BaseBlockModel, Page } from '@blocksuite/store';

import type { BookmarkBlockModel } from '../../bookmark-block/index.js';
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

type Props = Partial<BaseBlockModel>;

export const uploadImageFromLocal = async (
  page: Page,
  shouldReadImageSize = false
): Promise<Array<Props>> => {
  const storage = page.blobs;
  assertExists(storage);

  const baseProps: Props = { flavour: 'affine:image' };
  const fileInput = createImageInputElement();
  document.body.appendChild(fileInput);

  let resolvePromise: (value: Array<Props> | PromiseLike<Array<Props>>) => void;
  const pending = new Promise<Array<Props>>(resolve => {
    resolvePromise = resolve;
  });
  const onChange = async () => {
    if (!fileInput.files) return;

    const files = fileInput.files;
    const len = files.length;
    const res = [];
    let i = 0;

    for (; i < len; i++) {
      const file = files[i];
      const sourceId = await storage.set(file);
      const props = { ...baseProps, sourceId };
      if (shouldReadImageSize) {
        Object.assign(props, await readImageSize(file));
      }
      res.push(props);
    }

    resolvePromise(res);
    fileInput.removeEventListener('change', onChange);
    fileInput.remove();
  };

  fileInput.addEventListener('change', onChange);
  fileInput.click();
  return await pending;
};

type BookmarkProps = Partial<BookmarkBlockModel>;

export async function getBookmarkInitialProps(): Promise<BookmarkProps[]> {
  const bookmarkCreateModal = document.createElement('bookmark-create-modal');

  let resolvePromise: (
    value: Array<BookmarkProps> | PromiseLike<Array<BookmarkProps>>
  ) => void;
  const pending = new Promise<Array<BookmarkProps>>(resolve => {
    resolvePromise = resolve;
  });

  bookmarkCreateModal.onCancel = () => {
    resolvePromise([]);
    document.body.removeChild(bookmarkCreateModal);
  };
  bookmarkCreateModal.onConfirm = ({ url }) => {
    resolvePromise([{ flavour: 'affine:bookmark', url }]);
    document.body.removeChild(bookmarkCreateModal);
  };

  document.body.appendChild(bookmarkCreateModal);

  return await pending;
}

export function readImageSize(file: File) {
  return new Promise<{ width: number; height: number }>(resolve => {
    let width = 0;
    let height = 0;
    let reader: FileReader | null = new FileReader();
    reader.addEventListener('load', _ => {
      const img = new Image();
      img.onload = () => {
        width = img.width;
        height = img.height;
        reader = null;
        resolve({ width, height });
      };
      img.src = reader?.result as string;
    });
    reader.addEventListener('error', _ => {
      reader = null;
      resolve({ width, height });
    });
    reader.readAsDataURL(file);
  });
}
