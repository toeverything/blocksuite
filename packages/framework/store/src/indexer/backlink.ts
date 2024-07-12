import type { BaseTextAttributes, DeltaInsert } from '@blocksuite/inline';

import { DisposableGroup, Slot } from '@blocksuite/global/utils';
import { Text } from 'yjs';

import type { BlockIndexer, IndexBlockEvent } from './base.js';

type DocId = string;
type BlockId = string;
type LinkedNode = {
  type: 'LinkedPage' | 'Subpage';
  pageId: DocId;
  blockId: BlockId;
};
/**
 * Please sync type with {@link AffineTextAttributes} manually
 */
type TextDelta = DeltaInsert<
  BaseTextAttributes & { reference: Omit<LinkedNode, 'blockId'> }
>;

export type IndexUpdatedEvent =
  | {
      action: 'delete';
      docId: DocId;
      blockId?: BlockId;
    }
  | {
      action: 'add' | 'update';
      docId: DocId;
      blockId: BlockId;
    };

/**
 * Returns an object with four arrays: add, remove and unchanged.
 *
 * add: elements in after that are not in before
 * remove: elements in before that are not in after
 * unchanged: elements in both before and after
 */
function diffArray<T>(
  before: T[],
  after: T[],
  compare = (a: T, b: T) => a === b
) {
  const add: T[] = [];
  const remove: T[] = [];
  const unchanged: T[] = [];

  // Find elements in before that are not in after
  for (const elem of before) {
    if (!after.some(afterElem => compare(afterElem, elem))) {
      remove.push(elem);
    } else {
      unchanged.push(elem);
    }
  }
  // Find elements in after that are not in before
  for (const elem of after) {
    if (!before.some(beforeElem => compare(beforeElem, elem))) {
      add.push(elem);
    }
  }

  return { changed: add.length || remove.length, add, remove, unchanged };
}

export class BacklinkIndexer {
  // TODO use inverted index
  private _backlinkIndexMapCache: Record<DocId, LinkedNode[]> | null = null;

  private _disposables = new DisposableGroup();

  private _linkIndexMap: Record<DocId, Record<BlockId, LinkedNode[]>> = {};

  slots = {
    /**
     * Note: sys:children update will not trigger event
     */
    indexUpdated: new Slot<IndexUpdatedEvent>(),
  };

  constructor(blockIndexer: BlockIndexer) {
    this._disposables.add(
      blockIndexer.slots.refreshIndex.on(() => this._onRefreshIndex())
    );

    this._disposables.add(
      blockIndexer.slots.docRemoved.on(docId => this._onDocRemoved(docId))
    );

    this._disposables.add(
      blockIndexer.slots.blockUpdated.on(e => this._onBlockUpdated(e))
    );

    this.slots.indexUpdated.on(() => {
      this._backlinkIndexMapCache = null;
    });
  }

  private _indexDelta({
    action,
    docId,
    blockId,
    links,
  }: {
    action: IndexBlockEvent['action'];
    docId: DocId;
    blockId: BlockId;
    links: LinkedNode[];
  }) {
    const before = this._linkIndexMap[docId]?.[blockId] ?? [];
    const diff = diffArray(before, links);
    if (!diff.changed) return;

    this._linkIndexMap[docId] = {
      ...this._linkIndexMap[docId],
      [blockId]: links,
    };
    this.slots.indexUpdated.emit({ action, docId, blockId });
  }

  private _onBlockUpdated({ action, docId, block, blockId }: IndexBlockEvent) {
    switch (action) {
      case 'add':
      case 'update': {
        let links: LinkedNode[] = [];

        const text = block.get('prop:text');
        if (text) {
          if (text instanceof Text) {
            const deltas: TextDelta[] = text.toDelta();
            links = [
              ...links,
              ...deltas
                .filter(delta => delta.attributes && delta.attributes.reference)
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                .map(delta => ({ ...delta.attributes!.reference!, blockId })),
            ];
          } else {
            console.warn('Unexpected prop:text type', text);
          }
        }

        const flavour = block.get('sys:flavour');
        if (
          flavour === 'affine:embed-linked-doc' ||
          flavour === 'affine:embed-synced-doc'
        ) {
          const pageId = block.get('prop:pageId');
          if (typeof pageId === 'string') {
            links = [...links, { pageId, blockId, type: 'LinkedPage' }];
          } else {
            console.warn('Unexpected prop:pageId type', pageId);
          }
        }

        this._indexDelta({ action, docId, blockId, links });
        return;
      }
      case 'delete': {
        this._removeIndex(docId, blockId);
        break;
      }
    }
  }

  private _onDocRemoved(docId: DocId) {
    if (!this._linkIndexMap[docId]) {
      return;
    }
    this._linkIndexMap[docId] = {};
    this.slots.indexUpdated.emit({ action: 'delete', docId });
  }

  private _onRefreshIndex() {
    this._linkIndexMap = {};
  }

  private _removeIndex(docId: DocId, blockId: BlockId) {
    if (!this._linkIndexMap[docId] || !this._linkIndexMap[docId][blockId]) {
      return;
    }
    const previousLink = this._linkIndexMap[docId][blockId];
    delete this._linkIndexMap[docId][blockId];
    if (previousLink.length) {
      this.slots.indexUpdated.emit({
        action: 'delete',
        docId,
        blockId,
      });
    }
  }

  dispose() {
    this._disposables.dispose();
  }

  /**
   * Get the list of backlinks for a given doc
   */
  getBacklink(targetDocId: DocId) {
    if (this._backlinkIndexMapCache) {
      return this._backlinkIndexMapCache[targetDocId] ?? [];
    }
    const backlinkIndexMapCache: Record<DocId, LinkedNode[]> = {};
    for (const [fromDocId, blockMap] of Object.entries(this._linkIndexMap)) {
      for (const [fromBlockId, links] of Object.entries(blockMap)) {
        links.forEach(({ pageId, type }) => {
          if (!(pageId in backlinkIndexMapCache)) {
            backlinkIndexMapCache[pageId] = [];
          }
          backlinkIndexMapCache[pageId].push({
            pageId: fromDocId,
            blockId: fromBlockId,
            type,
          });
        });
      }
    }
    this._backlinkIndexMapCache = backlinkIndexMapCache;
    return this._backlinkIndexMapCache[targetDocId] ?? [];
  }

  get linkIndexMap() {
    return this._linkIndexMap;
  }
}
