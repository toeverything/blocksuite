import type * as Y from 'yjs';

import type { Block } from './index.js';

export type YBlock = Y.Map<unknown> & {
  get(prop: 'sys:id'): string;
  get(prop: 'sys:flavour'): string;
  get(prop: 'sys:children'): Y.Array<string>;
  get<T = unknown>(prop: string): T;
};

export type BlockOptions = {
  onChange?: (block: Block, key: string, value: unknown) => void;
};
