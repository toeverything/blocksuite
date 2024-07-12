import { describe, expect, test } from 'vitest';

import { isEqual } from '../utils.js';

describe('isEqual', () => {
  test('number', () => {
    expect(isEqual(1, 1)).toBe(true);
    expect(isEqual(1, 114514)).toBe(false);
    expect(isEqual(NaN, NaN)).toBe(true);
    expect(isEqual(0, -0)).toBe(false);
  });

  test('string', () => {
    expect(isEqual('', '')).toBe(true);
    expect(isEqual('', ' ')).toBe(false);
  });

  test('array', () => {
    expect(isEqual([], [])).toBe(true);
    expect(isEqual([1, 1, 4, 5, 1, 4], [])).toBe(false);
    expect(isEqual([1, 1, 4, 5, 1, 4], [1, 1, 4, 5, 1, 4])).toBe(true);
  });

  test('object', () => {
    expect(isEqual({}, {})).toBe(true);
    expect(
      isEqual(
        {
          f: 1,
          g: {
            o: '',
          },
        },
        {
          f: 1,
          g: {
            o: '',
          },
        }
      )
    ).toBe(true);
    expect(isEqual({}, { foo: 1 })).toBe(false);
    // @ts-expect-error
    expect(isEqual({ foo: 1 }, {})).toBe(false);
  });

  test('nested', () => {
    const nested = {
      array: [19, 19, 810, 'test', NaN],
      bigint: 110101195306153019n,
      float: 114.514,
      integer: 42,
      nestedArray: [
        [1, 2],
        [3, 4],
      ],
      object: {
        'first-child': true,
        'last-child': null,
        'second-child': false,
      },
      string: 'this is a string',
      undefined,
    };
    expect(isEqual(nested, nested)).toBe(true);
    // @ts-expect-error
    expect(isEqual({ foo: [] }, { foo: '' })).toBe(false);
  });
});
