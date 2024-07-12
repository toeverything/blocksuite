import {
  type BundledHighlighterOptions,
  type BundledLanguage,
  type Highlighter,
  type PlainTextLanguage,
  getHighlighter,
} from 'shiki';

let _highLighter: Highlighter | null = null;

export const getHighLighter = async (
  options: BundledHighlighterOptions<BundledLanguage, string> & {
    // Only support bundled languages
    langs: (BundledLanguage | PlainTextLanguage)[];
  }
) => {
  if (_highLighter) {
    const { langs } = options;
    if (langs) {
      await _highLighter.loadLanguage(...langs);
    }
    return _highLighter;
  }
  _highLighter = await getHighlighter({
    ...options,
  });
  return _highLighter;
};
