import type {
  BlockElement,
  EditorHost,
  TextRangePoint,
  TextSelection,
} from '@blocksuite/block-std';
import type { Text } from '@blocksuite/store';

import { assertExists } from '@blocksuite/global/utils';
import {
  type BlockModel,
  type BlockSnapshot,
  type DeltaOperation,
  DocCollection,
  type JobMiddleware,
  type SliceSnapshot,
  fromJSON,
} from '@blocksuite/store';

import type { ParagraphBlockModel } from '../../../paragraph-block/index.js';
import type { QuickSearchService } from '../../root-service.js';

import { matchFlavours } from '../../../_common/utils/index.js';

const findLast = (snapshot: BlockSnapshot): BlockSnapshot => {
  if (snapshot.children && snapshot.children.length > 0) {
    return findLast(snapshot.children[snapshot.children.length - 1]);
  }
  return snapshot;
};

class PointState {
  private _blockFromPath = (path: string) => {
    const block = this.std.view.getBlock(path);
    assertExists(block);
    return block;
  };

  readonly block: BlockElement;

  readonly model: BlockModel;

  readonly text: Text;

  constructor(
    readonly std: EditorHost['std'],
    readonly point: TextRangePoint
  ) {
    this.block = this._blockFromPath(point.blockId);
    this.model = this.block.model;
    const text = this.model.text;
    assertExists(text);
    this.text = text;
  }
}

