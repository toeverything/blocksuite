import type * as Y from 'yjs';

import { DisposableGroup, Slot, assertExists } from '@blocksuite/global/utils';
import { YArrayEvent, YMapEvent, YTextEvent } from 'yjs';

import type { YBlock } from '../store/doc/block.js';
import type { BlockSuiteDoc } from '../yjs/index.js';

type DocId = string;

export type IndexBlockEvent =
  | {
      action: 'add' | 'update';
      block: YBlock;
      blockId: string;
      docId: DocId;
    }
  | {
      action: 'delete';
      block?: undefined;
      blockId: string;
      docId: DocId;
    };

export class BlockIndexer {
  private readonly _collectionSlots: {
    docAdded: Slot<string>;
    docRemoved: Slot<string>;
  };

  private _disposables = new DisposableGroup();

  private readonly _doc: BlockSuiteDoc;

  private _yDocObserver = (
    events: Y.YEvent<Y.AbstractType<unknown>>[],
    _transaction: Y.Transaction,
    { docId, yDoc }: { docId: DocId; yDoc: Y.Map<YBlock> }
  ) => {
    events.forEach(e => {
      if (e instanceof YArrayEvent) {
        // sys:children
        return;
      }

      if (e instanceof YMapEvent) {
        if (e.target !== e.currentTarget) {
          // add 'elements' to 'affine:surface' or add 'prop:xywh' to 'affine:note'
          if (e.keysChanged.has('prop:text')) {
            // update block text by `doc.updateBlock(paragraph, { text: new doc.Text() })` API
            const blockId = e.path[0] as string;
            const block = yDoc.get(blockId);
            assertExists(block);
            this._indexBlock({
              action: 'update',
              block,
              blockId,
              docId,
            });
          }
          return;
        }

        Array.from(e.changes.keys.entries()).forEach(
          ([blockId, { action }]) => {
            if (action === 'delete') {
              this._indexBlock({
                action,
                blockId,
                docId,
              });
              return;
            }
            // add or update
            const block = yDoc.get(blockId);
            assertExists(block);
            this._indexBlock({
              action,
              block,
              blockId,
              docId,
            });
          }
        );
        return;
      }
      if (e instanceof YTextEvent) {
        const blockId = e.path[0];
        if (!blockId || typeof blockId !== 'string') {
          throw new Error('Failed to update index! Unexpected YText Event!');
        }
        const block = yDoc.get(blockId);
        assertExists(block);
        this._indexBlock({
          action: 'update',
          block,
          blockId,
          docId,
        });
        return;
      }
    });
  };

  slots = {
    /**
     * Note: sys:children update will not trigger event
     */
    blockUpdated: new Slot<IndexBlockEvent>(),
    docRemoved: new Slot<DocId>(),
    refreshIndex: new Slot(),
  };

  constructor(
    doc: BlockSuiteDoc,
    {
      immediately = false,
      slots,
    }: {
      immediately?: boolean;
      readonly slots: {
        docAdded: Slot<string>;
        docRemoved: Slot<string>;
      };
    }
  ) {
    this._doc = doc;
    this._collectionSlots = slots;

    if (immediately) {
      this._initIndex();
      return;
    }
    // lazy init
    setTimeout(() => {
      this._initIndex();
    }, 0);
  }

  private _getDoc(docId: DocId): Y.Doc | undefined {
    return this._doc.spaces.get(docId) as Y.Doc | undefined;
  }

  private _indexBlock(indexEvent: IndexBlockEvent) {
    this.slots.blockUpdated.emit(indexEvent);
  }

  private _indexDoc(docId: string, yDoc: Y.Doc) {
    const yBlocks = yDoc.getMap<YBlock>('blocks');
    yBlocks.forEach((block, blockId) => {
      this._indexBlock({ action: 'add', block, blockId, docId });
    });

    const observer = (
      events: Y.YEvent<Y.AbstractType<unknown>>[],
      transaction: Y.Transaction
    ) => this._yDocObserver(events, transaction, { docId, yDoc: yBlocks });

    yBlocks.observeDeep(observer);
    return () => {
      yBlocks.unobserveDeep(observer);
    };
  }

  private _initIndex() {
    const doc = this._doc;
    const share = doc.share;
    if (!share.has('meta')) {
      throw new Error(
        'Failed to initialize indexer: collection meta not found'
      );
    }

    let disposeMap: Record<string, (() => void) | null> = {};
    this._disposables.add(() => {
      Object.values(disposeMap).forEach(fn => fn?.());
      disposeMap = {};
    });

    Array.from(doc.spaces.keys())
      .map(docId => ({ doc: this._getDoc(docId), docId }))
      .forEach(({ doc, docId }) => {
        assertExists(doc, `Failed to find doc '${docId}'`);
        if (disposeMap[docId]) {
          console.warn(
            `Duplicated docAdded event! ${docId} already observed`,
            disposeMap
          );
          return;
        }
        const dispose = this._indexDoc(docId, doc);
        disposeMap[docId] = dispose;
      });

    this._collectionSlots.docAdded.on(docId => {
      const doc = this._getDoc(docId);
      assertExists(doc, `Failed to find doc '${docId}'`);
      if (disposeMap[docId]) {
        // It's possible because the `docAdded` event is emitted once a new block is added to the doc
        return;
      }
      const dispose = this._indexDoc(docId, doc);
      disposeMap[docId] = dispose;
    });
    this._collectionSlots.docRemoved.on(docId => {
      disposeMap[docId]?.();
      disposeMap[docId] = null;
      this.slots.docRemoved.emit(docId);
    });
  }

  dispose() {
    this._disposables.dispose();
  }

  refreshIndex() {
    this.slots.refreshIndex.emit();
    this._initIndex();
  }
}
