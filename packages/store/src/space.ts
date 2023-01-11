import type * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness.js';
import { AwarenessAdapter, SelectionRange } from './awareness.js';
import type { RichTextAdapter } from './text-adapter.js';
import type { DataInitializer } from './yjs/proxy.js';
import type { BlockSuiteDoc } from './yjs/index.js';

export interface StackItem {
  meta: Map<'cursor-location', SelectionRange | undefined>;
  type: 'undo' | 'redo';
}

export class Space<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Data extends Record<string, unknown> = Record<string, any>,
  Flags extends Record<string, boolean> = BlockSuiteFlags
> {
  /** unprefixed id */
  readonly id: string;
  readonly doc: BlockSuiteDoc;
  /**
   * @internal
   * @protected
   */
  protected readonly proxy: Data;
  protected readonly origin: Y.Map<Data[keyof Data]>;
  readonly awareness!: AwarenessAdapter<Flags>;
  readonly richTextAdapters = new Map<string, RichTextAdapter>();

  constructor(
    id: string,
    doc: BlockSuiteDoc,
    awareness: Awareness,
    options?: {
      valueInitializer?: DataInitializer<Partial<Data>>;
      defaultFlags?: Partial<Flags>;
    }
  ) {
    this.id = id;
    this.doc = doc;
    const targetId = this.id.startsWith('space:') ? this.id : this.prefixedId;
    this.origin = this.doc.getMap(targetId);
    this.proxy = this.doc.getMapProxy<string, Data>(targetId, {
      initializer: options?.valueInitializer,
    });

    const aware = awareness ?? new Awareness(this.doc);
    this.awareness = new AwarenessAdapter(this, aware, options?.defaultFlags);
  }

  get prefixedId() {
    return `space:${this.id}`;
  }

  transact(fn: () => void) {
    this.doc.transact(fn, this.doc.clientID);
  }
}
