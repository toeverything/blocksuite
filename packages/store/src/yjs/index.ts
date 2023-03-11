import { debug } from '@blocksuite/global/debug';
import type { Transaction } from 'yjs';
import * as Y from 'yjs';

import { createYMapProxy, type ProxyConfig } from './proxy.js';

export type BlockSuiteDocAllowedValue =
  | Record<string, unknown>
  | unknown[]
  | Y.Text;
export type BlockSuiteDocData = Record<string, BlockSuiteDocAllowedValue>;

export class BlockSuiteDoc<
  Data extends BlockSuiteDocData = BlockSuiteDocData
> extends Y.Doc {
  getMapProxy<
    Key extends keyof Data & string,
    Value extends Record<string, unknown> = Data[Key] extends Record<
      string,
      unknown
    >
      ? Data[Key]
      : never
  >(key: Key, config?: ProxyConfig<Value>): Value {
    const map = super.getMap(key);
    return createYMapProxy(map, config);
  }

  @debug('transact')
  transact(f: (arg0: Transaction) => void, origin?: number) {
    super.transact(f, origin);
  }
}
