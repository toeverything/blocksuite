import type { TextRangePoint } from '@blocksuite/block-std';
import { PathFinder } from '@blocksuite/block-std';
import type { BlockSuiteRoot } from '@blocksuite/lit';
import type { BlockSnapshot, JobMiddleware, JobSlots } from '@blocksuite/store';
import type { BaseBlockModel } from '@blocksuite/store';

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

const replaceId = (slots: JobSlots, std: BlockSuiteRoot['std']) => {
  const idMap = new Map<string, string>();
  slots.afterExport.on(payload => {
    if (payload.type === 'block') {
      const snapshot = payload.snapshot;
      const original = snapshot.id;
      let newId: string;
      if (idMap.has(original)) {
        newId = idMap.get(original)!;
      } else {
        newId = std.page.workspace.idGenerator('block');
        idMap.set(original, newId);
      }
      snapshot.id = newId;
    }
  });
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
    replaceId(slots, std);
    sliceText(slots, std);
  };
};

export const pasteMiddleware = (std: BlockSuiteRoot['std']): JobMiddleware => {
  return ({ slots }) => {
    slots.beforeImport.on(payload => {
      if (payload.type === 'block') {
        const text = std.selection.find('text');
        text;
      }
    });
  };
};
