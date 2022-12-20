import type * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness.js';
import { AwarenessAdapter, SelectionRange } from './awareness.js';
import type { RichTextAdapter } from './text-adapter.js';

export interface StackItem {
  meta: Map<'cursor-location', SelectionRange | undefined>;
  type: 'undo' | 'redo';
}

export class Space {
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
