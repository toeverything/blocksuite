import { isFrameBlock } from '@labre/affine-block-frame';
import {
  getSurfaceComponent,
  isNoteBlock,
} from '@labre/affine-block-surface';
import type {
  EdgelessTextBlockModel,
  EmbedSyncedDocModel,
  FrameBlockModel,
  ImageBlockModel,
  NoteBlockModel,
  ShapeElementModel,
} from '@labre/affine-model';
import { getElementsWithoutGroup } from '@labre/affine-shared/utils';
import { getCommonBoundWithRotation } from '@labre/global/gfx';
import type { BlockComponent } from '@labre/std';
import { GfxControllerIdentifier, type GfxModel } from '@labre/std/gfx';
import groupBy from 'lodash-es/groupBy';

import { createElementsFromClipboardDataCommand } from '../clipboard/command.js';
import { getSortedCloneElements, prepareCloneData } from './clone-utils.js';
import {
  isEdgelessTextBlock,
  isEmbedSyncedDocBlock,
  isImageBlock,
} from './query.js';

const offset = 10;
export async function duplicate(
  edgeless: BlockComponent,
  elements: GfxModel[],
  select = true
) {
  const gfx = edgeless.std.get(GfxControllerIdentifier);

  const surface = getSurfaceComponent(edgeless.std);
  if (!surface) return;

  const copyElements = getSortedCloneElements(elements);
  const totalBound = getCommonBoundWithRotation(copyElements);
  totalBound.x += totalBound.w + offset;

  const snapshot = prepareCloneData(copyElements, edgeless.std);
  const [_, { createdElementsPromise }] = edgeless.std.command.exec(
    createElementsFromClipboardDataCommand,
    {
      elementsRawData: snapshot,
      pasteCenter: totalBound.center,
    }
  );
  if (!createdElementsPromise) return;
  const { canvasElements, blockModels } = await createdElementsPromise;

  const newElements = [...canvasElements, ...blockModels];

  surface.fitToViewport(totalBound);

  if (select) {
    gfx.selection.set({
      elements: newElements.map(e => e.id),
      editing: false,
    });
  }
}
export const splitElements = (elements: GfxModel[]) => {
  const { notes, frames, shapes, images, edgelessTexts, embedSyncedDocs } =
    groupBy(getElementsWithoutGroup(elements), element => {
      if (isNoteBlock(element)) {
        return 'notes';
      } else if (isFrameBlock(element)) {
        return 'frames';
      } else if (isImageBlock(element)) {
        return 'images';
      } else if (isEdgelessTextBlock(element)) {
        return 'edgelessTexts';
      } else if (isEmbedSyncedDocBlock(element)) {
        return 'embedSyncedDocs';
      }
      return 'shapes';
    }) as {
      notes: NoteBlockModel[];
      shapes: ShapeElementModel[];
      frames: FrameBlockModel[];
      images: ImageBlockModel[];
      edgelessTexts: EdgelessTextBlockModel[];
      embedSyncedDocs: EmbedSyncedDocModel[];
    };

  return {
    notes: notes ?? [],
    shapes: shapes ?? [],
    frames: frames ?? [],
    images: images ?? [],
    edgelessTexts: edgelessTexts ?? [],
    embedSyncedDocs: embedSyncedDocs ?? [],
  };
};
