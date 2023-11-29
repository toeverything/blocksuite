import { assertExists } from '@blocksuite/global/utils';
import type { Page } from '@blocksuite/store';
import { type BaseBlockModel, type BlobManager } from '@blocksuite/store';

import { toast } from '../_common/components/toast.js';
import { downloadBlob, withTempBlobData } from '../_common/utils/filesys.js';
import { humanFileSize } from '../_common/utils/math.js';
import type {
  ImageBlockModel,
  ImageBlockProps,
} from '../image-block/image-model.js';
import { transformModel } from '../page-block/utils/operations/model.js';
import {
  AttachmentBlockModel,
  type AttachmentBlockProps,
} from './attachment-model.js';
import { defaultAttachmentProps } from './attachment-model.js';

const DEFAULT_ATTACHMENT_NAME = 'affine-attachment';

export function cloneAttachmentProperties(
  model: BaseBlockModel<AttachmentBlockModel>
) {
  const clonedProps = {} as AttachmentBlockProps;
  for (const cur in defaultAttachmentProps) {
    const key = cur as keyof AttachmentBlockProps;
    // @ts-expect-error it's safe because we just cloned the props simply
    clonedProps[key] = model[
      key
    ] as AttachmentBlockProps[keyof AttachmentBlockProps];
  }
  return clonedProps;
}

export async function getAttachmentBlob(model: AttachmentBlockModel) {
  const blobManager = model.page.blob;
  const sourceId = model.sourceId;
  if (!sourceId) return null;

  const blob = await blobManager.get(sourceId);
  if (!blob) return null;
  return blob;
}

/**
 * Since the size of the attachment may be very large,
 * the download process may take a long time!
 */
export async function downloadAttachmentBlob(
  attachmentModel: AttachmentBlockModel
) {
  const attachment = await getAttachmentBlob(attachmentModel);
  if (!attachment) {
    toast('Failed to download attachment!');
    console.error(
      'attachment load failed! sourceId:',
      attachmentModel.sourceId,
      'BlobManager:',
      attachmentModel.page.blob
    );
    return;
  }
  downloadBlob(attachment, attachmentModel.name);
}

/**
 * Turn the attachment block into an image block.
 */
export async function turnIntoImage(model: AttachmentBlockModel) {
  if (!model.page.schema.flavourSchemaMap.has('affine:image'))
    throw new Error('The image flavour is not supported!');

  const sourceId = model.sourceId;
  assertExists(sourceId);
  const { saveAttachmentData, getImageData } = withTempBlobData();
  saveAttachmentData(sourceId, { name: model.name });
  const imageConvertData = model.sourceId
    ? getImageData(model.sourceId)
    : undefined;
  const imageProp: Partial<ImageBlockProps> = {
    sourceId,
    caption: model.caption,
    ...imageConvertData,
  };
  transformModel(model, 'affine:image', imageProp);
}

/**
 * Turn the image block into a attachment block.
 */
export function turnImageIntoCardView(model: ImageBlockModel, blob: Blob) {
  if (!model.page.schema.flavourSchemaMap.has('affine:attachment'))
    throw new Error('The attachment flavour is not supported!');

  const sourceId = model.sourceId;
  assertExists(sourceId);
  const { saveImageData, getAttachmentData } = withTempBlobData();
  saveImageData(sourceId, { width: model.width, height: model.height });
  const attachmentConvertData = getAttachmentData(model.sourceId);
  const attachmentProp: AttachmentBlockProps = {
    sourceId,
    name: DEFAULT_ATTACHMENT_NAME,
    size: blob.size,
    type: blob.type,
    caption: model.caption,
    embed: false,
    ...attachmentConvertData,
  };
  transformModel(model, 'affine:attachment', attachmentProp);
}

/**
 * This function will not verify the size of the file.
 *
 * NOTE: This function may take a long time!
 *
 * @internal
 */
export async function uploadBlobForAttachment(
  page: Page,
  attachmentModelId: string,
  blob: Blob
) {
  const isLoading = isAttachmentLoading(attachmentModelId);
  if (isLoading) {
    throw new Error('the attachment is already uploading!');
  }
  setAttachmentLoading(attachmentModelId, true);
  const storage = page.blob;
  // The original file name can not be modified after the file is uploaded to the storage,
  // so we create a new file with a fixed name to prevent privacy leaks.
  // const anonymousFile = new File([file.slice(0, file.size)], 'anonymous', {
  //   type: file.type,
  // });
  try {
    // the uploading process may take a long time!
    const sourceId = await storage.set(blob);
    // await new Promise(resolve => setTimeout(resolve, 1000));
    const attachmentModel = page.getBlockById(attachmentModelId);
    if (!attachmentModel) {
      // It occurs when the block is deleted before the uploading process is finished.
      throw new Error('the attachment model is not found!');
    }
    if (!(attachmentModel instanceof AttachmentBlockModel)) {
      console.error(attachmentModel);
      throw new Error('the model is not an attachment model!');
    }
    page.withoutTransact(() => {
      page.updateBlock(attachmentModel, {
        sourceId,
      } satisfies Partial<AttachmentBlockProps>);
    });
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      toast(
        `Failed to upload attachment! ${error.message || error.toString()}`
      );
    }
  } finally {
    setAttachmentLoading(attachmentModelId, false);
  }
}

/**
 * Append a new attachment block after the specified block.
 */
export async function appendAttachmentBlock(
  file: File,
  model: BaseBlockModel,
  maxFileSize: number
): Promise<void> {
  if (file.size > maxFileSize) {
    toast(
      `You can only upload files less than ${humanFileSize(
        maxFileSize,
        true,
        0
      )}`
    );
    return;
  }

  const page = model.page;
  const blockId = page.generateBlockId();
  const props: AttachmentBlockProps & {
    id: string;
    flavour: 'affine:attachment';
  } = {
    id: blockId,
    flavour: 'affine:attachment',
    name: file.name,
    size: file.size,
    type: file.type,
    embed: false,
  };
  const [newBlockId] = page.addSiblingBlocks(model, [props]);
  // Do not add await here, because upload may take a long time, we want to do it in the background.
  uploadBlobForAttachment(page, newBlockId, file);
}

const attachmentLoadingMap = new Set<string>();
export function setAttachmentLoading(modelId: string, loading: boolean) {
  if (loading) {
    attachmentLoadingMap.add(modelId);
  } else {
    attachmentLoadingMap.delete(modelId);
  }
}

export function isAttachmentLoading(modelId: string) {
  return attachmentLoadingMap.has(modelId);
}

/**
 * Use it with caution! This function may take a long time!
 *
 * @deprecated Use {@link getAttachmentBlob} instead.
 */
export async function hasBlob(storage: BlobManager, sourceId: string) {
  return !!(await storage.get(sourceId));
}
