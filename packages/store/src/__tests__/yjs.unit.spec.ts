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
});
