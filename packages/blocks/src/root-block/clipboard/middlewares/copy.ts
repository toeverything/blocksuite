import type { EditorHost, TextRangePoint } from '@blocksuite/block-std';
import type {
  BlockSnapshot,
  DraftModel,
  JobMiddleware,
  JobSlots,
} from '@blocksuite/store';

import { matchFlavours } from '../../../_common/utils/index.js';

const handlePoint = (
  point: TextRangePoint,
  snapshot: BlockSnapshot,
  model: DraftModel
) => {
  const { index, length } = point;
  // @ts-expect-error TODO: add match flavour type for draft model
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
      if (text && text.from.blockId === model.id) {
        handlePoint(text.from, snapshot, model);
        return;
      }
      if (text && text.to && text.to.blockId === model.id) {
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
