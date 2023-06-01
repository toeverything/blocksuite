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

    this._ySpaceDoc = new Y.Doc();
    const prefixedId = this.id.startsWith('space:') ? this.id : this.prefixedId;
    doc.spaces.set(prefixedId, this._ySpaceDoc);

    this._yBlocks = this._ySpaceDoc.getMap('blocks');
    this._proxy = createYMapProxy(this._yBlocks as Y.Map<unknown>);
  }

  get prefixedId() {
    return `space:${this.id}`;
  }

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
