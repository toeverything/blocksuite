import { groupBy } from '../../../_common/utils/iterable.js';
import type { EdgelessTextBlockModel } from '../../../edgeless-text/edgeless-text-model.js';
import type { FrameBlockModel } from '../../../frame-block/index.js';
import type { ImageBlockModel } from '../../../image-block/index.js';
import type { NoteBlockModel } from '../../../note-block/index.js';
import type { EdgelessRootBlockComponent } from '../edgeless-root-block.js';
import { edgelessElementsBound } from './bound-utils.js';
import { getCloneElements, prepareCloneData } from './clone-utils.js';
import { getElementsWithoutGroup } from './group.js';
import {
  isEdgelessTextBlock,
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
  const [canvasElements, blocks] =
    await clipboardController.createElementsFromClipboardData(
      snapshot as Record<string, unknown>[],
      totalBound.center
    );

  const newElements = [...canvasElements, ...blocks];

  edgeless.surface.fitToViewport(totalBound);

  if (select) {
    edgeless.service.selection.set({
      elements: newElements.map(e => e.id),
      editing: false,
    });
  }
}
export const splitElements = (elements: BlockSuite.EdgelessModelType[]) => {
  const { notes, frames, shapes, images, edgelessText } = groupBy(
    getElementsWithoutGroup(elements),
    element => {
      if (isNoteBlock(element)) {
        return 'notes';
      } else if (isFrameBlock(element)) {
        return 'frames';
      } else if (isImageBlock(element)) {
        return 'images';
      } else if (isEdgelessTextBlock(element)) {
        return 'edgelessText';
      }
      return 'shapes';
    }
  ) as {
    notes: NoteBlockModel[];
    shapes: BlockSuite.SurfaceModelType[];
    frames: FrameBlockModel[];
    images: ImageBlockModel[];
    edgelessText: EdgelessTextBlockModel[];
  };

  return {
    notes: notes ?? [],
    shapes: shapes ?? [],
    frames: frames ?? [],
    images: images ?? [],
    edgelessText: edgelessText ?? [],
  };
};
