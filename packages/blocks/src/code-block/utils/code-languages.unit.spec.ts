import { describe, expect, it } from 'vitest';

import { getStandardLanguage } from './code-languages.js';
import { FALLBACK_LANG } from './consts.js';

describe('getStandardLanguage', () => {
  it('basic', () => {
    const language = getStandardLanguage('js');
    expect(language).not.toBeNull();
    expect(language?.id).toBe('javascript');
    expect(language?.displayName).toBe('JavaScript');

    expect(getStandardLanguage('javascript')).not.toBeNull();
    expect(getStandardLanguage('c')).not.toBeNull();
    expect(getStandardLanguage('py')).not.toBeNull();
    expect(getStandardLanguage('Python')).not.toBeNull();
  });

  it('strict mode', () => {
    // the default is loose mode
    expect(getStandardLanguage('js')).not.toBeNull();
    expect(getStandardLanguage('js', false)).not.toBeNull();
    expect(getStandardLanguage('js', false)).toEqual(getStandardLanguage('js'));
    expect(getStandardLanguage('js', true)).toBeNull();
  });

  it('plain text', () => {
    expect(getStandardLanguage(FALLBACK_LANG)).toBeNull();
    expect(getStandardLanguage('text')).toBeNull();
  });

  it('unknown', () => {
    expect(getStandardLanguage('unknown')).toBeNull();
  });
});
