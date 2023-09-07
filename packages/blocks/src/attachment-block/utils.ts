import { assertExists } from '@blocksuite/global/utils';
import { type BaseBlockModel, type BlobManager } from '@blocksuite/store';

import { downloadBlob } from '../__internal__/utils/filesys.js';
import { humanFileSize } from '../__internal__/utils/math.js';
import { toast } from '../components/toast.js';
import type {
  ImageBlockModel,
  ImageBlockProps,
} from '../image-block/image-model.js';
import { transformModel } from '../page-block/utils/operations/model.js';
import type {
  AttachmentBlockModel,
  AttachmentProps,
} from './attachment-model.js';
import { defaultAttachmentProps } from './attachment-model.js';

// 10MB
export const MAX_ATTACHMENT_SIZE = 10 * 1000 * 1000;
const DEFAULT_ATTACHMENT_NAME = 'affine-attachment';

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

// Use lru strategy is a better choice, but it's just a temporary solution.
const MAX_TEMP_DATA_SIZE = 100;
/**
 * TODO @Saul-Mirone use some other way to store the temp data
 *
 * @deprecated Waiting for migration
 */
const tempAttachmentMap = new Map<
  string,
  {
    // name for the attachment
    name: string;
  }
>();
const tempImageMap = new Map<
  string,
  {
    // This information comes from pictures.
    // If the user switches between pictures and attachments,
    // this information should be retained.
    width: number | undefined;
    height: number | undefined;
  }
>();

/**
 * Because the image block and attachment block have different props.
 * We need to save some data temporarily when converting between them to ensure no data is lost.
 *
 * For example, before converting from an image block to an attachment block,
 * we need to save the image's width and height.
 *
 * Similarly, when converting from an attachment block to an image block,
 * we need to save the attachment's name.
 *
 * See also https://github.com/toeverything/blocksuite/pull/4583#pullrequestreview-1610662677
 *
 * @internal
 */
export const withTempBlobData = () => {
  const saveAttachmentData = (sourceId: string, data: { name: string }) => {
    if (tempAttachmentMap.size > MAX_TEMP_DATA_SIZE) {
      console.warn(
        'Clear the temp attachment data. It may cause filename loss when converting between image and attachment.'
      );
      tempAttachmentMap.clear();
    }

    tempAttachmentMap.set(sourceId, data);
  };
  const getAttachmentData = (blockId: string) => {
    const data = tempAttachmentMap.get(blockId);
    tempAttachmentMap.delete(blockId);
    return data;
  };

  const saveImageData = (
    sourceId: string,
    data: { width: number | undefined; height: number | undefined }
  ) => {
    if (tempImageMap.size > MAX_TEMP_DATA_SIZE) {
      console.warn(
        'Clear temp image data. It may cause image width and height loss when converting between image and attachment.'
      );
      tempImageMap.clear();
    }

    tempImageMap.set(sourceId, data);
  };
  const getImageData = (blockId: string) => {
    const data = tempImageMap.get(blockId);
    tempImageMap.delete(blockId);
    return data;
  };
  return {
    saveAttachmentData,
    getAttachmentData,
    saveImageData,
    getImageData,
  };
};

/**
 * Turn the attachment block into an image block.
 */
export async function turnIntoEmbedView(model: AttachmentBlockModel) {
  if (!model.page.schema.flavourSchemaMap.has('affine:image'))
    throw new Error('The image flavour is not supported!');

  const sourceId = model.sourceId;
  assertExists(sourceId);
  const { saveAttachmentData, getImageData } = withTempBlobData();
  saveAttachmentData(sourceId, { name: model.name });
  const imageConvertData = model.sourceId
    ? getImageData(model.sourceId)
    : undefined;
  const imageProp: ImageBlockProps = {
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
  const attachmentProp: AttachmentProps = {
    sourceId,
    name: DEFAULT_ATTACHMENT_NAME,
    size: blob.size,
    type: blob.type,
    caption: model.caption,
    ...attachmentConvertData,
  };
  transformModel(model, 'affine:attachment', attachmentProp);
}

async function uploadFileForAttachment(
  attachmentModel: AttachmentBlockModel,
  file: File
) {
  const loadingKey = attachmentModel.loadingKey;
  const isLoading = loadingKey ? isAttachmentLoading(loadingKey) : false;
  if (!isLoading) {
    console.warn(
      'uploadAttachment: the attachment is not loading!',
      attachmentModel
    );
  }
  const page = attachmentModel.page;
  const storage = page.blobs;
  // The original file name can not be modified after the file is uploaded to the storage,
  // so we create a new file with a fixed name to prevent privacy leaks.
  // const anonymousFile = new File([file.slice(0, file.size)], 'anonymous', {
  //   type: file.type,
  // });
  try {
    const sourceId = await storage.set(file);
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

export async function appendAttachmentBlock(
  file: File,
  model: BaseBlockModel
): Promise<void> {
  if (file.size > MAX_ATTACHMENT_SIZE) {
    toast(
      `You can only upload files less than ${humanFileSize(
        MAX_ATTACHMENT_SIZE,
        true,
        0
      )}`
    );
    return;
  }

  const page = model.page;
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

  // Upload the file to the storage
  const attachmentModel = page.getBlockById(
    newBlockId
  ) as AttachmentBlockModel | null;
  assertExists(attachmentModel);
  // Do not add await here, because upload may take a long time, we want to do it in the background.
  uploadFileForAttachment(attachmentModel, file);
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

export async function hasBlob(storage: BlobManager, sourceId: string) {
  const list = await storage.list();
  return list.some(item => item === sourceId);
}
