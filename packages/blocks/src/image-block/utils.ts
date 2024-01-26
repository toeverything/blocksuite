import { assertExists } from '@blocksuite/global/utils';
import type { EditorHost } from '@blocksuite/lit';
import type { BlockModel } from '@blocksuite/store';
import { Buffer } from 'buffer';
import FileType from 'file-type/browser.js';

import { withTempBlobData } from '../_common/utils/filesys.js';
import { humanFileSize } from '../_common/utils/math.js';
import type { AttachmentBlockProps } from '../attachment-block/attachment-model.js';
import { readImageSize } from '../page-block/edgeless/components/utils.js';
import { transformModel } from '../page-block/utils/operations/model.js';
import { toast } from './../_common/components/toast.js';
import type { ImageBlockComponent } from './image-block.js';
import type { ImageBlockModel, ImageBlockProps } from './image-model.js';

const MAX_RETRY_COUNT = 3;
const DEFAULT_ATTACHMENT_NAME = 'affine-attachment';

const imageUploads = new Set<string>();
export function setImageUploading(blockId: string) {
  imageUploads.add(blockId);
}
export function setImageUploaded(blockId: string) {
  imageUploads.delete(blockId);
}
export function isImageUploading(blockId: string) {
  return imageUploads.has(blockId);
}

export async function uploadBlobForImage(
  editorHost: EditorHost,
  blockId: string,
  blob: Blob
): Promise<void> {
  if (isImageUploading(blockId)) {
    throw new Error('The image is already uploading!');
  }
  setImageUploading(blockId);
  const page = editorHost.page;
  let sourceId: string | undefined;

  try {
    setImageUploaded(blockId);
    sourceId = await page.blob.set(blob);
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      toast(
        editorHost,
        `Failed to upload image! ${error.message || error.toString()}`
      );
    }
  } finally {
    setImageUploaded(blockId);

    const imageModel = page.getBlockById(blockId) as ImageBlockModel | null;
    assertExists(imageModel);

    page.withoutTransact(() => {
      page.updateBlock(imageModel, {
        sourceId,
      } satisfies Partial<ImageBlockProps>);
    });
  }
}

async function getImageBlob(model: ImageBlockModel) {
  const sourceId = model.sourceId;
  if (!sourceId) {
    return null;
  }

  const page = model.page;
  const blob = await page.blob.get(sourceId);

  if (blob && !blob.type) {
    // FIXME: See https://github.com/toeverything/AFFiNE/issues/3245
    // https://github.com/toeverything/AFFiNE/pull/4845
    // https://github.com/toeverything/blocksuite/issues/5097
    // @ts-ignore
    if (window.Buffer === undefined) {
      window.Buffer = Buffer;
    }
    const buffer = await blob.arrayBuffer();
    const fileType = await FileType.fromBuffer(buffer);

    if (!fileType?.mime.match(/^image\/(gif|png|jpe?g)$/)) {
      return null;
    }

    return new Blob([buffer], { type: fileType.mime });
  }

  return blob;
}

export async function checkImageBlob(block: ImageBlockComponent) {
  try {
    block.loading = true;
    block.error = false;
    block.blob = undefined;
    if (block.blobUrl) {
      URL.revokeObjectURL(block.blobUrl);
      block.blobUrl = undefined;
    }

    const { model } = block;
    const { id, sourceId } = model;

    if (isImageUploading(id)) {
      return;
    }

    if (!sourceId) {
      throw new Error('Image sourceId is missing!');
    }

    const blob = await getImageBlob(model);
    if (!blob) {
      throw new Error('Image blob is missing!');
    }

    if (!blob.type.startsWith('image/')) {
      throw new Error('Image blob is not an image!');
    }

    block.loading = false;
    block.blob = blob;
    block.blobUrl = URL.createObjectURL(blob);
  } catch (error) {
    block.retryCount++;
    console.warn(`${error}, retrying`, block.retryCount);

    if (block.retryCount < MAX_RETRY_COUNT) {
      setTimeout(() => {
        checkImageBlob(block).catch(console.error);
        // 1s, 2s, 3s
      }, 1000 * block.retryCount);
    } else {
      block.loading = false;
      block.error = true;
    }
  }
}

