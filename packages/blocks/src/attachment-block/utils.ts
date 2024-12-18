import type {
  AttachmentBlockModel,
  AttachmentBlockProps,
} from '@blocksuite/affine-model';
import type { EditorHost } from '@blocksuite/block-std';
import type { BlockModel } from '@blocksuite/store';

import { toast } from '@blocksuite/affine-components/toast';
import { defaultAttachmentProps } from '@blocksuite/affine-model';
import { TelemetryProvider } from '@blocksuite/affine-shared/services';
import { humanFileSize } from '@blocksuite/affine-shared/utils';

import type { AttachmentBlockComponent } from './attachment-block.js';

export function cloneAttachmentProperties(model: AttachmentBlockModel) {
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

const attachmentUploads = new Set<string>();
export function setAttachmentUploading(blockId: string) {
  attachmentUploads.add(blockId);
}
export function setAttachmentUploaded(blockId: string) {
  attachmentUploads.delete(blockId);
}
function isAttachmentUploading(blockId: string) {
  return attachmentUploads.has(blockId);
}

/**
 * This function will not verify the size of the file.
 */
export async function uploadAttachmentBlob(
  editorHost: EditorHost,
  blockId: string,
  blob: Blob,
  filetype: string,
  isEdgeless?: boolean
): Promise<void> {
  if (isAttachmentUploading(blockId)) {
    return;
  }

  const doc = editorHost.doc;
  let sourceId: string | undefined;

  try {
    setAttachmentUploading(blockId);
    sourceId = await doc.blobSync.set(blob);
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      toast(
        editorHost,
        `Failed to upload attachment! ${error.message || error.toString()}`
      );
    }
  } finally {
    setAttachmentUploaded(blockId);

    const block = doc.getBlock(blockId);

    doc.withoutTransact(() => {
      if (!block) return;

      doc.updateBlock(block.model, {
        sourceId,
      } satisfies Partial<AttachmentBlockProps>);
    });

    editorHost.std
      .getOptional(TelemetryProvider)
      ?.track('AttachmentUploadedEvent', {
        page: `${isEdgeless ? 'whiteboard' : 'doc'} editor`,
        module: 'attachment',
        segment: 'attachment',
        control: 'uploader',
        type: filetype,
        category: block && sourceId ? 'success' : 'failure',
      });
  }
}

async function getAttachmentBlob(model: AttachmentBlockModel) {
  const sourceId = model.sourceId;
  if (!sourceId) {
    return null;
  }

  const doc = model.doc;
  let blob = await doc.blobSync.get(sourceId);

  if (blob) {
    blob = new Blob([blob], { type: model.type });
  }

  return blob;
}

export async function checkAttachmentBlob(block: AttachmentBlockComponent) {
  const model = block.model;
  const { id, sourceId } = model;

  if (isAttachmentUploading(id)) {
    block.loading = true;
    block.error = false;
    block.allowEmbed = false;
    if (block.blobUrl) {
      URL.revokeObjectURL(block.blobUrl);
      block.blobUrl = undefined;
    }
    return;
  }

  try {
    if (!sourceId) {
      return;
    }

    const blob = await getAttachmentBlob(model);
    if (!blob) {
      return;
    }

    block.loading = false;
    block.error = false;
    block.allowEmbed = block.embedded();
    if (block.blobUrl) {
      URL.revokeObjectURL(block.blobUrl);
    }
    block.blobUrl = URL.createObjectURL(blob);
  } catch (error) {
    console.warn(error, model, sourceId);

    block.loading = false;
    block.error = true;
    block.allowEmbed = false;
    if (block.blobUrl) {
      URL.revokeObjectURL(block.blobUrl);
      block.blobUrl = undefined;
    }
  }
}

/**
 * Since the size of the attachment may be very large,
 * the download process may take a long time!
 */
export function downloadAttachmentBlob(block: AttachmentBlockComponent) {
  const { host, model, loading, error, downloading, blobUrl } = block;
  if (downloading) {
    toast(host, 'Download in progress...');
    return;
  }

  if (loading) {
    toast(host, 'Please wait, file is loading...');
    return;
  }

  const name = model.name;
  const shortName = name.length < 20 ? name : name.slice(0, 20) + '...';

  if (error || !blobUrl) {
    toast(host, `Failed to download ${shortName}!`);
    return;
  }

  block.downloading = true;

  toast(host, `Downloading ${shortName}`);

  const tmpLink = document.createElement('a');
  const event = new MouseEvent('click');
  tmpLink.download = name;
  tmpLink.href = blobUrl;
  tmpLink.dispatchEvent(event);
  tmpLink.remove();

  block.downloading = false;
}

export async function getFileType(file: File) {
  if (file.type) {
    return file.type;
  }
  // If the file type is not available, try to get it from the buffer.
  const buffer = await file.arrayBuffer();
  const FileType = await import('file-type');
  const fileType = await FileType.fileTypeFromBuffer(buffer);
  return fileType ? fileType.mime : '';
}

/**
 * Add a new attachment block before / after the specified block.
 */
export async function addSiblingAttachmentBlocks(
  editorHost: EditorHost,
  files: File[],
  maxFileSize: number,
  targetModel: BlockModel,
  place: 'before' | 'after' = 'after'
) {
  if (!files.length) {
    return;
  }

  const isSizeExceeded = files.some(file => file.size > maxFileSize);
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

  const doc = targetModel.doc;

  // Get the types of all files
  const types = await Promise.all(files.map(file => getFileType(file)));
  const attachmentBlockProps: (Partial<AttachmentBlockProps> & {
    flavour: 'affine:attachment';
  })[] = files.map((file, index) => ({
    flavour: 'affine:attachment',
    name: file.name,
    size: file.size,
    type: types[index],
  }));

  const blockIds = doc.addSiblingBlocks(
    targetModel,
    attachmentBlockProps,
    place
  );

  blockIds.map(
    (blockId, index) =>
      void uploadAttachmentBlob(editorHost, blockId, files[index], types[index])
  );

  return blockIds;
}
