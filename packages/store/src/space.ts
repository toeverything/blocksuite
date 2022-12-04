import type * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness.js';
import { AwarenessAdapter, SelectionRange } from './awareness';
import type { BaseBlockModel } from './base';
import type { RichTextAdapter, TextType } from './text-adapter';

export type YBlock = Y.Map<unknown>;
export type YBlocks = Y.Map<YBlock>;

/** JSON-serializable properties of a block */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type BlockProps = Record<string, any> & {
  id: string;
  flavour: string;
  text?: void | TextType;
  children?: BaseBlockModel[];
};

export type PrefixedBlockProps = Record<string, unknown> & {
  'sys:id': string;
  'sys:flavour': string;
};

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
