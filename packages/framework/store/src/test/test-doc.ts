import { signal } from '@preact/signals-core';
import { Subject } from 'rxjs';
import * as Y from 'yjs';

import type { YBlock } from '../model/block/types.js';
import type { Doc, GetBlocksOptions, Workspace } from '../model/index.js';
import type { Query } from '../model/store/query.js';
import { Store } from '../model/store/store.js';
import type { AwarenessStore } from '../yjs/index.js';
import type { TestWorkspace } from './test-workspace.js';

type DocOptions = {
  id: string;
  collection: Workspace;
  doc: Y.Doc;
  awarenessStore: AwarenessStore;
};

export class TestDoc implements Doc {
  private readonly _canRedo$ = signal(false);

  private readonly _canUndo$ = signal(false);

  private readonly _collection: Workspace;

  private readonly _storeMap = new Map<string, Store>();

  // doc/space container.
  private readonly _handleYEvents = (events: Y.YEvent<YBlock | Y.Text>[]) => {
    events.forEach(event => this._handleYEvent(event));
  };

  private _history!: Y.UndoManager;

  private readonly _historyObserver = () => {
    this._updateCanUndoRedoSignals();
    this.slots.historyUpdated.next();
  };

  private readonly _initSubDoc = () => {
    let subDoc = this.rootDoc.getMap('spaces').get(this.id);
    if (!subDoc) {
      subDoc = new Y.Doc({
        guid: this.id,
      });
      this.rootDoc.getMap('spaces').set(this.id, subDoc);
      this._loaded = true;
      this._onLoadSlot.next();
    } else {
      this._loaded = false;
      this.rootDoc.on('subdocs', this._onSubdocEvent);
    }

    return subDoc;
  };

  private _loaded!: boolean;

  private readonly _onLoadSlot = new Subject<void>();

  private readonly _onSubdocEvent = ({
    loaded,
  }: {
    loaded: Set<Y.Doc>;
  }): void => {
    const result = Array.from(loaded).find(
      doc => doc.guid === this._ySpaceDoc.guid
    );
    if (!result) {
      return;
    }
    this.rootDoc.off('subdocs', this._onSubdocEvent);
    this._loaded = true;
    this._onLoadSlot.next();
  };

  /** Indicate whether the block tree is ready */
  private _ready = false;

  private _shouldTransact = true;

  private readonly _updateCanUndoRedoSignals = () => {
    const canRedo = this._history.canRedo();
    const canUndo = this._history.canUndo();
    if (this._canRedo$.peek() !== canRedo) {
      this._canRedo$.value = canRedo;
    }
    if (this._canUndo$.peek() !== canUndo) {
      this._canUndo$.value = canUndo;
    }
  };

  protected readonly _yBlocks: Y.Map<YBlock>;

  /**
   * @internal Used for convenient access to the underlying Yjs map,
   * can be used interchangeably with ySpace
   */
  protected readonly _ySpaceDoc: Y.Doc;

  readonly awarenessStore: AwarenessStore;

  readonly id: string;

  readonly rootDoc: Y.Doc;

  readonly slots = {
    historyUpdated: new Subject<void>(),
    yBlockUpdated: new Subject<
      | {
          type: 'add';
          id: string;
          isLocal: boolean;
        }
      | {
          type: 'delete';
          id: string;
          isLocal: boolean;
        }
    >(),
  };

  get blobSync() {
    return this.workspace.blobSync;
  }

  get canRedo() {
    return this._canRedo$.peek();
  }

  get canRedo$() {
    return this._canRedo$;
  }

  get canUndo() {
    return this._canUndo$.peek();
  }

  get canUndo$() {
    return this._canUndo$;
  }

  get workspace() {
    return this._collection;
  }

  get history() {
    return this._history;
  }

  get isEmpty() {
    return this._yBlocks.size === 0;
  }

  get loaded() {
    return this._loaded;
  }

  get meta() {
    return this.workspace.meta.getDocMeta(this.id);
  }

  get ready() {
    return this._ready;
  }

  get spaceDoc() {
    return this._ySpaceDoc;
  }

  get yBlocks() {
    return this._yBlocks;
  }

  constructor({ id, collection, doc, awarenessStore }: DocOptions) {
    this.id = id;
    this.rootDoc = doc;
    this.awarenessStore = awarenessStore;

    this._ySpaceDoc = this._initSubDoc() as Y.Doc;

    this._yBlocks = this._ySpaceDoc.getMap('blocks');
    this._collection = collection;
  }

  private _getReadonlyKey(readonly?: boolean): 'true' | 'false' {
    return (readonly?.toString() as 'true' | 'false') ?? 'false';
  }

