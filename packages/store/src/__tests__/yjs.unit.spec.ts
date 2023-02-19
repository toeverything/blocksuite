import { describe, expect, test } from 'vitest';

import { BlockSuiteDoc } from '../yjs/index.js';

describe('blocksuite yjs', () => {
  test('doc', () => {
    const doc = new BlockSuiteDoc();
    const map = doc.getMap('x');
    const proxy = doc.getMapProxy<string, { x: number }>('x');
    expect(proxy.x).toBeUndefined();
    map.set('x', 1);
    expect(proxy.x).toBe(1);
  });

  test('proxy', () => {
    const doc = new BlockSuiteDoc();
    const proxy = doc.getMapProxy<string, { x: number }>('x', {
      initializer: {
        x: () => 1,
      },
    });
    expect(proxy.x).toBe(1);
    proxy.x = 2;
    expect(proxy.x).toBe(2);
  });
});
