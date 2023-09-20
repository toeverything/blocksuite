import * as Y from 'yjs';

import type { AwarenessStore } from '../yjs/awareness.js';
import type { BlockSuiteDoc } from '../yjs/index.js';

export interface StackItem {
  meta: Map<'cursor-location' | 'selection-state', unknown>;
  type: 'undo' | 'redo';
}

export class Space<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  State extends Record<string, unknown> = Record<string, any>,
> {
  readonly id: string;
  readonly doc: BlockSuiteDoc;
  readonly awarenessStore: AwarenessStore;

  private _loaded!: boolean;

  /**
   * @internal Used for convenient access to the underlying Yjs map,
   * can be used interchangeably with ySpace
   */
  protected _proxy: State;
  protected _ySpaceDoc: Y.Doc;
  protected _yBlocks: Y.Map<State[keyof State]>;

  constructor(id: string, doc: BlockSuiteDoc, awarenessStore: AwarenessStore) {
    this.id = id;
    this.doc = doc;
    this.awarenessStore = awarenessStore;

    // Always create a new sub document even if it not exists.
    //  This is safe because CRDT will merge the changes correctly.
    this._ySpaceDoc = this._initSubDoc();

    this._yBlocks = this._ySpaceDoc.getMap('blocks');
    this._proxy = this.doc.proxy.createYProxy(this._yBlocks as Y.Map<unknown>);
  }

  get loaded() {
    return this._loaded;
  }

  get spaceDoc() {
    return this._ySpaceDoc;
  }

  async waitForLoaded() {
    if (this.loaded) {
      return this;
    }

    this._ySpaceDoc.load();
    await this._ySpaceDoc.whenLoaded;

    return this;
  }

  remove() {
    this.destroy();
    this.doc.spaces.delete(this.id);
  }

  destroy() {
    this._ySpaceDoc.destroy();
    this._loaded = false;
  }

  clear() {
    this._yBlocks.clear();
  }

  private _initSubDoc = () => {
    let subDoc = this.doc.spaces.get(this.id);
    if (!subDoc) {
      subDoc = new Y.Doc({
        guid: this.id,
        // lazy load guarantee
        autoLoad: false,
        shouldLoad: false,
      });
      this.doc.spaces.set(this.id, subDoc);
    }

    return subDoc;
  };

  /**
   * If `shouldTransact` is `false`, the transaction will not be push to the history stack.
   */
  transact(fn: () => void, shouldTransact = true) {
    this._ySpaceDoc.transact(fn, shouldTransact ? this.doc.clientID : null);
  }
}
