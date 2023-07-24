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

/**
 * Format bytes as human-readable text.
 *
 * @param bytes Number of bytes.
 * @param si True to use metric (SI) units, aka powers of 1000. False to use
 *           binary (IEC), aka powers of 1024.
 * @param dp Number of decimal places to display.
 *
 * @return Formatted string.
 *
 * Credit: https://stackoverflow.com/questions/10420352/converting-file-size-in-bytes-to-human-readable-string
 */
export function humanFileSize(bytes: number, si = true, dp = 1) {
  const thresh = si ? 1000 : 1024;

  if (Math.abs(bytes) < thresh) {
    return bytes + ' bytes';
  }

  const units = si
    ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
  let u = -1;
  const r = 10 ** dp;

  do {
    bytes /= thresh;
    ++u;
  } while (
    Math.round(Math.abs(bytes) * r) / r >= thresh &&
    u < units.length - 1
  );

  return bytes.toFixed(dp) + ' ' + units[u];
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
