import { describe, expect, it } from 'vitest';

import { isFuzzyMatch } from '../../_common/utils/string.js';

describe('fuzzyMatch', () => {
  it('basic case', () => {
    expect(isFuzzyMatch('John Smith', 'j')).toEqual(true);
    expect(isFuzzyMatch('John Smith', 'js')).toEqual(true);
    expect(isFuzzyMatch('John Smith', 'jsa')).toEqual(false);
  });

  it('should works with CJK', () => {
    expect(isFuzzyMatch('中', '中')).toEqual(true);
    expect(isFuzzyMatch('中文', '中')).toEqual(true);
    expect(isFuzzyMatch('中文字符', '中字')).toEqual(true);
    expect(isFuzzyMatch('中文字符', '字中')).toEqual(false);
  });

  it('should works with IME', () => {
    // IME will generate a space between 'da' and 't'
    expect(isFuzzyMatch('database', 'da t')).toEqual(true);
  });
});
