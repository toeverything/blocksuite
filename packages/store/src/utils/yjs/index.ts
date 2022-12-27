import * as Y from 'yjs';
import type { Map as YMap, Array as YArray, Text as YText } from 'yjs';

export type AllowedYDocValue = EnhancedYMap | YMap<any> | YArray<any> | YText;
export type EnhancedYDoc<Data extends Record<string, AllowedYDocValue>> = Omit<
  Y.Doc,
  'getText' | 'getMap' | 'getArray'
> & {
  getText<Key extends keyof Data & string>(
    name: Key
  ): Data[Key] extends YText ? Data[Key] : never;
  getArray<Key extends keyof Data & string>(
    key: Key
  ): Data[Key] extends YArray<any> ? Data[Key] : never;
  getMap<Key extends keyof Data & string>(
    key: Key
  ): Data[Key] extends EnhancedYMap
    ? Data[Key]
    : Data[Key] extends YMap<any>
    ? Data[Key]
    : never;
};

export interface EnhancedYMap<
  Data extends object = Record<string, unknown>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
> extends YMap<any> {
  clone(): EnhancedYMap<Data>;

  delete(key: keyof Data & string): void;

  set<Key extends keyof Data & string>(key: Key, value: Data[Key]): Data[Key];

  get<Key extends keyof Data & string>(key: Key): Data[Key];

  has<Key extends keyof Data & string>(key: Key): boolean;

  clear(): void;
}

export function createYMap<Data extends object = Record<string, unknown>>(
  defaultData?: Data
): EnhancedYMap<Data> {
  const map = new Y.Map();
  if (defaultData) {
    Object.entries(defaultData).map(([key, value]) => {
      map.set(key, value);
    });
  }

  return map as EnhancedYMap<Data>;
}
