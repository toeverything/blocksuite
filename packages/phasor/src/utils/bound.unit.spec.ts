import { describe, expect, it } from 'vitest';

import { getCommonBound } from './bound.js';

describe('bound utils', () => {
  it('getCommonBound basic', () => {
    const bounds = Array(10)
      .fill(0)
      .map((_, index) => {
        return {
          x: index,
          y: index,
          w: 1,
          h: 1,
        };
      });
    expect(getCommonBound(bounds)).toMatchObject({
      x: 0,
      y: 0,
      w: 10,
      h: 10,
    });
  });

  it('getCommonBound parameters length equal to 0', () => {
    expect(getCommonBound([])).toBeNull();
  });

  it('getCommonBound parameters length less than 2', () => {
    const b1 = {
      x: 0,
      y: 0,
      w: 1,
      h: 1,
    };
    expect(getCommonBound([b1])).toMatchObject(b1);
  });
});
