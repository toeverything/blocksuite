import { describe, expect, test } from 'vitest';
import * as Y from 'yjs';

import {
  BlockSuiteDoc,
  createYArrayProxy,
  createYMapProxy,
} from '../yjs/index.js';

describe('blocksuite yjs', () => {
  test('doc', () => {
    const doc = new BlockSuiteDoc();
    const map = doc.getMap('x');
    const proxy = doc.getMapProxy<string, { x: number }>('x');
    expect(proxy.x).toBeUndefined();
    map.set('x', 1);
    expect(proxy.x).toBe(1);
  });

  describe('array', () => {
    test('proxy', () => {
      const ydoc = new Y.Doc();
      const arr = ydoc.getArray('arr');
      arr.push([0]);

      const proxy = createYArrayProxy(arr);
      expect(arr.get(0)).toBe(0);

      proxy.push(1);
      expect(arr.get(1)).toBe(1);
      expect(arr.length).toBe(2);

      proxy.splice(1, 1);
      expect(arr.length).toBe(1);
    });

    test('readonly', () => {
      const ydoc = new Y.Doc();
      const arr = ydoc.getArray('arr');
      arr.push([0]);

      const proxy = createYArrayProxy(arr, { readonly: true });
      expect(arr.get(0)).toBe(0);

      expect(() => proxy.push(1)).toThrowError('Modify data is not allowed');
    });
  });

  describe('object', () => {
    test('deep', () => {
      const ydoc = new Y.Doc();
      const map = ydoc.getMap('map');
      const obj = new Y.Map();
      obj.set('foo', 1);
      map.set('obj', obj);
      map.set('num', 0);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const proxy = createYMapProxy<Record<string, any>>(map, { deep: true });

      expect(proxy.num).toBe(0);
      expect(proxy.obj.foo).toBe(1);

      proxy.obj.bar = 100;
      expect(obj.get('bar')).toBe(100);

      proxy.obj2 = { foo: 2, bar: { num: 3 } };
      expect(map.get('obj2')).toBeInstanceOf(Y.Map);
      expect(
        (map.get('obj2') as Y.Map<Y.Map<number>>).get('bar').get('num')
      ).toBe(3);

      proxy.obj2.bar.str = 'hello';
      expect(
        (map.get('obj2') as Y.Map<Y.Map<string>>).get('bar').get('str')
      ).toBe('hello');
    });
  });
});
