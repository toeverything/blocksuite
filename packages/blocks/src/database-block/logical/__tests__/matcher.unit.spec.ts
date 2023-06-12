import { describe, expect, test } from 'vitest';

import { filterMatcher } from '../filter-matcher.js';
import {
  tArray,
  tBoolean,
  tDate,
  tNumber,
  tString,
  tTag,
} from '../typesystem.js';

describe('match filter', () => {
  test('boolean filter match', () => {
    const matched = filterMatcher
      .allMatchedData(tBoolean.create())
      .map(v => v.name);
    expect(matched).toStrictEqual(['Is not empty', 'Is empty']);
  });
  test('Date filter match', () => {
    const matched = filterMatcher
      .allMatchedData(tDate.create())
      .map(v => v.name);
    expect(matched).toStrictEqual(['Is not empty', 'Is empty', 'Is before']);
  });
  test('string filter match', () => {
    const matched = filterMatcher
      .allMatchedData(tString.create())
      .map(v => v.name);
    expect(matched).toStrictEqual([
      'Is not empty',
      'Is empty',
      'Is',
      'Is not',
      'Contains',
      'Does no contains',
      'Starts with',
      'Ends with',
      'Characters less than',
    ]);
  });
  test('number filter match', () => {
    const matched = filterMatcher
      .allMatchedData(tNumber.create())
      .map(v => v.name);
    expect(matched).toStrictEqual([
      'Is not empty',
      'Is empty',
      '>',
      '>=',
      '<',
      '<=',
      '==',
      '!=',
    ]);
  });
  test('tags filter match', () => {
    const matched = filterMatcher
      .allMatchedData(tTag.create())
      .map(v => v.name);
    expect(matched).toStrictEqual([
      'Is not empty',
      'Is empty',
      'Is inside',
      'Is not inside',
    ]);
  });
  test('tags array filter match', () => {
    const matched = filterMatcher
      .allMatchedData(tArray(tTag.create()))
      .map(v => v.name);
    expect(matched).toStrictEqual([
      'Is not empty',
      'Is empty',
      'Contains all',
      'Contains one of',
      'Does not contains one of',
      'Does not contains all',
    ]);
  });
});
