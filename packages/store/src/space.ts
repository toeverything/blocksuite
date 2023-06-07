import * as Y from 'yjs';

import type { AwarenessStore, UserRange } from './awareness.js';
import type { BlockSuiteDoc } from './yjs/index.js';
import { createYMapProxy } from './yjs/index.js';

export interface StackItem {
  meta: Map<'cursor-location', UserRange | undefined>;
  type: 'undo' | 'redo';
}

export class Space<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  State extends Record<string, unknown> = Record<string, any>
> {
  /** unprefixed id */
  readonly id: string;
  readonly doc: BlockSuiteDoc;
  readonly awarenessStore: AwarenessStore;

  private _loaded: boolean;

  /**
   * @internal Used for convenient access to the underlying Yjs map,
   * can be used interchangeably with ySpace
   */
  protected readonly _proxy: State;
  protected readonly _ySpaceDoc: Y.Doc;
  protected readonly _yBlocks: Y.Map<State[keyof State]>;

  constructor(id: string, doc: BlockSuiteDoc, awarenessStore: AwarenessStore) {
    this.id = id;
    this.doc = doc;
    this.awarenessStore = awarenessStore;

    const prefixedId = this.id.startsWith('space:') ? this.id : this.prefixedId;
    let subDoc = doc.spaces.get(prefixedId);
    if (!subDoc) {
      subDoc = new Y.Doc();
      doc.spaces.set(prefixedId, subDoc);
      this._loaded = true;
    } else {
      subDoc.load();
      this._loaded = false;
      doc.on('subdocs', this._onSubdocEvent);
    }
    this._ySpaceDoc = subDoc;

    this._yBlocks = this._ySpaceDoc.getMap('blocks');
    this._proxy = createYMapProxy(this._yBlocks as Y.Map<unknown>);
  }

  get prefixedId() {
    return `space:${this.id}`;
  }

  get loaded() {
    return this._loaded;
  }

  private _onSubdocEvent = ({ loaded }: { loaded: Set<Y.Doc> }): void => {
    const result = Array.from(loaded).find(
      doc => doc.guid === this._ySpaceDoc.guid
    );
    if (result) {
      this._loaded = true;
      this.doc.off('subdocs', this._onSubdocEvent);
    }
  };

  /**
   * If `shouldTransact` is `false`, the transaction will not be push to the history stack.
   */
  transact(fn: () => void, shouldTransact = true) {
    this._ySpaceDoc.transact(
      fn,
      shouldTransact ? this.doc.clientID : undefined
    );
  }
}
