import { groupBy } from '../../../_common/utils/iterable.js';
import type { EdgelessTextBlockModel } from '../../../edgeless-text/edgeless-text-model.js';
import type { EmbedSyncedDocModel } from '../../../embed-synced-doc-block/index.js';
import type { FrameBlockModel } from '../../../frame-block/index.js';
import type { ImageBlockModel } from '../../../image-block/index.js';
import type { NoteBlockModel } from '../../../note-block/index.js';
import type { EdgelessRootBlockComponent } from '../edgeless-root-block.js';
import { edgelessElementsBound } from './bound-utils.js';
import { getCloneElements, prepareCloneData } from './clone-utils.js';
import { getElementsWithoutGroup } from './group.js';
import {
  isEdgelessTextBlock,
  isEmbedSyncedDocBlock,
  isFrameBlock,
  isImageBlock,
  isNoteBlock,
} from './query.js';

const offset = 10;
export async function duplicate(
  edgeless: EdgelessRootBlockComponent,
  elements: BlockSuite.EdgelessModelType[],
  select = true
) {
  const { clipboardController } = edgeless;
  const copyElements = getCloneElements(
    elements,
    edgeless.surface.edgeless.service.frame
  );
  const totalBound = edgelessElementsBound(copyElements);
  totalBound.x += totalBound.w + offset;

  const snapshot = await prepareCloneData(copyElements, edgeless.std);
  const { canvasElements, blockModels } =
    await clipboardController.createElementsFromClipboardData(
      snapshot,
      totalBound.center
    );

  const newElements = [...canvasElements, ...blockModels];

  edgeless.surface.fitToViewport(totalBound);

  if (select) {
    edgeless.service.selection.set({
      elements: newElements.map(e => e.id),
      editing: false,
    });
  }
}
export const splitElements = (elements: BlockSuite.EdgelessModelType[]) => {
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
      shapes: BlockSuite.SurfaceModelType[];
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
