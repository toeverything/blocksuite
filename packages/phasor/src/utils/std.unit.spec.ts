import { describe, expect, it } from 'vitest';

import { simplePick } from './std.js';

describe('simplePick', () => {
  it('basic', () => {
    const obj: Record<string, number> = { a: 0, b: 1, c: 2 };
    const picked = simplePick(obj, ['a', 'b', 'd']);
    expect(picked.a).toBe(0);
    expect(picked.b).toBe(1);
    expect(picked).not.toHaveProperty('d');
  });
});
