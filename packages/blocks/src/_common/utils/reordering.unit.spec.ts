import { describe, expect, it } from 'vitest';

import {
  bringForward,
  bringToFront,
  generateRanges,
  getIndexesWith,
  sendBackward,
  sendToBack,
} from './reordering.js';

describe('Reordering', () => {
  it('bring to front', () => {
    const arr = [0, 1, 2, 3, 4, 5];

    let selected = [1, 3, 5];
    let indexes = getIndexesWith(selected, arr);
    let ranges = generateRanges(indexes);
    bringToFront(ranges, arr);
    expect(arr).toEqual([0, 2, 4, 1, 3, 5]);

    selected = [1, 3, 5];
    indexes = getIndexesWith(selected, arr);
    ranges = generateRanges(indexes);
    bringToFront(ranges, arr);
    expect(arr).toEqual([0, 2, 4, 1, 3, 5]);

    selected = [0];
    indexes = getIndexesWith(selected, arr);
    ranges = generateRanges(indexes);
    bringToFront(ranges, arr);
    expect(arr).toEqual([2, 4, 1, 3, 5, 0]);

    selected = [2, 4];
    indexes = getIndexesWith(selected, arr);
    ranges = generateRanges(indexes);
    bringToFront(ranges, arr);
    expect(arr).toEqual([1, 3, 5, 0, 2, 4]);

    selected = [1, 3, 5, 0, 2];
    indexes = getIndexesWith(selected, arr);
    ranges = generateRanges(indexes);
    bringToFront(ranges, arr);
    expect(arr).toEqual([4, 1, 3, 5, 0, 2]);

    selected = [0, 2];
    indexes = getIndexesWith(selected, arr);
    ranges = generateRanges(indexes);
    bringToFront(ranges, arr);
    expect(arr).toEqual([4, 1, 3, 5, 0, 2]);

    selected = [0];
    indexes = getIndexesWith(selected, arr);
    ranges = generateRanges(indexes);
    bringToFront(ranges, arr);
    expect(arr).toEqual([4, 1, 3, 5, 2, 0]);
  });

  it('bring forward', () => {
    const arr = [0, 1, 2, 3, 4, 5];

    let selected = [1, 3, 5];
    let indexes = getIndexesWith(selected, arr);
    let ranges = generateRanges(indexes);
    bringForward(ranges, arr);
    expect(arr).toEqual([0, 2, 1, 4, 3, 5]);

    selected = [0];
    indexes = getIndexesWith(selected, arr);
    ranges = generateRanges(indexes);
    bringForward(ranges, arr);
    expect(arr).toEqual([2, 0, 1, 4, 3, 5]);

    selected = [2, 0, 1, 4, 3];
    indexes = getIndexesWith(selected, arr);
    ranges = generateRanges(indexes);
    bringForward(ranges, arr);
    expect(arr).toEqual([5, 2, 0, 1, 4, 3]);

    selected = [4];
    indexes = getIndexesWith(selected, arr);
    ranges = generateRanges(indexes);
    bringForward(ranges, arr);
    expect(arr).toEqual([5, 2, 0, 1, 3, 4]);

    selected = [0, 3];
    indexes = getIndexesWith(selected, arr);
    ranges = generateRanges(indexes);
    bringForward(ranges, arr);
    expect(arr).toEqual([5, 2, 1, 0, 4, 3]);
  });

  it('send backward', () => {
    const arr = [0, 1, 2, 3, 4, 5];

    let selected = [1, 3, 5];
    let indexes = getIndexesWith(selected, arr);
    let ranges = generateRanges(indexes);
    sendBackward(ranges, arr);
    expect(arr).toEqual([1, 0, 3, 2, 5, 4]);

    selected = [4];
    indexes = getIndexesWith(selected, arr);
    ranges = generateRanges(indexes);
    sendBackward(ranges, arr);
    expect(arr).toEqual([1, 0, 3, 2, 4, 5]);

    selected = [0, 3, 2, 4, 5];
    indexes = getIndexesWith(selected, arr);
    ranges = generateRanges(indexes);
    sendBackward(ranges, arr);
    expect(arr).toEqual([0, 3, 2, 4, 5, 1]);

    selected = [3];
    indexes = getIndexesWith(selected, arr);
    ranges = generateRanges(indexes);
    sendBackward(ranges, arr);
    expect(arr).toEqual([3, 0, 2, 4, 5, 1]);

    selected = [2, 1];
    indexes = getIndexesWith(selected, arr);
    ranges = generateRanges(indexes);
    sendBackward(ranges, arr);
    expect(arr).toEqual([3, 2, 0, 4, 1, 5]);
  });

  it('send to back', () => {
    const arr = [0, 1, 2, 3, 4, 5];

    let selected = [1, 3, 5];
    let indexes = getIndexesWith(selected, arr);
    let ranges = generateRanges(indexes);
    sendToBack(ranges, arr);
    expect(arr).toEqual([1, 3, 5, 0, 2, 4]);

    selected = [4];
    indexes = getIndexesWith(selected, arr);
    ranges = generateRanges(indexes);
    sendToBack(ranges, arr);
    expect(arr).toEqual([4, 1, 3, 5, 0, 2]);

    selected = [1, 3, 5, 0, 2];
    indexes = getIndexesWith(selected, arr);
    ranges = generateRanges(indexes);
    sendToBack(ranges, arr);
    expect(arr).toEqual([1, 3, 5, 0, 2, 4]);

    selected = [1, 3];
    indexes = getIndexesWith(selected, arr);
    ranges = generateRanges(indexes);
    sendToBack(ranges, arr);
    expect(arr).toEqual([1, 3, 5, 0, 2, 4]);

    selected = [5];
    indexes = getIndexesWith(selected, arr);
    ranges = generateRanges(indexes);
    sendToBack(ranges, arr);
    expect(arr).toEqual([5, 1, 3, 0, 2, 4]);
  });
});
