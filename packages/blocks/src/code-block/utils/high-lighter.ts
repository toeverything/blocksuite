import {
  type BundledHighlighterOptions,
  type BundledLanguage,
  getHighlighter,
  type Highlighter,
} from 'shiki';

let _highLighter: Highlighter | null = null;

export const getHighLighter = async (
  options: BundledHighlighterOptions<BundledLanguage, string> & {
    langs: BundledLanguage[];
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
