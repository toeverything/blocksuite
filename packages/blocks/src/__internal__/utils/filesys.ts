import { assertExists } from '@blocksuite/global/utils';
import type { BaseBlockModel, Page } from '@blocksuite/store';

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
  page: Page
): Promise<Array<Props>> => {
  const baseProps: Props = { flavour: 'affine:embed', type: 'image' };
  const fileInput = createImageInputElement();
  document.body.appendChild(fileInput);

  let resolvePromise: (value: Array<Props> | PromiseLike<Array<Props>>) => void;
  const pending = new Promise<Array<Props>>(resolve => {
    resolvePromise = resolve;
  });
  const onChange = async () => {
    if (!fileInput.files) return;
    const storage = await page.blobs;
    assertExists(storage);
    const files = fileInput.files;
    if (files.length === 1) {
      const id = await storage.set(files[0]);
      resolvePromise([{ ...baseProps, sourceId: id }]);
    } else {
      const res = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const id = await storage.set(file);
        res.push({ ...baseProps, sourceId: id });
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
