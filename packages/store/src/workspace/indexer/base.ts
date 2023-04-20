import { assertExists, DisposableGroup, Slot } from '@blocksuite/global/utils';
import type * as Y from 'yjs';
import { YArrayEvent, YMapEvent, YTextEvent } from 'yjs';

import type { BlockSuiteDoc, BlockSuiteDocData } from '../../yjs/index.js';
import type { YBlock } from '../page.js';

type PageId = string;

export type IndexBlockEvent =
  | {
      pageId: PageId;
      blockId: string;
      action: 'add' | 'update';
      block: YBlock;
    }
  | {
      pageId: PageId;
      blockId: string;
      action: 'delete';
      block?: undefined;
    };

export class BlockIndexer {
  private readonly _doc: Y.Doc;
  private readonly _workspaceSlots: {
    pageAdded: Slot<string>;
    pageRemoved: Slot<string>;
  };
  private _disposables = new DisposableGroup();

  public slots = {
    pageRemoved: new Slot<PageId>(),
    /**
     * Note: sys:children update will not trigger event
     */
    blockUpdated: new Slot<IndexBlockEvent>(),
    refreshIndex: new Slot(),
  };

  constructor(
    doc: BlockSuiteDoc<BlockSuiteDocData>,
    {
      immediately = false,
      slots,
    }: {
      readonly slots: {
        pageAdded: Slot<string>;
        pageRemoved: Slot<string>;
      };
      immediately?: boolean;
    }
  ) {
    this._doc = doc;
    this._workspaceSlots = slots;

    if (immediately) {
      this._initIndex();
      return;
    }
    // lazy init
    if ('requestIdleCallback' in globalThis) {
      requestIdleCallback(() => {
        this._initIndex();
      });
      return;
    }
    // fallback to setTimeout
    setTimeout(() => {
      this._initIndex();
    }, 0);
  }

  private _initIndex() {
    const doc = this._doc;
    const share = doc.share;
    if (!share.has('space:meta')) {
      throw new Error("Failed to initialize indexer: 'space:meta' not found");
    }

    let disposeMap: Record<string, (() => void) | null> = {};
    this._disposables.add(() => {
      Object.values(disposeMap).forEach(fn => fn?.());
      disposeMap = {};
    });

    Array.from(doc.share.keys())
      // filter out 'space:meta'
      .filter(pageId => pageId !== 'space:meta')
      .map(pageId =>
        pageId.startsWith('space:') ? pageId.slice('space:'.length) : pageId
      )
      .map(pageId => ({ pageId, page: this._getPage(pageId) }))
      .forEach(({ pageId, page }) => {
        assertExists(page, `Failed to find page '${pageId}'`);
        const dispose = this._indexPage(pageId, page);
        if (disposeMap[pageId]) {
          console.warn(
            `Duplicated pageAdded event! ${pageId} already observed`,
            disposeMap
          );
          return;
        }
        disposeMap[pageId] = dispose;
      });

    this._workspaceSlots.pageAdded.on(pageId => {
      const page = this._getPage(pageId);
      assertExists(page, `Failed to find page '${pageId}'`);
      const dispose = this._indexPage(pageId, page);
      if (disposeMap[pageId]) {
        console.warn(
          `Duplicated pageAdded event! ${pageId} already observed`,
          disposeMap
        );
        return;
      }
      disposeMap[pageId] = dispose;
    });
    this._workspaceSlots.pageRemoved.on(pageId => {
      disposeMap[pageId]?.();
      disposeMap[pageId] = null;
      this.slots.pageRemoved.emit(pageId);
    });
  }

  private _indexPage(pageId: string, yPage: Y.Map<YBlock>) {
    yPage.forEach((block, blockId) => {
      this._indexBlock({ action: 'add', pageId, blockId, block });
    });

    const observer = (
      events: Y.YEvent<Y.AbstractType<unknown>>[],
      transaction: Y.Transaction
    ) => this._yPageObserver(events, transaction, { pageId, yPage });

    yPage.observeDeep(observer);
    return () => {
      yPage.unobserveDeep(observer);
    };
  }

  private _indexBlock(indexEvent: IndexBlockEvent) {
    this.slots.blockUpdated.emit(indexEvent);
  }

  private _yPageObserver = (
    events: Y.YEvent<Y.AbstractType<unknown>>[],
    transaction: Y.Transaction,
    { pageId, yPage }: { pageId: PageId; yPage: Y.Map<YBlock> }
  ) => {
    events.forEach(e => {
      if (e instanceof YArrayEvent) {
        // sys:children
        return;
      }

      if (e instanceof YMapEvent) {
        if (e.target !== e.currentTarget) {
          // add 'elements' to 'affine:surface' or add 'prop:xywh' to 'affine:frame'
          if (e.keysChanged.has('prop:text')) {
            console.warn(
              'Unexpected prop:text changed! Please update text indexer',
              e
            );
          }
          return;
        }

        Array.from(e.changes.keys.entries()).forEach(
          ([blockId, { action }]) => {
            if (action === 'delete') {
              this._indexBlock({
                action,
                pageId,
                blockId,
              });
              return;
            }
            // add or update
            const block = yPage.get(blockId);
            assertExists(block);
            this._indexBlock({
              action,
              pageId,
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
        const block = yPage.get(blockId);
        assertExists(block);
        this._indexBlock({
          action: 'update',
          pageId,
          blockId,
          block,
        });
        return;
      }
    });
  };

  private _getPage(pageId: PageId): Y.Map<YBlock> | undefined {
    if (pageId.startsWith('space:')) {
      console.warn('Unexpected page prefix', pageId);
    }
    pageId = `space:${pageId}`;
    return this._doc.getMap(pageId);
  }

  refreshIndex() {
    this.slots.refreshIndex.emit();
    this._initIndex();
  }

  dispose() {
    this._disposables.dispose();
  }
}
