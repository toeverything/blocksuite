import { Slot } from '@blocksuite/global/utils';
import * as Y from 'yjs';

import type { AwarenessStore } from '../yjs/awareness.js';
import type { BlockSuiteDoc } from '../yjs/index.js';

export interface StackItem {
  meta: Map<'cursor-location' | 'selection-state', unknown>;
}

export class Space<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  State extends Record<string, unknown> = Record<string, any>,
> {
  get yBlocks() {
    return this._yBlocks;
  }

  get loaded() {
    return this._loaded;
  }

  get spaceDoc() {
    return this._ySpaceDoc;
  }

  private _loaded!: boolean;

  private _onLoadSlot = new Slot();

  /**
   * @internal Used for convenient access to the underlying Yjs map,
   * can be used interchangeably with ySpace
   */
  protected readonly _ySpaceDoc: Y.Doc;

  protected readonly _yBlocks: Y.Map<State[keyof State]>;

  readonly id: string;

  readonly rootDoc: BlockSuiteDoc;

  readonly awarenessStore: AwarenessStore;

  constructor(
    id: string,
    rootDoc: BlockSuiteDoc,
    awarenessStore: AwarenessStore
  ) {
    this.id = id;
    this.rootDoc = rootDoc;
    this.awarenessStore = awarenessStore;

    this._ySpaceDoc = this._initSubDoc();

    this._yBlocks = this._ySpaceDoc.getMap('blocks');
  }

  private _initSubDoc = () => {
    let subDoc = this.rootDoc.spaces.get(this.id);
    if (!subDoc) {
      subDoc = new Y.Doc({
        guid: this.id,
      });
      this.rootDoc.spaces.set(this.id, subDoc);
      this._loaded = true;
      this._onLoadSlot.emit();
    } else {
      this._loaded = false;
      this.rootDoc.on('subdocs', this._onSubdocEvent);
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
    this.rootDoc.off('subdocs', this._onSubdocEvent);
    this._loaded = true;
    this._onLoadSlot.emit();
  };

  load() {
    this._ySpaceDoc.load();

    return this;
  }

  remove() {
    this.destroy();
    this.rootDoc.spaces.delete(this.id);
  }

  destroy() {
    this._ySpaceDoc.destroy();
    this._onLoadSlot.dispose();
    this._loaded = false;
  }

  clear() {
    this._yBlocks.clear();
  }

  /**
   * If `shouldTransact` is `false`, the transaction will not be push to the history stack.
   */
  transact(fn: () => void, shouldTransact = true) {
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
}
