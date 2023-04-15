import { describe, expect, test } from 'vitest';
import * as Y from 'yjs';

import { BlockSuiteDoc, createYArrayProxy } from '../yjs/index.js';

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
  });
});
