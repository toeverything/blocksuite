import { debug } from '@blocksuite/global/debug';
import type { Transaction } from 'yjs';
import * as Y from 'yjs';

import type { ProxyConfig } from './config.js';
import { ProxyManager } from './proxy.js';

export type BlockSuiteDocAllowedValue =
  | Record<string, unknown>
  | unknown[]
  | Y.Text;
export type BlockSuiteDocData = Record<string, BlockSuiteDocAllowedValue>;

export class BlockSuiteDoc extends Y.Doc {
  proxy = new ProxyManager();
  private _spaces: Y.Map<Y.Doc> = this.getMap('spaces');

  get spaces() {
    return this._spaces;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  override toJSON(): Record<string, any> {
    const json = super.toJSON();
    delete json.spaces;
    const spaces: Record<string, unknown> = {};
    this.spaces.forEach((doc, key) => {
      spaces[key] = doc.toJSON();
    });
    return {
      ...json,
      spaces,
    };
  }

  getMapProxy<
    Key extends keyof BlockSuiteDocData & string,
    Value extends Record<
      string,
      unknown
    > = BlockSuiteDocData[Key] extends Record<string, unknown>
      ? BlockSuiteDocData[Key]
      : never
  >(key: Key, config: ProxyConfig = {}): Value {
    const map = super.getMap(key);
    return this.proxy.createYProxy(map, config);
  }

  getArrayProxy<
    Key extends keyof BlockSuiteDocData & string,
    Value extends unknown[] = BlockSuiteDocData[Key] extends unknown[]
      ? BlockSuiteDocData[Key]
      : never
  >(key: Key, config: ProxyConfig = {}): Value {
    const array = super.getArray(key);
    return this.proxy.createYProxy(array, config) as Value;
  }

  @debug('transact')
  override transact<T>(f: (arg0: Transaction) => T, origin?: number) {
    return super.transact(f, origin);
  }
}
