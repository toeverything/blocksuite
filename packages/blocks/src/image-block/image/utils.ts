import { assertExists } from '@blocksuite/global/utils';
import type { BaseBlockModel, Page } from '@blocksuite/store';
import { Buffer } from 'buffer';

import { toast } from '../../_common/components/toast.js';
import { downloadBlob } from '../../_common/utils/filesys.js';
import { getBlockComponentByModel } from '../../_common/utils/query.js';
import { ImageBlockModel, type ImageBlockProps } from '../image-model.js';

async function getImageBlob(model: ImageBlockModel) {
  const blob = await getBlobByModel(model);

  if (!blob) return null;

  if (!blob.type) {
    // FIXME: this file-type will be removed in future, see https://github.com/toeverything/AFFiNE/issues/3245
    // @ts-ignore
    const FileType = await import('file-type/browser.js');
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

export async function downloadImage(model: ImageBlockModel) {
  const blob = await getImageBlob(model);
  if (!blob) return;
  downloadBlob(blob, 'image');
}

export function focusCaption(model: BaseBlockModel) {
  const blockEle = getBlockComponentByModel(model);
  assertExists(blockEle);
  const dom = blockEle.querySelector(
    '.affine-embed-wrapper-caption'
  ) as HTMLInputElement;
  dom.classList.add('caption-show');
  dom.focus();
}

async function getBlobByModel(model: ImageBlockModel) {
  assertExists(model.sourceId);
  const store = model.page.blob;
  const blob = await store.get(model.sourceId);
  return blob;
}

export function shouldResizeImage(node: Node, target: EventTarget | null) {
  return !!(
    target &&
    target instanceof HTMLElement &&
    node.contains(target) &&
    target.classList.contains('resize')
  );
}

export async function uploadBlobForImage(
  page: Page,
  blockId: string,
  blob: Blob
): Promise<string> {
  const isLoading = isImageLoading(blockId);
  if (isLoading) {
    throw new Error('the image is already uploading!');
  }
  setImageLoading(blockId, true);
  const storage = page.blob;
  let sourceId = '';
  let imageBlock: BaseBlockModel | null;
  try {
    imageBlock = page.getBlockById(blockId);
    if (!imageBlock) {
      throw new Error('the attachment model is not found!');
    }
    if (!(imageBlock instanceof ImageBlockModel)) {
      console.error(imageBlock);
      throw new Error('the model is not an image model!');
    }
    sourceId = await storage.set(blob);
  } catch (error) {
    console.error(error);
    setImageLoading(blockId, false);
    if (error instanceof Error) {
      toast(
        `Failed to upload attachment! ${error.message || error.toString()}`
      );
    }
  }
  setImageLoading(blockId, false);
  page.withoutTransact(() => {
    if (imageBlock) {
      page.updateBlock(imageBlock, {
        sourceId,
      } satisfies Partial<ImageBlockProps>);
    }
  });
  return blockId;
}

const imageLoadingMap = new Set<string>();
export function setImageLoading(blockId: string, loading: boolean) {
  if (loading) {
    imageLoadingMap.add(blockId);
  } else {
    imageLoadingMap.delete(blockId);
  }
}

export function isImageLoading(blockId: string) {
  return imageLoadingMap.has(blockId);
}

export function addSiblingImageBlock(
  page: Page,
  file: File,
  targetModel: BaseBlockModel,
  place: 'after' | 'before' = 'after'
) {
  const imageBlockProps: Partial<ImageBlockProps> & {
    flavour: 'affine:image';
  } = {
    flavour: 'affine:image',
    size: file.size,
  };

  const blockId = page.addSiblingBlocks(targetModel, [imageBlockProps], place);
  return uploadBlobForImage(page, blockId[0], file);
}
