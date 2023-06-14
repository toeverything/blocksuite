import { describe, expect, test } from 'vitest';

import type { Filter, VariableRef } from '../../common/ast.js';
import { evalFilter } from '../eval-filter.js';
import type { FilterMatcherDataType } from '../filter-matcher.js';
import { filterMatcher } from '../filter-matcher.js';

export function assertExists<T>(
  val: T | null | undefined,
  message: string | Error = 'val does not exist'
): asserts val is T {
  if (val === null || val === undefined) {
    if (message instanceof Error) {
      throw message;
    }
    throw new Error(message);
  }
}

const filter = (
  matcherData: FilterMatcherDataType,
  left: VariableRef,
  args: unknown[]
): Filter => {
  return {
    type: 'filter',
    left,
    function: matcherData.name,
    args: args.map(value => ({ type: 'literal', value })),
  };
};
const ref = (name: string): VariableRef => {
  return {
    type: 'ref',
    name,
  };
};

describe('eval filter', () => {
  test('Is not empty', () => {
    const matcher = filterMatcher.findData(v => v.name === 'Is not empty');
    assertExists(matcher);
    const filter1 = filter(matcher, ref('a'), []);
    expect(evalFilter(filter1, { a: 0 })).toBe(true);
    expect(evalFilter(filter1, { a: undefined })).toBe(false);
    expect(evalFilter(filter1, { a: '' })).toBe(false);
  });
  test('Is empty', () => {
    const matcher = filterMatcher.findData(v => v.name === 'Is empty');
    assertExists(matcher);
    const filter1 = filter(matcher, ref('a'), []);
    expect(evalFilter(filter1, { a: 0 })).toBe(false);
    expect(evalFilter(filter1, { a: undefined })).toBe(true);
    expect(evalFilter(filter1, { a: '' })).toBe(true);
  });
  test('Is', () => {
    const matcher = filterMatcher.findData(v => v.name === 'Is');
    assertExists(matcher);
    const filter1 = filter(matcher, ref('a'), ['asd']);
    expect(evalFilter(filter1, { a: 'asd' })).toBe(true);
    expect(evalFilter(filter1, { a: undefined })).toBe(false);
    expect(evalFilter(filter1, { a: '' })).toBe(false);
  });
  test('Is not', () => {
    const matcher = filterMatcher.findData(v => v.name === 'Is not');
    assertExists(matcher);
    const filter1 = filter(matcher, ref('a'), ['asd']);
    expect(evalFilter(filter1, { a: 'asd' })).toBe(false);
    expect(evalFilter(filter1, { a: undefined })).toBe(true);
    expect(evalFilter(filter1, { a: '' })).toBe(true);
  });
  // test('before', async () => {
  //   const before = filterMatcher.findData(v => v.name === 'Is before');
  //   assertExists(before);
  //   const filter1 = filter(before, ref('Created'), [
  //     new Date(2023, 5, 28).getTime(),
  //   ]);
  //   const filter2 = filter(before, ref('Created'), [
  //     new Date(2023, 5, 30).getTime(),
  //   ]);
  //   const filter3 = filter(before, ref('Created'), [
  //     new Date(2023, 5, 29).getTime(),
  //   ]);
  //   const varMap = mockVariableMap({
  //     Created: new Date(2023, 5, 29).getTime(),
  //   });
  //   expect(evalFilter(filter1, varMap)).toBe(false);
  //   expect(evalFilter(filter2, varMap)).toBe(true);
  //   expect(evalFilter(filter3, varMap)).toBe(false);
  // });
  // test('after', async () => {
  //   const after = filterMatcher.findData(v => v.name === 'Is after');
  //   assertExists(after);
  //   const filter1 = filter(after, ref('Created'), [
  //     new Date(2023, 5, 28).getTime(),
  //   ]);
  //   const filter2 = filter(after, ref('Created'), [
  //     new Date(2023, 5, 30).getTime(),
  //   ]);
  //   const filter3 = filter(after, ref('Created'), [
  //     new Date(2023, 5, 29).getTime(),
  //   ]);
  //   const varMap = mockVariableMap({
  //     Created: new Date(2023, 5, 29).getTime(),
  //   });
  //   expect(evalFilter(filter1, varMap)).toBe(true);
  //   expect(evalFilter(filter2, varMap)).toBe(false);
  //   expect(evalFilter(filter3, varMap)).toBe(false);
  // });
});
