import * as Y from 'yjs';
import {
  ArrayProxyConfig,
  createYArrayProxy,
  createYMapProxy,
  MapProxyConfig,
} from './proxy.js';

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
  >(key: Key, config?: MapProxyConfig<Value>): Value {
    const map = super.getMap(key);
    return createYMapProxy<Value>(map, config);
  }

  getArrayProxy<
    Key extends keyof Data & string,
    Value = Data[Key] extends Array<infer InferValue> ? InferValue : never
  >(key: Key, config?: ArrayProxyConfig<Value>): Value[] {
    const array = super.getArray(key);
    return createYArrayProxy<Value>(array, config);
  }
}
