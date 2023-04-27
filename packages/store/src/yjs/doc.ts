import { debug } from '@blocksuite/global/debug';
import type { Transaction } from 'yjs';
import * as Y from 'yjs';

import { createYArrayProxy } from './array.js';
import type { ProxyConfig } from './config.js';
import { createYMapProxy } from './map.js';

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
  >(key: Key, config: ProxyConfig = {}): Value {
    const map = super.getMap(key);
    return createYMapProxy(map, config);
  }

  getArrayProxy<
    Key extends keyof Data & string,
    Value extends unknown[] = Data[Key] extends unknown[] ? Data[Key] : never
  >(key: Key, config: ProxyConfig = {}): Value {
    const array = super.getArray(key);
    return createYArrayProxy(array, config) as Value;
  }

  @debug('transact')
  override transact<T>(f: (arg0: Transaction) => T, origin?: number) {
    return super.transact(f, origin);
  }
}
