import { describe, expect, it } from 'vitest';
import * as Y from 'yjs';
import { createYMapProxy } from '../proxy.js';

describe('proxy', () => {
  it('set y proxy', () => {
    const doc = new Y.Doc();
    const map = doc.getMap();
    map.set('x', 1);
    const proxy = createYMapProxy(map);
    expect(proxy.x).toBe(1);
  });

  it('get y proxy', () => {
    const doc = new Y.Doc();
    const map = doc.getMap();
    map.set('x', 1);
    const proxy = createYMapProxy(map);
    proxy.x = 2;
    expect(proxy.x).toBe(2);
  });
});
