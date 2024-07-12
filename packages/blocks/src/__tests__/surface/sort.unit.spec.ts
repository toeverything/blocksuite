import { describe, expect, it } from 'vitest';

import { loadingSort } from '../../surface-block/utils/sort.js';

describe('loadingSort', () => {
  it('should sort correctly', () => {
    const elements = [
      {
        deps: ['2', '3'],
        id: '1',
      },
      {
        deps: ['4', '5'],
        id: '2',
      },
      {
        deps: ['a'],
        id: '3',
      },
      {
        deps: ['b', '5'],
        id: '4',
      },
      {
        deps: [],
        id: '5',
      },
    ];

    const sorted = loadingSort(elements);

    expect(sorted.map(val => val.id)).toEqual(['3', '5', '4', '2', '1']);
  });

  it('should sort correctly when no deps', () => {
    const elements = [
      {
        deps: [],
        id: '1',
      },
      {
        deps: [],
        id: '2',
      },
      {
        deps: [],
        id: '3',
      },
    ];

    const sorted = loadingSort(elements);

    expect(sorted.map(val => val.id)).toEqual(['1', '2', '3']);
  });

  it('should sort correctly elements deps same element', () => {
    const elements = [
      {
        deps: ['2', '3'],
        id: '1',
      },
      {
        deps: ['4', '5'],
        id: '2',
      },
      {
        deps: ['6', '7'],
        id: '3',
      },
      {
        deps: ['b', '5'],
        id: '4',
      },
      {
        deps: ['7'],
        id: '5',
      },
      {
        deps: [],
        id: '6',
      },
      {
        deps: [],
        id: '7',
      },
    ];

    const sorted = loadingSort(elements);
    expect(sorted.map(val => val.id)).toEqual([
      '6',
      '7',
      '3',
      '5',
      '4',
      '2',
      '1',
    ]);
  });
});
