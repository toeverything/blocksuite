import { describe, expect, test } from 'vitest';
import * as Y from 'yjs';

import type { Text } from '../reactive/index.js';

import { Boxed, createYProxy, popProp, stashProp } from '../reactive/index.js';

describe('blocksuite yjs', () => {
  describe('array', () => {
    test('proxy', () => {
      const ydoc = new Y.Doc();
      const arr = ydoc.getArray('arr');
      arr.push([0]);

      const proxy = createYProxy(arr) as unknown[];
      expect(arr.get(0)).toBe(0);

      proxy.push(1);
      expect(arr.get(1)).toBe(1);
      expect(arr.length).toBe(2);

      proxy.splice(1, 1);
      expect(arr.length).toBe(1);

      proxy[0] = 2;
      expect(arr.length).toBe(1);
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
      const proxy = createYProxy<Record<string, any>>(map);

      expect(proxy.num).toBe(0);
      expect(proxy.obj.foo).toBe(1);
      expect(proxy.obj.map.foo).toBe(40);

      proxy.obj.bar = 100;
      expect(obj.get('bar')).toBe(100);

      proxy.obj2 = { foo: 2, bar: { num: 3 } };
      expect(map.get('obj2')).toBeInstanceOf(Y.Map);
      // @ts-ignore
      expect(map.get('obj2').get('bar').get('num')).toBe(3);

      proxy.obj2.bar.str = 'hello';
      // @ts-ignore
      expect(map.get('obj2').get('bar').get('str')).toBe('hello');

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

      const proxy = createYProxy<{ inner: { text: Text } }>(map);
      proxy.inner = { ...proxy.inner };
      expect(proxy.inner.text.yText).toBeInstanceOf(Y.Text);
      expect(proxy.inner.text.yText.toJSON()).toBe('hello');
    });

    test('with native wrapper', () => {
      const ydoc = new Y.Doc();
      const map = ydoc.getMap('map');
      const inner = new Y.Map();
      map.set('inner', inner);
      const native = new Boxed(['hello', 'world']);
      inner.set('native', native.yMap);

      const proxy = createYProxy<{
        inner: {
          native: Boxed<string[]>;
          native2: Boxed<number>;
        };
      }>(map);

      expect(proxy.inner.native.getValue()).toEqual(['hello', 'world']);

      proxy.inner.native.setValue(['hello', 'world', 'foo']);
      expect(native.getValue()).toEqual(['hello', 'world', 'foo']);
      // @ts-ignore
      expect(map.get('inner').get('native').get('value')).toEqual([
        'hello',
        'world',
        'foo',
      ]);

      const native2 = new Boxed(0);
      proxy.inner.native2 = native2;
      // @ts-ignore
      expect(map.get('inner').get('native2').get('value')).toBe(0);
      native2.setValue(1);
      // @ts-ignore
      expect(map.get('inner').get('native2').get('value')).toBe(1);
    });
  });

  describe('stash and pop', () => {
    test('object', () => {
      const ydoc = new Y.Doc();
      const map = ydoc.getMap('map');
      map.set('num', 0);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const proxy = createYProxy<Record<string, any>>(map);

      expect(proxy.num).toBe(0);
      stashProp(map, 'num');
      proxy.num = 1;
      expect(proxy.num).toBe(1);
      expect(map.get('num')).toBe(0);
      proxy.num = 2;
      popProp(map, 'num');
      expect(map.get('num')).toBe(2);
    });

    test('array', () => {
      const ydoc = new Y.Doc();
      const arr = ydoc.getArray('arr');
      arr.push([0]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const proxy = createYProxy<Record<string, any>>(arr);

      expect(proxy[0]).toBe(0);
      stashProp(arr, 0);
      proxy[0] = 1;
      expect(proxy[0]).toBe(1);
      expect(arr.get(0)).toBe(0);
      popProp(arr, 0);
      expect(arr.get(0)).toBe(1);
    });

    test('nested', () => {
      const ydoc = new Y.Doc();
      const map = ydoc.getMap('map');
      const arr = new Y.Array();
      map.set('arr', arr);
      arr.push([0]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const proxy = createYProxy<Record<string, any>>(map);

      expect(proxy.arr[0]).toBe(0);
      stashProp(arr, 0);
      proxy.arr[0] = 1;
      expect(proxy.arr[0]).toBe(1);
      expect(arr.get(0)).toBe(0);
      popProp(arr, 0);
      expect(arr.get(0)).toBe(1);
    });
  });
});
