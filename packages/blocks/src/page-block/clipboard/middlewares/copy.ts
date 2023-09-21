import type { TextRangePoint } from '@blocksuite/block-std';
import { PathFinder } from '@blocksuite/block-std';
import type { BlockSuiteRoot } from '@blocksuite/lit';
import type {
  BaseBlockModel,
  BlockSnapshot,
  JobMiddleware,
  JobSlots,
} from '@blocksuite/store';

const handlePoint = (
  point: TextRangePoint,
  snapshot: BlockSnapshot,
  model: BaseBlockModel
) => {
  const { index, length } = point;
  if (!snapshot.props.text) {
    return;
  }
  (snapshot.props.text as Record<string, unknown>).delta =
    model.text?.sliceToDelta(index, length + index);
};

const sliceText = (slots: JobSlots, std: BlockSuiteRoot['std']) => {
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

export const copyMiddleware = (std: BlockSuiteRoot['std']): JobMiddleware => {
  return ({ slots }) => {
    sliceText(slots, std);
  };
};
