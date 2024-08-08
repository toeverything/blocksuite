import type { BundledLanguage, Highlighter, PlainTextLanguage } from 'shiki';

export type HighlightOptionsGetter = () => {
  lang: BundledLanguage | PlainTextLanguage;
  highlighter: Highlighter | null;
};
