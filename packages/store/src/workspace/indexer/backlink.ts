import {
  assertExists,
  diffArray,
  DisposableGroup,
  Slot,
} from '@blocksuite/global/utils';
import type { BaseTextAttributes } from '@blocksuite/virgo/index';
import type { DeltaInsert } from '@blocksuite/virgo/types';
import { Text } from 'yjs';

import type { DeltaOperation } from '../../text-adapter.js';
import type { Workspace } from '../workspace.js';
import type { BlockIndexer, IndexBlockEvent } from './base.js';

type PageId = string;
type BlockId = string;
type LinkedNode = {
  type: 'LinkedPage' | 'Subpage';
  pageId: PageId;
  blockId: BlockId;
};
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

/**
 * Please sync type with {@link AffineTextAttributes} manually
 */
function isSubpageDelta(delta: DeltaOperation, pageId: PageId) {
  return (
    delta.attributes &&
    delta.attributes.reference &&
    delta.attributes.reference.type === 'Subpage' &&
    delta.attributes.reference.pageId === pageId
  );
}

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

  public getBacklink(targetPageId: PageId) {
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

  /**
   * Returns all pages that have a subpage node to the given page.
   *
   * In most cases, there should be only one page. But it can not be guaranteed.
   */
  public getParentPageNodes(subpageId: PageId) {
    const backlinks = this.getBacklink(subpageId);
    return backlinks.filter(link => link.type === 'Subpage');
  }

  /**
   * Returns all subpage nodes in the given page.
   */
  public getSubpageNodes(pageId: PageId) {
    if (!(pageId in this._linkIndexMap)) {
      // page not found
      return [];
    }
    return Object.values(this._linkIndexMap[pageId])
      .flat()
      .filter(link => link.type === 'Subpage');
  }

  /**
   * Delete the specified subpage nodes from the workspace.
   */
  public removeSubpageNode(workspace: Workspace, subpageId: PageId) {
    const subpageNodes = this.getParentPageNodes(subpageId);
    if (subpageNodes.length > 1) {
      console.warn('Unexpected subpage node count', subpageId, subpageNodes);
    }

    subpageNodes.forEach(({ pageId, blockId }) => {
      const page = workspace.getPage(pageId);
      if (!page) {
        console.warn(
          'Failed to remove subpage node from page! page not found!'
        );
        return;
      }
      const block = page.getBlockById(blockId);
      if (!block) {
        console.warn(
          block,
          'Failed to remove subpage node from page! block not found! pageId: ' +
            `${page.id}, blockId: ${blockId}`
        );
        return;
      }
      const text = block.text;
      assertExists(text);

      page.transact(() => {
        let accIdx = 0;
        text.toDelta().forEach(delta => {
          const deltaLen = delta.insert?.length ?? 0;
          if (isSubpageDelta(delta, subpageId)) {
            text.format(accIdx, deltaLen, { reference: null });
          }
          accIdx += deltaLen ?? 0;
        });
      }, false);
    });
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
