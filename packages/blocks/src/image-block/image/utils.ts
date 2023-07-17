import { assertExists } from '@blocksuite/global/utils';
import type { BaseBlockModel } from '@blocksuite/store';
import { Buffer } from 'buffer';

import { getBlockElementByModel } from '../../__internal__/index.js';
import { toast } from '../../components/toast.js';
import type { ImageBlockModel } from '../image-model.js';

async function getImageBlob(model: BaseBlockModel) {
  const blob = await getBlobByModel(model);

  if (!blob) return null;

  if (!blob.type) {
    // FIXME: this file-type will be removed in future, see https://github.com/toeverything/AFFiNE/issues/3245
    // @ts-ignore
    const FileType = await import('file-type/browser');
    if (window.Buffer === undefined) {
      window.Buffer = Buffer;
    }
    const buffer = await blob.arrayBuffer();
    const fileType = await FileType.fromBuffer(buffer);

    if (!fileType?.mime.match(/^image\/(gif|png|jpe?g)$/)) return null;

    return new Blob([buffer], { type: fileType.mime });
  }

  return blob;
}

function convertToString(blob: Blob): Promise<string | null> {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.addEventListener('load', _ => resolve(reader.result as string));
    reader.addEventListener('error', () => resolve(null));
    reader.readAsDataURL(blob);
  });
}

function convertToPng(blob: Blob): Promise<Blob | null> {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.addEventListener('load', _ => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.width;
        c.height = img.height;
        const ctx = c.getContext('2d');
        assertExists(ctx);
        ctx.drawImage(img, 0, 0);
        c.toBlob(resolve, 'image/png');
      };
      img.onerror = () => resolve(null);
      img.src = reader.result as string;
    });
    reader.addEventListener('error', () => resolve(null));
    reader.readAsDataURL(blob);
  });
}

export async function copyImage(model: ImageBlockModel) {
  let blob = await getImageBlob(model);
  if (!blob) return;

  try {
    // @ts-ignore
    if (window.apis?.clipboard?.copyAsImageFromString) {
      const dataURL = await convertToString(blob);
      if (!dataURL) throw new Error('Cant convert a blob to data URL.');
      // @ts-ignore
      await window.apis.clipboard?.copyAsImageFromString(dataURL);
    } else {
      // DOMException: Type image/jpeg not supported on write.
      if (blob.type !== 'image/png') {
        blob = await convertToPng(blob);
      }

      if (!blob) return;

      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ]);
    }
    toast('Copied image to clipboard');
  } catch (err) {
    console.error(err);
  }
}

export async function downloadImage(model: BaseBlockModel) {
  const blob = await getImageBlob(model);
  if (!blob) return;

  const dataURL = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const event = new MouseEvent('click');
  a.download = 'image';
  a.href = dataURL;
  a.dispatchEvent(event);

  // cleanup
  a.remove();
  URL.revokeObjectURL(dataURL);
}

export function focusCaption(model: BaseBlockModel) {
  const blockEle = getBlockElementByModel(model);
  assertExists(blockEle);
  const dom = blockEle.querySelector(
    '.affine-embed-wrapper-caption'
  ) as HTMLInputElement;
  dom.classList.add('caption-show');
  dom.focus();
}

async function getBlobByModel(model: BaseBlockModel) {
  assertExists(model.sourceId);
  const store = await model.page.blobs;
  const blob = await store?.get(model.sourceId);
  return blob;
}
