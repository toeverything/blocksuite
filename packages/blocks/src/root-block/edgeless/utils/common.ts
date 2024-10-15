import type {
  AttachmentBlockProps,
  ImageBlockProps,
} from '@blocksuite/affine-model';
import type { BlockStdScope } from '@blocksuite/block-std';

import { toast } from '@blocksuite/affine-components/toast';
import {
  EMBED_CARD_HEIGHT,
  EMBED_CARD_WIDTH,
} from '@blocksuite/affine-shared/consts';
import { humanFileSize } from '@blocksuite/affine-shared/utils';
import { GfxControllerIdentifier } from '@blocksuite/block-std/gfx';
import { Bound, type IVec, Point, Vec } from '@blocksuite/global/utils';

import {
  setAttachmentUploaded,
  setAttachmentUploading,
} from '../../../attachment-block/utils.js';
import { calcBoundByOrigin, readImageSize } from '../components/utils.js';

export async function addAttachments(
  std: BlockStdScope,
  files: File[],
  point?: IVec
): Promise<string[]> {
  if (!files.length) return [];

  const attachmentService = std.getService('affine:attachment');
  const gfx = std.get(GfxControllerIdentifier);

  if (!attachmentService) {
    console.error('Attachment service not found');
    return [];
  }
  const maxFileSize = attachmentService.maxFileSize;
  const isSizeExceeded = files.some(file => file.size > maxFileSize);
  if (isSizeExceeded) {
    toast(
      std.host,
      `You can only upload files less than ${humanFileSize(
        maxFileSize,
        true,
        0
      )}`
    );
    return [];
  }

  let { x, y } = gfx.viewport.center;
  if (point) [x, y] = gfx.viewport.toModelCoord(...point);

  const CARD_STACK_GAP = 32;

  const dropInfos: { blockId: string; file: File }[] = files.map(
    (file, index) => {
      const point = new Point(
        x + index * CARD_STACK_GAP,
        y + index * CARD_STACK_GAP
      );
      const center = Vec.toVec(point);
      const bound = Bound.fromCenter(
        center,
        EMBED_CARD_WIDTH.cubeThick,
        EMBED_CARD_HEIGHT.cubeThick
      );
      const blockId = std.doc.addBlock(
        'affine:attachment',
        {
          name: file.name,
          size: file.size,
          type: file.type,
          style: 'cubeThick',
          xywh: bound.serialize(),
        } satisfies Partial<AttachmentBlockProps>,
        gfx.surface
      );

      return { blockId, file };
    }
  );

  // upload file and update the attachment model
  const uploadPromises = dropInfos.map(async ({ blockId, file }) => {
    let sourceId: string | undefined;
    try {
      setAttachmentUploading(blockId);
      sourceId = await std.doc.blobSync.set(file);
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        toast(
          std.host,
          `Failed to upload attachment! ${error.message || error.toString()}`
        );
      }
    } finally {
      setAttachmentUploaded(blockId);
      std.doc.withoutTransact(() => {
        gfx.updateElement(blockId, {
          sourceId,
        } satisfies Partial<AttachmentBlockProps>);
      });
    }
    return blockId;
  });
  const blockIds = await Promise.all(uploadPromises);

  gfx.selection.set({
    elements: blockIds,
    editing: false,
  });

  return blockIds;
}

export async function addImages(
  std: BlockStdScope,
  files: File[],
  point?: IVec,
  inTopLeft?: boolean
): Promise<string[]> {
  const imageFiles = [...files].filter(file => file.type.startsWith('image/'));
  if (!imageFiles.length) return [];

  const imageService = std.getService('affine:image');
  const gfx = std.get(GfxControllerIdentifier);

  if (!imageService) {
    console.error('Image service not found');
    return [];
  }

  const maxFileSize = imageService.maxFileSize;
  const isSizeExceeded = imageFiles.some(file => file.size > maxFileSize);
  if (isSizeExceeded) {
    toast(
      std.host,
      `You can only upload files less than ${humanFileSize(
        maxFileSize,
        true,
        0
      )}`
    );
    return [];
  }

  let { x, y } = gfx.viewport.center;
  if (point) [x, y] = gfx.viewport.toModelCoord(...point);

  const dropInfos: { point: Point; blockId: string }[] = [];

  const IMAGE_STACK_GAP = 32;

  // create image cards without image data
  imageFiles.map((file, index) => {
    const point = new Point(
      x + index * IMAGE_STACK_GAP,
      y + index * IMAGE_STACK_GAP
    );
    const center = Vec.toVec(point);
    const bound = calcBoundByOrigin(center, inTopLeft);
    const blockId = std.doc.addBlock(
      'affine:image',
      {
        size: file.size,
        xywh: bound.serialize(),
      },
      gfx.surface
    );
    dropInfos.push({ point, blockId });
  });

  // upload image data and update the image model
  const uploadPromises = imageFiles.map(async (file, index) => {
    const { point, blockId } = dropInfos[index];

    const sourceId = await std.doc.blobSync.set(file);
    const imageSize = await readImageSize(file);

    const center = Vec.toVec(point);
    const bound = calcBoundByOrigin(
      center,
      inTopLeft,
      imageSize.width,
      imageSize.height
    );

    std.doc.withoutTransact(() => {
      std.gfx.updateElement(blockId, {
        sourceId,
        ...imageSize,
        xywh: bound.serialize(),
      } satisfies Partial<ImageBlockProps>);
    });
  });
  await Promise.all(uploadPromises);

  const blockIds = dropInfos.map(info => info.blockId);
  std.gfx.selection.set({
    elements: blockIds,
    editing: false,
  });
  return blockIds;
}
