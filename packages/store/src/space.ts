import type * as Y from 'yjs';

import type { AwarenessStore, UserRange } from './awareness.js';
import type { BlockSuiteDoc } from './yjs/index.js';

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
  /**
   * @internal The actual underlying Yjs map
   */
  protected readonly _ySpace: Y.Map<State[keyof State]>;

  shouldTransact = true;

  constructor(id: string, doc: BlockSuiteDoc, awarenessStore: AwarenessStore) {
    this.id = id;
    this.doc = doc;
    this.awarenessStore = awarenessStore;
    const prefixedId = this.id.startsWith('space:') ? this.id : this.prefixedId;
    this._ySpace = this.doc.getMap(prefixedId);
    this._proxy = this.doc.getMapProxy<string, State>(prefixedId);
  }

  get prefixedId() {
    return `space:${this.id}`;
  }

  /**
   * If `shouldTransact` is `false`, the transaction will not be push to the history stack.
   */
  transact(fn: () => void, shouldTransact = true) {
    this.doc.transact(
      fn,
      shouldTransact && this.shouldTransact ? this.doc.clientID : undefined
    );
  }
}
