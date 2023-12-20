import {
  getHighlighter,
  type Highlighter,
  type HighlighterOptions,
} from 'shiki';

let _highLighter: Highlighter | null = null;

export const getHighLighter = async (options: HighlighterOptions) => {
  if (_highLighter) {
    const { langs } = options;
    if (langs) {
      await Promise.all(langs.map(lang => _highLighter?.loadLanguage(lang)));
    }
    return _highLighter;
  }
  _highLighter = await getHighlighter({
    ...options,
    paths: {
      // TODO: use local path
      wasm: 'https://cdn.jsdelivr.net/npm/shiki/dist',
      themes: 'https://cdn.jsdelivr.net/',
      languages: 'https://cdn.jsdelivr.net/npm/shiki/languages',
    },
  });
  return _highLighter;
};