export async function downloadImageBlob(block: ImageBlockComponent) {
  const { host, loading, error, downloading, blobUrl } = block;
  if (downloading) {
    toast(host, 'Download in progress...');
    return;
  }

  if (loading) {
    toast(host, 'Please wait, image is loading...');
    return;
  }

  if (error || !blobUrl) {
    toast(host, `Failed to download image!`);
    return;
  }

  block.downloading = true;

  toast(host, `Downloading image`);

  const tmpLink = document.createElement('a');
  const event = new MouseEvent('click');
  tmpLink.download = 'image';
  tmpLink.href = blobUrl;
  tmpLink.dispatchEvent(event);
  tmpLink.remove();

  block.downloading = false;
}

export async function resetImageSize(block: ImageBlockComponent) {
  const { blob, model } = block;
  if (!blob) {
    return;
  }

  const file = new File([blob], 'image.png', { type: blob.type });
  const size = await readImageSize(file);
  block.page.updateBlock(model, {
    width: size.width,
    height: size.height,
  });
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

export async function copyImageBlob(blockElement: ImageBlockComponent) {
  const { host, model } = blockElement;
  let blob = await getImageBlob(model);
  if (!blob) {
    return;
  }

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

      if (!blob) {
        return;
      }

      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ]);
    }

    toast(host, 'Copied image to clipboard');
  } catch (error) {
    console.error(error);
  }
}

export function shouldResizeImage(node: Node, target: EventTarget | null) {
  return !!(
    target &&
    target instanceof HTMLElement &&
    node.contains(target) &&
    target.classList.contains('resize')
  );
}

export function addSiblingImageBlock(
  editorHost: EditorHost,
  files: File[],
  maxFileSize: number,
  targetModel: BlockModel,
  place: 'after' | 'before' = 'after'
) {
  const imageFiles = files.filter(file => file.type.startsWith('image/'));
  if (!imageFiles.length) {
    return;
  }

  const isSizeExceeded = imageFiles.some(file => file.size > maxFileSize);
  if (isSizeExceeded) {
    toast(
      editorHost,
      `You can only upload files less than ${humanFileSize(
        maxFileSize,
        true,
        0
      )}`
    );
    return;
  }

  const imageBlockProps: Partial<ImageBlockProps> &
    {
      flavour: 'affine:image';
    }[] = imageFiles.map(file => ({
    flavour: 'affine:image',
    size: file.size,
  }));

  const page = editorHost.page;
  const blockIds = page.addSiblingBlocks(targetModel, imageBlockProps, place);
  blockIds.map(
    (blockId, index) =>
      void uploadBlobForImage(editorHost, blockId, imageFiles[index])
  );
  return blockIds;
}

export function addImageBlocks(
  editorHost: EditorHost,
  files: File[],
  maxFileSize: number,
  parent?: BlockModel | string | null,
  parentIndex?: number
) {
  const imageFiles = files.filter(file => file.type.startsWith('image/'));
  if (!imageFiles.length) {
    return;
  }

  const isSizeExceeded = imageFiles.some(file => file.size > maxFileSize);
  if (isSizeExceeded) {
    toast(
      editorHost,
      `You can only upload files less than ${humanFileSize(
        maxFileSize,
        true,
        0
      )}`
    );
    return;
  }

  const page = editorHost.page;
  const blockIds = imageFiles.map(file =>
    page.addBlock('affine:image', { size: file.size }, parent, parentIndex)
  );
  blockIds.map(
    (blockId, index) =>
      void uploadBlobForImage(editorHost, blockId, imageFiles[index])
  );
  return blockIds;
}

/**
 * Turn the image block into a attachment block.
 */
export function turnImageIntoCardView(block: ImageBlockComponent) {
  const page = block.page;
  if (!page.schema.flavourSchemaMap.has('affine:attachment')) {
    throw new Error('The attachment flavour is not supported!');
  }

  const model = block.model;
  const blob = block.blob;
  if (!model.sourceId || !blob) {
    throw new Error('Image data not available');
  }

  const sourceId = model.sourceId;
  assertExists(sourceId);

  const { saveImageData, getAttachmentData } = withTempBlobData();
  saveImageData(sourceId, { width: model.width, height: model.height });
  const attachmentConvertData = getAttachmentData(model.sourceId);
  const attachmentProp: Partial<AttachmentBlockProps> = {
    sourceId,
    name: DEFAULT_ATTACHMENT_NAME,
    size: blob.size,
    type: blob.type,
    caption: model.caption,
    ...attachmentConvertData,
  };
  transformModel(model, 'affine:attachment', attachmentProp);
}
