import type { BaseBlockModel, BlobManager } from '@blocksuite/store';

import type {
  AttachmentBlockModel,
  AttachmentProps,
} from './attachment-model.js';
import { defaultAttachmentProps } from './attachment-model.js';

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

export async function getAttachment(
  blobManager: BlobManager,
  sourceId: string
) {
  const blob = await blobManager.get(sourceId);
  if (!blob) {
    return null;
  }
  return blob;
}
