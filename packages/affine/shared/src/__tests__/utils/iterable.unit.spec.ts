import {
  atLeastNMatches,
  countBy,
  groupBy,
  maxBy,
} from '@blocksuite/global/utils';
import { describe, expect, it } from 'vitest';

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

describe('atLeastNMatches', () => {
  it('basic', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const isEven = (num: number): boolean => num % 2 === 0;
    const isGreaterThan5 = (num: number): boolean => num > 5;
    const isNegative = (num: number): boolean => num < 0;

    expect(atLeastNMatches(arr, isEven, 3)).toBe(true);
    expect(atLeastNMatches(arr, isGreaterThan5, 5)).toBe(false);
    expect(atLeastNMatches(arr, isNegative, 1)).toBe(false);

    const strArr = ['apple', 'banana', 'orange', 'kiwi', 'mango'];
    const startsWithA = (str: string): boolean => str[0].toLowerCase() === 'a';
    const longerThan5 = (str: string): boolean => str.length > 5;

    expect(atLeastNMatches(strArr, startsWithA, 1)).toBe(true);
    expect(atLeastNMatches(strArr, longerThan5, 3)).toBe(false);
  });
});

describe('groupBy', () => {
  it('basic', () => {
    const students = [
      { name: 'Alice', age: 25 },
      { name: 'Bob', age: 23 },
      { name: 'Cathy', age: 25 },
      { name: 'David', age: 23 },
    ];

    const groupedByAge = groupBy(students, student => student.age.toString());
    const expectedGroupedByAge = {
      '23': [
        { name: 'Bob', age: 23 },
        { name: 'David', age: 23 },
      ],
      '25': [
        { name: 'Alice', age: 25 },
        { name: 'Cathy', age: 25 },
      ],
    };
    expect(groupedByAge).toMatchObject(expectedGroupedByAge);
  });

  it('empty', () => {
    const emptyArray: string[] = [];
    const groupedEmptyArray = groupBy(emptyArray, item => item);
    expect(Object.keys(groupedEmptyArray).length).toBe(0);
  });
});
