import { Slot } from '@blocksuite/global/utils';
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

  private _onLoadSlot = new Slot();

  /**
   * @internal Used for convenient access to the underlying Yjs map,
   * can be used interchangeably with ySpace
   */
  protected readonly _ySpaceDoc: Y.Doc;
  protected readonly _yBlocks: Y.Map<State[keyof State]>;

  constructor(id: string, doc: BlockSuiteDoc, awarenessStore: AwarenessStore) {
    this.id = id;
    this.doc = doc;
    this.awarenessStore = awarenessStore;

    this._ySpaceDoc = this._initSubDoc();

    this._yBlocks = this._ySpaceDoc.getMap('blocks');
  }

  get loaded() {
    return this._loaded;
  }

  get spaceDoc() {
    return this._ySpaceDoc;
  }

  async load() {
    if (this.loaded) {
      return this;
    }

    const promise = new Promise(resolve => {
      this._onLoadSlot.once(() => {
        resolve(undefined);
      });
    });

    this._ySpaceDoc.load();

    await promise;

    return this;
  }

  remove() {
    this.destroy();
    this.doc.spaces.delete(this.id);
  }

  destroy() {
    this._ySpaceDoc.destroy();
    this._onLoadSlot.dispose();
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
      });
      this.doc.spaces.set(this.id, subDoc);
      this._loaded = true;
      this._onLoadSlot.emit();
    } else {
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
    this._onLoadSlot.emit();
  };

  /**
   * If `shouldTransact` is `false`, the transaction will not be push to the history stack.
   */
  transact(fn: () => void, shouldTransact = true) {
    this._ySpaceDoc.transact(fn, shouldTransact ? this.doc.clientID : null);
  }
}