  private _handleYBlockAdd(id: string, isLocal: boolean) {
    this.slots.yBlockUpdated.next({ type: 'add', id, isLocal });
  }

  private _handleYBlockDelete(id: string, isLocal: boolean) {
    this.slots.yBlockUpdated.next({ type: 'delete', id, isLocal });
  }

  private _handleYEvent(event: Y.YEvent<YBlock | Y.Text | Y.Array<unknown>>) {
    // event on top-level block store
    if (event.target !== this._yBlocks) {
      return;
    }
    const isLocal =
      !event.transaction.origin ||
      !this._yBlocks.doc ||
      event.transaction.origin instanceof Y.UndoManager ||
      event.transaction.origin.proxy
        ? true
        : event.transaction.origin === this._yBlocks.doc.clientID;
    event.keys.forEach((value, id) => {
      try {
        if (value.action === 'add') {
          this._handleYBlockAdd(id, isLocal);
          return;
        }
        if (value.action === 'delete') {
          this._handleYBlockDelete(id, isLocal);
          return;
        }
      } catch (e) {
        console.error('An error occurred while handling Yjs event:');
        console.error(e);
      }
    });
  }

  private _initYBlocks() {
    const { _yBlocks } = this;
    _yBlocks.observeDeep(this._handleYEvents);
    this._history = new Y.UndoManager([_yBlocks], {
      trackedOrigins: new Set([this._ySpaceDoc.clientID]),
    });

    this._history.on('stack-cleared', this._historyObserver);
    this._history.on('stack-item-added', this._historyObserver);
    this._history.on('stack-item-popped', this._historyObserver);
    this._history.on('stack-item-updated', this._historyObserver);
  }

  /** Capture current operations to undo stack synchronously. */
  captureSync() {
    this._history.stopCapturing();
  }

  clear() {
    this._yBlocks.clear();
  }

  clearQuery(query: Query, readonly?: boolean) {
    const key = this._getQueryKey({ readonly, query });
    this._storeMap.delete(key);
  }

  private _destroy() {
    this._ySpaceDoc.destroy();
    this._onLoadSlot.complete();
    this._loaded = false;
  }

  dispose() {
    this.slots.historyUpdated.complete();

    if (this.ready) {
      this._yBlocks.unobserveDeep(this._handleYEvents);
      this._yBlocks.clear();
    }
  }

  private readonly _getQueryKey = (
    idOrOptions: string | { readonly?: boolean; query?: Query }
  ) => {
    if (typeof idOrOptions === 'string') {
      return idOrOptions;
    }
    const { readonly, query } = idOrOptions;
    const readonlyKey = this._getReadonlyKey(readonly);
    const key = JSON.stringify({
      readonlyKey,
      query,
    });
    return key;
  };

  getStore({
    readonly,
    query,
    provider,
    extensions,
    id,
  }: GetBlocksOptions = {}) {
    let idOrOptions: string | { readonly?: boolean; query?: Query };
    if (id) {
      idOrOptions = id;
    } else if (readonly === undefined && query === undefined) {
      idOrOptions = this.spaceDoc.guid;
    } else {
      idOrOptions = { readonly, query };
    }
    const key = this._getQueryKey(idOrOptions);

    if (this._storeMap.has(key)) {
      return this._storeMap.get(key)!;
    }

    const doc = new Store({
      doc: this,
      readonly,
      query,
      provider,
      extensions: (this.workspace as TestWorkspace).storeExtensions.concat(
        extensions ?? []
      ),
    });

    this._storeMap.set(key, doc);

    return doc;
  }

  load(initFn?: () => void): this {
    if (this.ready) {
      return this;
    }

    this._ySpaceDoc.load();

    this._initYBlocks();

    this._yBlocks.forEach((_, id) => {
      this._handleYBlockAdd(id, false);
    });

    initFn?.();

    this._ready = true;

    return this;
  }

  redo() {
    this._history.redo();
  }

  undo() {
    this._history.undo();
  }

  remove() {
    this._destroy();
    this.rootDoc.getMap('spaces').delete(this.id);
  }

  resetHistory() {
    this._history.clear();
  }

  /**
   * If `shouldTransact` is `false`, the transaction will not be push to the history stack.
   */
  transact(fn: () => void, shouldTransact: boolean = this._shouldTransact) {
    this._ySpaceDoc.transact(
      () => {
        try {
          fn();
        } catch (e) {
          console.error(
            `An error occurred while Y.doc ${this._ySpaceDoc.guid} transacting:`
          );
          console.error(e);
        }
      },
      shouldTransact ? this.rootDoc.clientID : null
    );
  }

  withoutTransact(callback: () => void) {
    this._shouldTransact = false;
    callback();
    this._shouldTransact = true;
  }
}
