import { describe, expect, it } from 'vitest';

import {
  Bound,
  contains,
  getCommonBound,
  inflateBound,
  transformPointsToNewBound,
} from './bound.js';

describe('bound utils', () => {
  it('Bound basic', () => {
    const bound = new Bound(1, 1, 2, 2);
    const serialized = bound.serialize();
    expect(serialized).toBe('[1,1,2,2]');
    expect(Bound.deserialize(serialized)).toMatchObject(bound);
  });

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

  it('contains', () => {
    const a0 = new Bound(0, 0, 10, 10);
    const b0 = new Bound(0, 0, 5, 5);
    expect(contains(a0, b0)).toBeTruthy();

    const a1 = new Bound(0, 0, 10, 10);
    const b1 = new Bound(0, 0, 10, 10);
    expect(contains(a1, b1)).toBeTruthy();

    const a2 = new Bound(0, 0, 10, 10);
    const b2 = new Bound(5, 5, 12, 10);
    expect(contains(a2, b2)).toBeFalsy();
  });

  it('inflateBound', () => {
    const a = new Bound(0, 0, 10, 10);
    const b = inflateBound(a, 4);
    expect(b.serialize()).toBe('[-2,-2,14,14]');

    expect(() => inflateBound(a, -12)).toThrowError(
      'Invalid delta range or bound size.'
    );
  });

  it('transformPointsToNewBound basic', () => {
    const a = new Bound(0, 0, 20, 20);
    const b = new Bound(4, 4, 18, 18);
    const marginA = 4;
    const marginB = 6;
    const points = [{ x: 6, y: 6, other: 10 }];
    const transformed = transformPointsToNewBound(
      points,
      a,
      marginA,
      b,
      marginB
    );

    expect(transformed.bound.serialize()).toBe(b.serialize());
    expect(transformed.points[0]).toMatchObject({
      x: 7,
      y: 7,
      other: 10,
    });
  });

  it('transformPointsToNewBound, new bound too small', () => {
    const a = new Bound(0, 0, 20, 20);
    const b = new Bound(4, 4, 4, 4);
    const marginA = 4;
    const marginB = 6;
    const points = [{ x: 6, y: 6, other: 10 }];
    const transformed = transformPointsToNewBound(
      points,
      a,
      marginA,
      b,
      marginB
    );

    expect(transformed.bound.serialize()).toBe('[4,4,13,13]');
    expect(transformed.points[0].x).toBeCloseTo(6.1667);
    expect(transformed.points[0].y).toBeCloseTo(6.1667);
    expect(transformed.points[0].other).toBe(10);
  });
});
