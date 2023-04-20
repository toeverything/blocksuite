import { diffArray, DisposableGroup, Slot } from '@blocksuite/global/utils';
import type { BaseTextAttributes } from '@blocksuite/virgo/index';
import type { DeltaInsert } from '@blocksuite/virgo/types';
import { Text } from 'yjs';

import type { BlockIndexer, IndexBlockEvent } from './base.js';

type PageId = string;
type BlockId = string;
type LinkedNode = { type: 'LinkedPage' | 'Subpage'; pageId: PageId };
/**
 * Please sync type with {@link AffineTextAttributes} manually
 */
type TextDelta = DeltaInsert<BaseTextAttributes & { reference: LinkedNode }>;

export type IndexUpdatedEvent =
  | {
      action: 'delete';
      pageId: PageId;
      blockId?: BlockId;
    }
  | {
      action: 'add' | 'update';
      pageId: PageId;
      blockId: BlockId;
    };

type TextIndexer = {
  onPageRemoved: (pageId: PageId) => void;
  onBlockUpdated: ({ action, pageId, block, blockId }: IndexBlockEvent) => void;
  onRefreshIndex: () => void;
};

export class BacklinkIndexer implements TextIndexer {
  private _linkIndexMap: Record<PageId, Record<BlockId, LinkedNode[]>> = {};
  private _disposables = new DisposableGroup();
  public slots = {
    /**
     * Note: sys:children update will not trigger event
     */
    indexUpdated: new Slot<IndexUpdatedEvent>(),
  };

  constructor(blockIndexer: BlockIndexer) {
    this._disposables.add(
      blockIndexer.slots.refreshIndex.on(() => this.onRefreshIndex())
    );

    this._disposables.add(
      blockIndexer.slots.pageRemoved.on(pageId => this.onPageRemoved(pageId))
    );

    this._disposables.add(
      blockIndexer.slots.blockUpdated.on(e => this.onBlockUpdated(e))
    );
  }

  getBacklink(targetPageId: PageId) {
    // TODO add inverted index
    const backlinkList: {
      pageId: PageId;
      blockId: BlockId;
      type: LinkedNode['type'];
    }[] = [];
    for (const [pageId, blockMap] of Object.entries(this._linkIndexMap)) {
      for (const [blockId, links] of Object.entries(blockMap)) {
        const backlink = links.filter(link => link.pageId === targetPageId);
        backlink.forEach(({ type }) => {
          backlinkList.push({ pageId, blockId, type });
        });
      }
    }
    return backlinkList;
  }

  getParentPageNodes(subpageId: PageId) {
    const backlinks = this.getBacklink(subpageId);
    return backlinks.filter(
      link => link.type === 'Subpage' && link.pageId === subpageId
    );
  }

  getSubpageNodes(pageId: PageId) {
    if (!(pageId in this._linkIndexMap)) {
      return [];
    }
    return Object.values(this._linkIndexMap[pageId])
      .flat()
      .filter(link => link.type === 'Subpage');
  }

  /**
   * @internal
   */
  onRefreshIndex() {
    this._linkIndexMap = {};
  }

  /**
   * @internal
   */
  onPageRemoved(pageId: PageId) {
    if (!this._linkIndexMap[pageId]) {
      return;
    }
    this._linkIndexMap[pageId] = {};
    this.slots.indexUpdated.emit({ action: 'delete', pageId });
  }

  /**
   * @internal
   */
  onBlockUpdated({ action, pageId, block, blockId }: IndexBlockEvent) {
    switch (action) {
      case 'add':
      case 'update': {
        const text = block.get('prop:text');
        if (!(text instanceof Text)) {
          if (text) {
            console.warn('Unexpected prop:text type', text);
          }
          return;
        }
        const deltas: TextDelta[] = text.toDelta();
        this._indexDelta({ action, pageId, blockId, deltas });
        return;
      }
      case 'delete': {
        this._removeIndex(pageId, blockId);
        break;
      }
    }
  }

  private _indexDelta({
    action,
    pageId,
    blockId,
    deltas,
  }: {
    action: IndexBlockEvent['action'];
    pageId: PageId;
    blockId: BlockId;
    deltas: TextDelta[];
  }) {
    if (!deltas.length) return;
    const links = deltas
      .filter(delta => delta.attributes && delta.attributes.reference)
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      .map(delta => delta.attributes!.reference!);
    if (
      !links.length &&
      (!this._linkIndexMap[pageId] || !this._linkIndexMap[pageId][blockId])
    )
      return;

    const before = this._linkIndexMap[pageId]?.[blockId] ?? [];
    const diff = diffArray(before, links);
    if (!diff.changed) return;

    this._linkIndexMap[pageId] = {
      ...this._linkIndexMap[pageId],
      [blockId]: links,
    };
    this.slots.indexUpdated.emit({ action: action, pageId, blockId });
  }

  private _removeIndex(pageId: PageId, blockId: BlockId) {
    if (!this._linkIndexMap[pageId] || !this._linkIndexMap[pageId][blockId]) {
      return;
    }
    const previousLink = this._linkIndexMap[pageId][blockId];
    delete this._linkIndexMap[pageId][blockId];
    if (previousLink.length) {
      this.slots.indexUpdated.emit({
        action: 'delete',
        pageId,
        blockId,
      });
    }
  }

  dispose() {
    this._disposables.dispose();
  }
}
