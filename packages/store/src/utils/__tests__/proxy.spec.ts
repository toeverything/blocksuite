import { describe, expect, it, assertType } from 'vitest';
import * as Y from 'yjs';
import { createYMapProxy } from '../yjs/proxy.js';

describe('doc', () => {
  it('enhanced doc', () => {
    const doc = new Y.Doc<{
      a: Y.Map<{ x: number }>;
      b: Y.Array<string>;
    }>();
    // @ts-expect-error
    doc.getMap('x');
    const goodB = doc.getArray('b');
    assertType<Y.Array<string>>(goodB);
    assertType<Y.Map<{ x: number }>>(doc.getMap('a'));
    const a = doc.getMap('a');
    a.get('x');
  });
});

describe('proxy', () => {
  it('set y proxy', () => {
    const doc = new Y.Doc<{ '': Y.Map }>();
    const map = doc.getMap('');
    map.set('x', 1);
    const proxy = createYMapProxy(map);
    expect(proxy.x).toBe(1);
  });

  it('get y proxy', () => {
    const doc = new Y.Doc<{ '': Y.Map }>();
    const map = doc.getMap('');
    map.set('x', 1);
    const proxy = createYMapProxy(map);
    proxy.x = 2;
    expect(proxy.x).toBe(2);

    const proxy2 = createYMapProxy(map, { readonly: true });
    expect(() => (proxy2.x = 3)).toThrowError();
    expect(proxy2.x).toBe(2);
  });
});
