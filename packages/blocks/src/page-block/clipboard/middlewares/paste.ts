import type {
  BaseSelection,
  TextRangePoint,
  TextSelection,
} from '@blocksuite/block-std';
import { PathFinder } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { BlockSuiteRoot } from '@blocksuite/lit';
import type { BlockElement } from '@blocksuite/lit';
import type {
  BlockSnapshot,
  DeltaOperation,
  JobMiddleware,
  SliceSnapshot,
} from '@blocksuite/store';
import type { Text } from '@blocksuite/store';
import type { BaseBlockModel } from '@blocksuite/store';
import type { JobSlots } from '@blocksuite/store';

import type { ParagraphBlockModel } from '../../../paragraph-block/index.js';

const findLast = (snapshot: BlockSnapshot): BlockSnapshot => {
  if (snapshot.children && snapshot.children.length > 0) {
    return findLast(snapshot.children[snapshot.children.length - 1]);
  }
  return snapshot;
};

class PointState {
  readonly block: BlockElement;
  readonly text: Text;
  readonly model: BaseBlockModel;
  constructor(
    readonly std: BlockSuiteRoot['std'],
    readonly point: TextRangePoint
  ) {
    this.block = this._blockFromPath(point.path);
    this.model = this.block.model;
    const text = this.model.text;
    assertExists(text);
    this.text = text;
  }

  private _blockFromPath = (path: string[]) => {
    const block = this.std.view.viewFromPath('block', path);
    assertExists(block);
    return block;
  };
}

class PasteTr {
  private readonly fromPointState: PointState;
  private readonly endPointState: PointState;
  private readonly to: TextRangePoint | null;
  private readonly firstSnapshot: BlockSnapshot;
  private readonly lastSnapshot: BlockSnapshot;
  private readonly lastIndex: number;
  constructor(
    public readonly std: BlockSuiteRoot['std'],
    public readonly text: TextSelection,
    public readonly snapshot: SliceSnapshot
  ) {
    const { from, to } = text;
    const end = to ?? from;

    this.to = to;

    this.fromPointState = new PointState(std, from);
    this.endPointState = new PointState(std, end);

    this.firstSnapshot = snapshot.content[0];
    this.lastSnapshot = findLast(snapshot.content[snapshot.content.length - 1]);
    this.lastIndex = this.endPointState.text.length - end.index - end.length;
  }

  canMerge = () => {
    const firstTextSnapshot = this._textFromSnapshot(this.firstSnapshot);
    const lastTextSnapshot = this._textFromSnapshot(this.lastSnapshot);
    return firstTextSnapshot && lastTextSnapshot;
  };

  private _textFromSnapshot = (snapshot: BlockSnapshot) => {
    return snapshot.props.text as Record<'delta', DeltaOperation[]>;
  };

  private _blockFromPath = (path: string[]) => {
    const block = this.std.view.viewFromPath('block', path);
    assertExists(block);
    return block;
  };

  private _getDeltas = () => {
    const firstTextSnapshot = this._textFromSnapshot(this.firstSnapshot);
    const lastTextSnapshot = this._textFromSnapshot(this.lastSnapshot);
    const fromDelta = this.fromPointState.text.sliceToDelta(
      0,
      this.fromPointState.point.index
    );
    const toDelta = this.endPointState.text.sliceToDelta(
      this.endPointState.point.index + this.endPointState.point.length,
      this.endPointState.text.length
    );
    const firstDelta = firstTextSnapshot.delta;
    const lastDelta = lastTextSnapshot.delta;
    return {
      firstTextSnapshot,
      lastTextSnapshot,
      fromDelta,
      toDelta,
      firstDelta,
      lastDelta,
    };
  };

  private _mergeSingle = () => {
    this.firstSnapshot.flavour = this.fromPointState.model.flavour;
    if (this.firstSnapshot.props.type && this.fromPointState.text.length > 0) {
      this.firstSnapshot.props.type = (
        this.fromPointState.model as ParagraphBlockModel
      ).type;
    }
    const { firstTextSnapshot, fromDelta, toDelta, firstDelta } =
      this._getDeltas();

    firstTextSnapshot.delta = [...fromDelta, ...firstDelta, ...toDelta];
  };

  private _mergeMultiple = () => {
    this.firstSnapshot.flavour = this.fromPointState.model.flavour;
    this.lastSnapshot.flavour = this.endPointState.model.flavour;
    if (this.firstSnapshot.props.type && this.fromPointState.text.length > 0) {
      this.firstSnapshot.props.type = (
        this.fromPointState.model as ParagraphBlockModel
      ).type;
    }
    if (this.lastSnapshot.props.type && this.to) {
      this.lastSnapshot.props.type = (
        this.endPointState.model as ParagraphBlockModel
      ).type;
    }

    const {
      firstTextSnapshot,
      lastTextSnapshot,
      fromDelta,
      toDelta,
      firstDelta,
      lastDelta,
    } = this._getDeltas();

    firstTextSnapshot.delta = [...fromDelta, ...firstDelta];
    lastTextSnapshot.delta = [...lastDelta, ...toDelta];
  };

  pasted = () => {
    if (this.canMerge() || this.endPointState.text.length === 0) {
      this.std.page.deleteBlock(this.fromPointState.model);
      if (this.to) {
        const toBlock = this._blockFromPath(this.to.path);
        if (toBlock) {
          this.std.page.deleteBlock(toBlock.model);
        }
      }
    }
  };

  focusPasted = (blockId: string, model: BaseBlockModel) => {
    if (blockId !== this.lastSnapshot.id) {
      return;
    }
    const length = model.text?.length ?? 0;
    const index = length - this.lastIndex;
    if (index < 0) {
      return;
    }

    const parentId = PathFinder.parent(this.endPointState.point.path);

    let selection: BaseSelection;

    if (!this.canMerge()) {
      selection = this.std.selection.getInstance('block', {
        path: parentId.concat(blockId),
      });
    } else {
      selection = this.std.selection.getInstance('text', {
        from: {
          path: parentId.concat(blockId),
          index,
          length: 0,
        },
        to: null,
      });
    }

    this.std.selection.setGroup('note', [selection]);
  };

  merge() {
    if (this.firstSnapshot === this.lastSnapshot) {
      this._mergeSingle();
      return;
    }

    this._mergeMultiple();
  }
}

const replaceId = (slots: JobSlots, std: BlockSuiteRoot['std']) => {
  const idMap = new Map<string, string>();
  slots.beforeImport.on(payload => {
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

export const pasteMiddleware = (std: BlockSuiteRoot['std']): JobMiddleware => {
  return ({ slots }) => {
    let tr: PasteTr | undefined;
    replaceId(slots, std);
    slots.beforeImport.on(payload => {
      if (payload.type === 'slice') {
        const text = std.selection.find('text');
        if (!text) {
          return;
        }
        tr = new PasteTr(std, text, payload.snapshot);
        if (tr.canMerge()) {
          tr.merge();
        }
      }
    });
    slots.afterImport.on(payload => {
      if (tr && payload.type === 'slice') {
        tr.pasted();
      }
      if (tr && payload.type === 'block') {
        tr.focusPasted(payload.snapshot.id, payload.model);
      }
    });
  };
};
