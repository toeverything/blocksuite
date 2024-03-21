import type { TextRangePoint } from '@blocksuite/block-std';
import type { EditorHost } from '@blocksuite/block-std';
import { PathFinder } from '@blocksuite/block-std';
import type {
  BlockModel,
  BlockSnapshot,
  JobMiddleware,
  JobSlots,
} from '@blocksuite/store';

import { matchFlavours } from '../../../_common/utils/index.js';

const handlePoint = (
  point: TextRangePoint,
  snapshot: BlockSnapshot,
  model: BlockModel
) => {
  const { index, length } = point;
  if (matchFlavours(model, ['affine:page'])) {
    if (length === 0) return;
    (snapshot.props.title as Record<string, unknown>).delta =
      model.title.sliceToDelta(index, length + index);
    return;
  }

  if (!snapshot.props.text || length === 0) {
    return;
  }
  (snapshot.props.text as Record<string, unknown>).delta =
    model.text?.sliceToDelta(index, length + index);
};

const sliceText = (slots: JobSlots, std: EditorHost['std']) => {
  slots.afterExport.on(payload => {
    if (payload.type === 'block') {
      const snapshot = payload.snapshot;

      const model = payload.model;
      const text = std.selection.find('text');
      if (text && PathFinder.id(text.from.path) === model.id) {
        handlePoint(text.from, snapshot, model);
        return;
      }
      if (text && text.to && PathFinder.id(text.to.path) === model.id) {
        handlePoint(text.to, snapshot, model);
        return;
      }
    }
  });
};

export const copyMiddleware = (std: EditorHost['std']): JobMiddleware => {
  return ({ slots }) => {
    sliceText(slots, std);
  };
};
