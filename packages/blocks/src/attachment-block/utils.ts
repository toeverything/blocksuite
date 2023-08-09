import { assertExists, type BaseBlockModel } from '@blocksuite/store';

import { downloadBlob } from '../__internal__/utils/filesys.js';
import { humanFileSize } from '../__internal__/utils/math.js';
import { toast } from '../components/toast.js';
import type {
  ImageBlockModel,
  ImageProps,
} from '../image-block/image-model.js';
import type {
  AttachmentBlockModel,
  AttachmentProps,
} from './attachment-model.js';
import { defaultAttachmentProps } from './attachment-model.js';

// 10MB
export const MAX_ATTACHMENT_SIZE = 10 * 1000 * 1000;

export function cloneAttachmentProperties(
  model: BaseBlockModel<AttachmentBlockModel>
) {
  const clonedProps = {} as AttachmentProps;
  for (const cur in defaultAttachmentProps) {
    const key = cur as keyof AttachmentProps;
    // @ts-expect-error it's safe because we just cloned the props simply
    clonedProps[key] = model[key] as AttachmentProps[keyof AttachmentProps];
  }
  return clonedProps;
}

async function getAttachment(model: AttachmentBlockModel) {
  const blobManager = model.page.blobs;
  const sourceId = model.sourceId;
  if (!sourceId) return null;

  const blob = await blobManager.get(sourceId);
  if (!blob) return null;
  return blob;
}

export async function downloadAttachment(
  attachmentModel: AttachmentBlockModel
) {
  const attachment = await getAttachment(attachmentModel);
  if (!attachment) {
    toast('Failed to download attachment!');
    console.error(
      'attachment load failed! sourceId:',
      attachmentModel.sourceId,
      'BlobManager:',
      attachmentModel.page.blobs
    );
    return;
  }
  downloadBlob(attachment, attachmentModel.name);
}

export function turnIntoEmbedView(model: AttachmentBlockModel) {
  const sourceId = model.sourceId;
  assertExists(sourceId);
  const imageProp: ImageProps & { flavour: 'affine:image' } = {
    flavour: 'affine:image',
    sourceId,
  };
  model.page.addSiblingBlocks(model, [imageProp]);
  model.page.deleteBlock(model);
}

export function turnImageIntoCardView(model: ImageBlockModel, blob: Blob) {
  const sourceId = model.sourceId;

  assertExists(sourceId);

  const attachmentProp: AttachmentProps & { flavour: 'affine:attachment' } = {
    flavour: 'affine:attachment',
    sourceId,
    name: blob.name,
    size: blob.size,
    type: blob.type,
  };
  model.page.addSiblingBlocks(model, [attachmentProp]);
  model.page.deleteBlock(model);
}

export async function appendAttachmentBlock(
  file: File,
  model: BaseBlockModel
): Promise<AttachmentBlockModel | null> {
  if (file.size > MAX_ATTACHMENT_SIZE) {
    toast(
      `You can only upload files less than ${humanFileSize(
        MAX_ATTACHMENT_SIZE,
        true,
        0
      )}`
    );
    return null;
  }

  const page = model.page;
  const storage = page.blobs;
  const loadingKey = page.generateId();
  setAttachmentLoading(loadingKey, true);
  const props: AttachmentProps & { flavour: 'affine:attachment' } = {
    flavour: 'affine:attachment',
    name: file.name,
    size: file.size,
    type: file.type,
    loadingKey,
  };
  const [newBlockId] = page.addSiblingBlocks(model, [props]);
  assertExists(newBlockId);
  const attachmentModel = page.getBlockById(newBlockId) as AttachmentBlockModel;

  // The original file name can not be modified after the file is uploaded to the storage,
  // so we create a new file with a fixed name to prevent privacy leaks.
  const anonymousFile = new File([file.slice(0, file.size)], 'anonymous', {
    type: file.type,
  });
  try {
    const sourceId = await storage.set(anonymousFile);
    // await new Promise(resolve => setTimeout(resolve, 1000));
    setAttachmentLoading(attachmentModel.loadingKey ?? '', false);
    page.updateBlock(attachmentModel, {
      sourceId,
      loadingKey: null,
    } satisfies Partial<AttachmentProps>);
    return attachmentModel;
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      toast(
        `Failed to upload attachment! ${error.message || error.toString()}`
      );
    }
    page.updateBlock(attachmentModel, {
      loadingKey: null,
    } satisfies Partial<AttachmentProps>);
    return null;
  }
}

const attachmentLoadingMap = new Set<string>();
export function setAttachmentLoading(loadingKey: string, loading: boolean) {
  if (loading) {
    attachmentLoadingMap.add(loadingKey);
  } else {
    attachmentLoadingMap.delete(loadingKey);
  }
}

export function isAttachmentLoading(loadingKey: string) {
  return attachmentLoadingMap.has(loadingKey);
}
