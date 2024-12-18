import type { NoteChildrenFlavour } from '@blocksuite/affine-shared/types';
import type { BlockStdScope } from '@blocksuite/block-std';

import { focusTextModel } from '@blocksuite/affine-components/rich-text';
import { toast } from '@blocksuite/affine-components/toast';
import {
  type AttachmentBlockProps,
  DEFAULT_NOTE_HEIGHT,
  DEFAULT_NOTE_WIDTH,
  type ImageBlockProps,
  NOTE_MIN_HEIGHT,
  type NoteBlockModel,
  NoteDisplayMode,
} from '@blocksuite/affine-model';
import {
  EMBED_CARD_HEIGHT,
  EMBED_CARD_WIDTH,
} from '@blocksuite/affine-shared/consts';
import { TelemetryProvider } from '@blocksuite/affine-shared/services';
import {
  handleNativeRangeAtPoint,
  humanFileSize,
} from '@blocksuite/affine-shared/utils';
import { GfxControllerIdentifier } from '@blocksuite/block-std/gfx';
import {
  Bound,
  type IPoint,
  type IVec,
  Point,
  serializeXYWH,
  Vec,
} from '@blocksuite/global/utils';

import {
  getFileType,
  uploadAttachmentBlob,
} from '../../../attachment-block/utils.js';
import { calcBoundByOrigin, readImageSize } from '../components/utils.js';
import { DEFAULT_NOTE_OFFSET_X, DEFAULT_NOTE_OFFSET_Y } from './consts.js';
import { addBlock } from './crud.js';

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
    const filetype = await getFileType(file);
    await uploadAttachmentBlob(std.host, blockId, file, filetype, true);
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
  point?: IVec
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
  const isMultipleFiles = imageFiles.length > 1;
  const inTopLeft = isMultipleFiles ? true : false;

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
      gfx.updateElement(blockId, {
        sourceId,
        ...imageSize,
        xywh: bound.serialize(),
      } satisfies Partial<ImageBlockProps>);
    });
  });
  await Promise.all(uploadPromises);

  const blockIds = dropInfos.map(info => info.blockId);
  gfx.selection.set({
    elements: blockIds,
    editing: false,
  });
  if (isMultipleFiles) {
    std.command.exec('autoResizeElements');
  }
  return blockIds;
}

export function addNoteAtPoint(
  std: BlockStdScope,
  /**
   * The point is in browser coordinate
   */
  point: IPoint,
  options: {
    width?: number;
    height?: number;
    parentId?: string;
    noteIndex?: number;
    offsetX?: number;
    offsetY?: number;
    scale?: number;
  } = {}
) {
  const gfx = std.get(GfxControllerIdentifier);
  const {
    width = DEFAULT_NOTE_WIDTH,
    height = DEFAULT_NOTE_HEIGHT,
    offsetX = DEFAULT_NOTE_OFFSET_X,
    offsetY = DEFAULT_NOTE_OFFSET_Y,
    parentId = gfx.doc.root?.id,
    noteIndex: noteIndex,
    scale = 1,
  } = options;
  const [x, y] = gfx.viewport.toModelCoord(point.x, point.y);
  const blockId = addBlock(
    std,
    'affine:note',
    {
      xywh: serializeXYWH(
        x - offsetX * scale,
        y - offsetY * scale,
        width,
        height
      ),
      displayMode: NoteDisplayMode.EdgelessOnly,
    },
    parentId,
    noteIndex
  );

  gfx.std.getOptional(TelemetryProvider)?.track('CanvasElementAdded', {
    control: 'canvas:draw',
    page: 'whiteboard editor',
    module: 'toolbar',
    segment: 'toolbar',
    type: 'note',
  });

  return blockId;
}

type NoteOptions = {
  childFlavour: NoteChildrenFlavour;
  childType: string | null;
  collapse: boolean;
};

export function addNote(
  std: BlockStdScope,
  point: Point,
  options: NoteOptions,
  width = DEFAULT_NOTE_WIDTH,
  height = DEFAULT_NOTE_HEIGHT
) {
  const noteId = addNoteAtPoint(std, point, {
    width,
    height,
  });

  const gfx = std.get(GfxControllerIdentifier);
  const doc = std.doc;

  const blockId = doc.addBlock(
    options.childFlavour,
    { type: options.childType },
    noteId
  );
  if (options.collapse && height > NOTE_MIN_HEIGHT) {
    const note = doc.getBlockById(noteId) as NoteBlockModel;
    doc.updateBlock(note, () => {
      note.edgeless.collapse = true;
      note.edgeless.collapsedHeight = height;
    });
  }
  gfx.tool.setTool('default');

  // Wait for edgelessTool updated
  requestAnimationFrame(() => {
    const blocks =
      (doc.root?.children.filter(
        child => child.flavour === 'affine:note'
      ) as BlockSuite.EdgelessBlockModelType[]) ?? [];
    const element = blocks.find(b => b.id === noteId);
    if (element) {
      gfx.selection.set({
        elements: [element.id],
        editing: true,
      });

      // Waiting dom updated, `note mask` is removed
      if (blockId) {
        focusTextModel(gfx.std, blockId);
      } else {
        // Cannot reuse `handleNativeRangeClick` directly here,
        // since `retargetClick` will re-target to pervious editor
        handleNativeRangeAtPoint(point.x, point.y);
      }
    }
  });
}
