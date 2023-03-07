import type * as Y from 'yjs';

import type { AwarenessStore, UserRange } from './awareness.js';
import type { RichTextAdapter } from './text-adapter.js';
import type { BlockSuiteDoc } from './yjs/index.js';

export interface StackItem {
  meta: Map<'cursor-location', UserRange | undefined>;
  type: 'undo' | 'redo';
}

export class Space<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Data extends Record<string, unknown> = Record<string, any>,
  Flags extends Record<string, unknown> = BlockSuiteFlags
> {
  /** unprefixed id */
  readonly id: string;
  readonly doc: BlockSuiteDoc;
  readonly awarenessStore: AwarenessStore;
  /**
   * @internal
   * @protected
   */
  protected readonly proxy: Data;
  protected readonly origin: Y.Map<Data[keyof Data]>;
  readonly richTextAdapters = new Map<string, RichTextAdapter>();

  constructor(id: string, doc: BlockSuiteDoc, awarenessStore: AwarenessStore) {
    this.id = id;
    this.doc = doc;
    this.awarenessStore = awarenessStore;
    const targetId = this.id.startsWith('space:') ? this.id : this.prefixedId;
    this.origin = this.doc.getMap(targetId);
    this.proxy = this.doc.getMapProxy<string, Data>(targetId);
  }

  get prefixedId() {
    return `space:${this.id}`;
  }

  transact(fn: () => void) {
    this.doc.transact(fn, this.doc.clientID);
  }
}
