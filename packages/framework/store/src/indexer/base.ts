import type * as Y from 'yjs';

import { DisposableGroup, Slot, assertExists } from '@blocksuite/global/utils';
import { YArrayEvent, YMapEvent, YTextEvent } from 'yjs';

import type { YBlock } from '../store/doc/block/index.js';
import type { BlockSuiteDoc } from '../yjs/index.js';

type DocId = string;

export type IndexBlockEvent =
  | {
      docId: DocId;
      blockId: string;
      action: 'add' | 'update';
      block: YBlock;
    }
  | {
      docId: DocId;
      blockId: string;
      action: 'delete';
      block?: undefined;
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
              docId,
              blockId,
              block,
            });
          }
          return;
        }

        Array.from(e.changes.keys.entries()).forEach(
          ([blockId, { action }]) => {
            if (action === 'delete') {
              this._indexBlock({
                action,
                docId,
                blockId,
              });
              return;
            }
            // add or update
            const block = yDoc.get(blockId);
            assertExists(block);
            this._indexBlock({
              action,
              docId,
              blockId,
              block,
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
          docId,
          blockId,
          block,
        });
        return;
      }
    });
  };

  slots = {
    docRemoved: new Slot<DocId>(),
    /**
     * Note: sys:children update will not trigger event
     */
    blockUpdated: new Slot<IndexBlockEvent>(),
    refreshIndex: new Slot(),
  };

  constructor(
    doc: BlockSuiteDoc,
    {
      immediately = false,
      slots,
    }: {
      readonly slots: {
        docAdded: Slot<string>;
        docRemoved: Slot<string>;
      };
      immediately?: boolean;
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
      this._indexBlock({ action: 'add', docId, blockId, block });
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
      .map(docId => ({ docId, doc: this._getDoc(docId) }))
      .forEach(({ docId, doc }) => {
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
