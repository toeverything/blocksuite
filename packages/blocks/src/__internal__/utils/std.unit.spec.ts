import { describe, expect, it } from 'vitest';

import { countBy, maxBy } from './std.js';

describe('countBy', () => {
  it('basic', () => {
    const items = [
      { name: 'a', classroom: 'c1' },
      { name: 'b', classroom: 'c2' },
      { name: 'a', classroom: 'c2' },
    ];
    const counted = countBy(items, i => i.name);
    expect(counted).toEqual({ a: 2, b: 1 });
  });

  it('empty items', () => {
    const counted = countBy([], i => i);
    expect(Object.keys(counted).length).toBe(0);
  });
});

describe('maxBy', () => {
  it('basic', () => {
    const items = [{ n: 1 }, { n: 2 }];
    const max = maxBy(items, i => i.n);
    expect(max).toBe(items[1]);
  });

  it('empty items', () => {
    expect(maxBy([], i => i)).toBeNull();
  });
});
