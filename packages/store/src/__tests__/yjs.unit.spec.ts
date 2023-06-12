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

      proxy[0] = 2;
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
      const map2 = new Y.Map();
      obj.set('map', map2);
      map2.set('foo', 40);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const proxy = createYMapProxy<Record<string, any>>(map, { deep: true });

      expect(proxy.num).toBe(0);
      expect(proxy.obj.foo).toBe(1);
      expect(proxy.obj.map.foo).toBe(40);

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

      proxy.obj3 = {};
      const { obj3 } = proxy;
      obj3.id = 'obj3';
      expect((map.get('obj3') as Y.Map<string>).get('id')).toBe('obj3');

      proxy.arr = [];
      expect(map.get('arr')).toBeInstanceOf(Y.Array);
      proxy.arr.push({ counter: 1 });
      expect((map.get('arr') as Y.Array<Y.Map<number>>).get(0)).toBeInstanceOf(
        Y.Map
      );
      expect(
        (map.get('arr') as Y.Array<Y.Map<number>>).get(0).get('counter')
      ).toBe(1);
    });

    test('with y text', () => {
      const ydoc = new Y.Doc();
      const map = ydoc.getMap('map');
      const inner = new Y.Map();
      map.set('inner', inner);
      const text = new Y.Text('hello');
      inner.set('text', text);

      const proxy = createYMapProxy<{ inner: { text: Y.Text } }>(map, {
        deep: true,
      });
      proxy.inner = { ...proxy.inner };
      expect(proxy.inner.text).toBeInstanceOf(Y.Text);
      expect(proxy.inner.text.toJSON()).toBe('hello');
    });
  });
});
