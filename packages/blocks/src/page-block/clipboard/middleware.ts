import type { TextRangePoint } from '@blocksuite/block-std';
import { PathFinder } from '@blocksuite/block-std';
import type { BlockSuiteRoot } from '@blocksuite/lit';
import type {
  BaseBlockModel,
  BlockSnapshot,
  DeltaOperation,
  JobMiddleware,
  JobSlots,
} from '@blocksuite/store';

import type { ParagraphBlockModel } from '../../paragraph-block/index.js';

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
    let from: TextRangePoint | undefined;
    let to: TextRangePoint | null | undefined;
    let lastSnapshotId: string | undefined;
    let lastIndex = 0;
    slots.beforeImport.on(payload => {
      if (payload.type === 'slice') {
        const text = std.selection.find('text');
        if (!text) {
          return;
        }
        const blockSnapshots = payload.snapshot.content;
        const firstBlock = blockSnapshots[0];
        const findLast = (snapshot: BlockSnapshot): BlockSnapshot => {
          if (snapshot.children && snapshot.children.length > 0) {
            return findLast(snapshot.children[snapshot.children.length - 1]);
          }
          return snapshot;
        };
        const lastBlock: BlockSnapshot = findLast(
          blockSnapshots[blockSnapshots.length - 1]
        );
        lastSnapshotId = lastBlock.id;

        ({ from, to } = text);
        const _to = to ?? from;
        const fromBlock = std.view.viewFromPath('block', from.path);
        const toBlock = std.view.viewFromPath('block', _to.path);
        const firstTextSnapshot = firstBlock.props.text as Record<
          'delta',
          DeltaOperation[]
        >;
        const lastTextSnapshot = lastBlock.props.text as Record<
          'delta',
          DeltaOperation[]
        >;
        const firstDelta = firstTextSnapshot.delta;
        const lastDelta = lastTextSnapshot.delta;

        const fromText = fromBlock?.model.text;
        const toText = toBlock?.model.text;

        if (!fromText || !toText) {
          return;
        }

        const fromDelta = fromText.sliceToDelta(0, from.index);
        const toDelta = toText.sliceToDelta(
          _to.index + _to.length,
          toText.length
        );

        lastIndex = toText.length - _to.index - _to.length;

        if (!fromDelta || !toDelta) {
          return;
        }

        if (firstBlock === lastBlock) {
          firstBlock.flavour = fromBlock.model.flavour;
          if (firstBlock.props.type) {
            firstBlock.props.type = (
              fromBlock.model as ParagraphBlockModel
            ).type;
          }
          firstTextSnapshot.delta = [...fromDelta, ...firstDelta, ...toDelta];
          return;
        }

        firstBlock.flavour = fromBlock.model.flavour;
        lastBlock.flavour = toBlock.model.flavour;
        if (firstBlock.props.type) {
          firstBlock.props.type = (fromBlock.model as ParagraphBlockModel).type;
        }
        if (lastBlock.props.type) {
          lastBlock.props.type = (toBlock.model as ParagraphBlockModel).type;
        }
        firstTextSnapshot.delta = [...fromDelta, ...firstDelta];
        lastTextSnapshot.delta = [...lastDelta, ...toDelta];
      }
    });
    slots.afterImport.on(payload => {
      if (!from) {
        return;
      }
      if (payload.type === 'slice') {
        const fromBlock = std.view.viewFromPath('block', from.path);
        if (fromBlock) {
          std.page.deleteBlock(fromBlock.model);
        }
        if (to) {
          const toBlock = std.view.viewFromPath('block', to.path);
          if (toBlock) {
            std.page.deleteBlock(toBlock.model);
          }
        }
      }
      if (payload.type === 'block' && payload.snapshot.id === lastSnapshotId) {
        const point = to ?? from;
        const parentId = PathFinder.parent(point.path);
        std.selection.set([
          std.selection.getInstance('text', {
            from: {
              path: parentId.concat(payload.snapshot.id),
              index: (payload.model.text?.length ?? 0) - lastIndex,
              length: 0,
            },
            to: null,
          }),
        ]);
      }
    });
  };
};
