import { Slot } from '@blocksuite/global/utils';
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

  private _loaded!: boolean;

  onLoadSlot = new Slot();

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

    this._ySpaceDoc = this._loadSubDoc();

    this._yBlocks = this._ySpaceDoc.getMap('blocks');
    this._proxy = createYMapProxy(this._yBlocks as Y.Map<unknown>);
  }

  get prefixedId() {
    return this.id.startsWith('space:') ? this.id : `space:${this.id}`;
  }

  get loaded() {
    return this._loaded;
  }

  private _loadSubDoc = () => {
    const prefixedId = this.prefixedId;

    let subDoc = this.doc.spaces.get(prefixedId);
    if (!subDoc) {
      subDoc = new Y.Doc();
      this.doc.spaces.set(prefixedId, subDoc);
      this._loaded = true;
      setImmediate(() => {
        this.onLoadSlot.emit();
      });
    } else {
      subDoc.load();
      this._loaded = false;
      this.doc.on('subdocs', this._onSubdocEvent);
    }

    return subDoc;
  };

  private _onSubdocEvent = ({ loaded }: { loaded: Set<Y.Doc> }): void => {
    const result = Array.from(loaded).find(
      doc => doc.guid === this._ySpaceDoc.guid
    );
    if (!result) {
      return;
    }
    this.doc.off('subdocs', this._onSubdocEvent);
    this._loaded = true;
    this.onLoadSlot.emit();
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