class PasteTr {
  private _getDeltas = () => {
    const firstTextSnapshot = this._textFromSnapshot(this.firstSnapshot!);
    const lastTextSnapshot = this._textFromSnapshot(this.lastSnapshot!);
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

  private _mergeCode = () => {
    const { toDelta } = this._getDeltas();
    const deltas: DeltaOperation[] = [
      { retain: this.fromPointState.point.index },
      this.fromPointState.text.length - this.fromPointState.point.index
        ? {
            delete:
              this.fromPointState.text.length - this.fromPointState.point.index,
          }
        : {},
    ];
    let i = 0;
    for (const blockSnapshot of this.snapshot.content) {
      if (blockSnapshot.props.text) {
        const text = this._textFromSnapshot(blockSnapshot);
        if (i > 0) {
          deltas.push({ insert: '\n' });
        }
        deltas.push(...text.delta);
        i++;
      } else {
        break;
      }
    }
    this.fromPointState.text.applyDelta(deltas.concat(toDelta));
    this.snapshot.content = [];
  };

  private _mergeMultiple = () => {
    this.firstSnapshot!.flavour = this.fromPointState.model.flavour;
    if (
      this.firstSnapshot!.props.type &&
      (this.fromPointState.text.length > 0 || this.firstSnapshotIsPlainText)
    ) {
      this.firstSnapshot!.props.type = (
        this.fromPointState.model as ParagraphBlockModel
      ).type;
    }
    if (this.lastSnapshot!.props.type && this.to) {
      this.lastSnapshot!.flavour = this.endPointState.model.flavour;
      this.lastSnapshot!.props.type = (
        this.endPointState.model as ParagraphBlockModel
      ).type;
    }

    const { lastTextSnapshot, toDelta, firstDelta, lastDelta } =
      this._getDeltas();

    this.fromPointState.text.applyDelta([
      { retain: this.fromPointState.point.index },
      this.fromPointState.text.length - this.fromPointState.point.index
        ? {
            delete:
              this.fromPointState.text.length - this.fromPointState.point.index,
          }
        : {},
      ...firstDelta,
    ]);

    const removedFirstSnapshot = this.snapshot.content.shift();
    removedFirstSnapshot?.children.map(block => {
      this.snapshot.content.unshift(block);
    });
    this.pasteStartModelChildrenCount =
      removedFirstSnapshot?.children.length ?? 0;

    this._updateSnapshot();

    lastTextSnapshot.delta = [...lastDelta, ...toDelta];
  };

  private _mergeSingle = () => {
    const { firstDelta } = this._getDeltas();
    this.fromPointState.text.applyDelta([
      { retain: this.fromPointState.point.index },
      this.fromPointState.point.length
        ? { delete: this.fromPointState.point.length }
        : {},
      ...firstDelta,
    ]);
    this.snapshot.content.splice(0, 1);
    this._updateSnapshot();
  };

  private _textFromSnapshot = (snapshot: BlockSnapshot) => {
    return (snapshot.props.text ?? { delta: [] }) as Record<
      'delta',
      DeltaOperation[]
    >;
  };

  private _updateSnapshot = () => {
    if (this.snapshot.content.length === 0) {
      this.firstSnapshot = this.lastSnapshot = undefined;
      return;
    }
    this.firstSnapshot = this.snapshot.content[0];
    this.lastSnapshot = findLast(
      this.snapshot.content[this.snapshot.content.length - 1]
    );
  };

  private readonly endPointState: PointState;

  private firstSnapshot?: BlockSnapshot;

  private readonly firstSnapshotIsPlainText: boolean;

  private readonly fromPointState: PointState;

  private readonly lastIndex: number;

  private lastSnapshot?: BlockSnapshot;

  // The model that the cursor should focus on after pasting
  private pasteStartModel: BlockModel | null = null;

  private pasteStartModelChildrenCount = 0;

  private readonly to: TextRangePoint | null;

  canMerge = () => {
    if (this.snapshot.content.length === 0) {
      return false;
    }
    const firstTextSnapshot = this._textFromSnapshot(this.firstSnapshot!);
    const lastTextSnapshot = this._textFromSnapshot(this.lastSnapshot!);
    return (
      firstTextSnapshot &&
      lastTextSnapshot &&
      ((this.fromPointState.text.length > 0 &&
        this.endPointState.text.length > 0) ||
        this.firstSnapshotIsPlainText)
    );
  };

  convertToLinkedDoc = async () => {
    const quickSearchService =
      this.std.spec.getService('affine:page').quickSearchService;

    if (!quickSearchService) {
      return;
    }

    const linkToDocId = new Map<string, string | null>();

    for (const blockSnapshot of this.snapshot.content) {
      if (blockSnapshot.props.text) {
        const delta = await this._transformLinkDelta(
          this._textFromSnapshot(blockSnapshot).delta,
          linkToDocId,
          quickSearchService
        );
        const model = this.std.doc.getBlockById(blockSnapshot.id);
        if (model) {
          this.std.doc.captureSync();
          this.std.doc.transact(() => {
            const text = model.text as Text;
            text.clear();
            text.applyDelta(delta);
          });
        }
      }
    }

    const fromPointStateText = this.fromPointState.model.text;
    if (!fromPointStateText) {
      return;
    }
    const delta = await this._transformLinkDelta(
      fromPointStateText.toDelta(),
      linkToDocId,
      quickSearchService
    );
    this.std.doc.captureSync();
    this.std.doc.transact(() => {
      fromPointStateText.clear();
      fromPointStateText.applyDelta(delta);
    });
  };

  focusPasted = () => {
    const host = this.std.host as EditorHost;

    const cursorBlock =
      this.fromPointState.model.flavour === 'affine:code' || !this.lastSnapshot
        ? this.std.doc.getBlock(this.fromPointState.model.id)
        : this.std.doc.getBlock(this.lastSnapshot.id);
    assertExists(cursorBlock);
    const { model: cursorModel } = cursorBlock;

    host.updateComplete
      .then(() => {
        const target = this.std.host.querySelector<BlockElement>(
          `[${host.blockIdAttr}="${cursorModel.id}"]`
        );
        assertExists(target);
        if (!cursorModel.text) {
          if (matchFlavours(cursorModel, ['affine:image'])) {
            const selection = this.std.selection.create('image', {
              blockId: target.blockId,
            });
            this.std.selection.setGroup('note', [selection]);
            return;
          }
          const selection = this.std.selection.create('block', {
            blockId: target.blockId,
          });
          this.std.selection.setGroup('note', [selection]);
          return;
        }
        const selection = this.std.selection.create('text', {
          from: {
            blockId: target.blockId,
            index: cursorModel.text ? this.lastIndex : 0,
            length: 0,
          },
          to: null,
        });
        this.std.selection.setGroup('note', [selection]);
      })
      .catch(console.error);
  };

  pasted = () => {
    const needCleanup = this.canMerge() || this.endPointState.text.length === 0;
    if (!needCleanup) {
      return;
    }

    if (this.to) {
      const context = this.std.command.exec('getSelectedModels', {
        types: ['text'],
      });
      for (const model of context.selectedModels ?? []) {
        if (
          [this.endPointState.model.id, this.fromPointState.model.id].includes(
            model.id
          ) ||
          this.snapshot.content.map(block => block.id).includes(model.id)
        ) {
          continue;
        }
        this.std.doc.deleteBlock(model);
      }
      this.std.doc.deleteBlock(
        this.endPointState.model,
        this.pasteStartModel
          ? {
              bringChildrenTo: this.pasteStartModel,
            }
          : undefined
      );
    }

    if (this.lastSnapshot) {
      const lastBlock = this.std.doc.getBlock(this.lastSnapshot.id);
      assertExists(lastBlock);
      const { model: lastModel } = lastBlock;
      this.std.doc.moveBlocks(this.fromPointState.model.children, lastModel);
    }

    this.std.doc.moveBlocks(
      this.std.doc
        .getNexts(this.fromPointState.model.id)
        .slice(0, this.pasteStartModelChildrenCount),
      this.fromPointState.model
    );
    if (
      !this.firstSnapshotIsPlainText &&
      this.fromPointState.text.length == 0
    ) {
      this.std.doc.deleteBlock(this.fromPointState.model);
    }
  };

  constructor(
    readonly std: EditorHost['std'],
    readonly text: TextSelection,
    readonly snapshot: SliceSnapshot
  ) {
    const { from, to } = text;
    const end = to ?? from;

    this.to = to;

    this.fromPointState = new PointState(std, from);
    this.endPointState = new PointState(std, end);

    this.firstSnapshot = snapshot.content[0];
    this.lastSnapshot = findLast(snapshot.content[snapshot.content.length - 1]);
    if (
      this.firstSnapshot !== this.lastSnapshot &&
      this.lastSnapshot.props.text
    ) {
      const text = fromJSON(this.lastSnapshot.props.text) as Text;
      const doc = new DocCollection.Y.Doc();
      const temp = doc.getMap('temp');
      temp.set('text', text.yText);
      this.lastIndex = text.length;
    } else {
      this.lastIndex =
        this.fromPointState.point.index +
        this.snapshot.content
          .map(snapshot =>
            this._textFromSnapshot(snapshot)
              .delta.map(op => {
                if (op.insert) {
                  return op.insert.length;
                } else if (op.delete) {
                  return -op.delete;
                } else {
                  return 0;
                }
              })
              .reduce((a, b) => a + b, 0)
          )
          .reduce((a, b) => a + b + 1, -1);
    }
    this.firstSnapshotIsPlainText =
      this.firstSnapshot.flavour === 'affine:paragraph' &&
      this.firstSnapshot.props.type === 'text';
  }

  private async _transformLinkDelta(
    delta: DeltaOperation[],
    linkToDocId: Map<string, string | null>,
    quickSearchService: QuickSearchService
  ) {
    const needToConvert = new Map<DeltaOperation, string>();
    for (const op of delta) {
      if (op.attributes?.link) {
        let docId = linkToDocId.get(op.attributes.link);
        if (docId === undefined) {
          const searchResult = await quickSearchService.searchDoc({
            userInput: op.attributes.link,
            skipSelection: true,
            action: 'insert',
          });
          if (searchResult && 'docId' in searchResult) {
            const doc = this.std.collection.getDoc(searchResult.docId);
            if (doc) {
              docId = doc.id;
              linkToDocId.set(op.attributes.link, doc.id);
            }
          }
        }
        if (docId) {
          needToConvert.set(op, docId);
        }
      }
    }
    const newDelta = delta.map(op => {
      if (needToConvert.has(op)) {
        this.std.spec
          .getService('affine:page')
          .telemetryService?.track('LinkedDocCreated', {
            page: 'doc editor',
            category: 'pasted link',
            type: 'doc',
            other: 'existing doc',
          });
        return {
          ...op,
          attributes: {
            reference: {
              pageId: needToConvert.get(op),
              type: 'LinkedPage',
            },
          },
          insert: ' ',
        };
      }
      return {
        ...op,
      };
    });
    return newDelta;
  }

  merge() {
    if (this.fromPointState.model.flavour === 'affine:code' && !this.to) {
      this._mergeCode();
      return;
    }

    if (this.firstSnapshot === this.lastSnapshot) {
      this._mergeSingle();
      return;
    }

    this._mergeMultiple();
  }
}

function flatNote(snapshot: SliceSnapshot) {
  if (snapshot.content[0]?.flavour === 'affine:note') {
    snapshot.content = snapshot.content[0].children;
  }
}

export const pasteMiddleware = (std: EditorHost['std']): JobMiddleware => {
  return ({ slots }) => {
    let tr: PasteTr | undefined;
    slots.beforeImport.on(payload => {
      if (payload.type === 'slice') {
        const { snapshot } = payload;
        flatNote(snapshot);

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
      if (payload.type === 'slice') {
        const context = std.command.exec('getSelectedModels', {
          types: ['block'],
        });
        for (const model of context.selectedModels ?? []) {
          std.doc.deleteBlock(model);
        }
      }
      if (tr && payload.type === 'slice') {
        tr.pasted();
        tr.focusPasted();
        tr.convertToLinkedDoc().catch(console.error);
      }
    });
  };
};
