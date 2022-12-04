import type * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness.js';
import { AwarenessAdapter, SelectionRange } from './awareness';
import type { BaseBlockModel } from './base';
import type { RichTextAdapter } from './text-adapter';

export interface StackItem {
  meta: Map<'cursor-location', SelectionRange | undefined>;
  type: 'undo' | 'redo';
}

export class Space<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  IBlockSchema extends Record<string, typeof BaseBlockModel> = any
> {
  readonly id: string;
  readonly doc: Y.Doc;
  readonly awareness!: AwarenessAdapter;
  readonly richTextAdapters = new Map<string, RichTextAdapter>();

  constructor(id: string, doc: Y.Doc, awareness: Awareness) {
    this.id = id;
    this.doc = doc;

    const aware = awareness ?? new Awareness(this.doc);
    this.awareness = new AwarenessAdapter(this, aware);
  }

  transact(fn: () => void) {
    this.doc.transact(fn, this.doc.clientID);
  }
}
