import type { TextRangePoint } from '@blocksuite/block-std';
import { PathFinder } from '@blocksuite/block-std';
import type { BlockSuiteRoot } from '@blocksuite/lit';
import type { JobMiddleware } from '@blocksuite/store';

export const copyMiddleware = (std: BlockSuiteRoot['std']): JobMiddleware => {
  return ({ slots }) => {
    const idMap = new Map<string, string>();
    slots.afterExport.on(payload => {
      if (payload.type === 'slice') {
        console.log(payload);
      }
      if (payload.type === 'block') {
        const handlePoint = (point: TextRangePoint) => {
          const { index, length } = point;
          if (!snapshot.props.text) {
            return;
          }
          (snapshot.props.text as Record<string, unknown>).delta =
            model.text?.sliceToDelta(index, length + index);
        };
        const snapshot = payload.snapshot;
        const original = snapshot.id;
        let newId: string;
        if (idMap.has(original)) {
          newId = idMap.get(original)!;
        } else {
          newId = std.page.workspace.idGenerator();
          idMap.set(original, newId);
        }
        snapshot.id = newId;

        const model = payload.model;
        const text = std.selection.find('text');
        if (text && PathFinder.id(text.from.path) === model.id) {
          handlePoint(text.from);
          return;
        }
        if (text && text.to && PathFinder.id(text.to.path) === model.id) {
          handlePoint(text.to);
          return;
        }
      }
    });
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
