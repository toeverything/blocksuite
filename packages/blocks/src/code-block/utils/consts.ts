import type {
  BundledLanguage,
  BundledLanguageInfo,
  PlainTextLanguage,
} from 'shiki';
import type { BundledTheme } from 'shiki';

export const DARK_THEME = 'dark-plus' satisfies BundledTheme;
export const LIGHT_THEME = 'light-plus' satisfies BundledTheme;
// Since shiki special treatment the `plaintext` language as `PlainTextLanguage`
// It is better to use the it but now is late to change it.
// export const FALLBACK_LANG: PlainTextLanguage = 'plaintext';
export const FALLBACK_LANG = 'Plain Text';

/**
 * Note: Use it carefully because it is not a valid language.
 */
export const PLAIN_TEXT_LANG_INFO = {
  aliases: ['plaintext', 'txt', 'text'] satisfies PlainTextLanguage[],
  // This cast is wrong, but it is safe if we treat it as PlainTextLanguage in all cases.
  id: FALLBACK_LANG as PlainTextLanguage,
  import: () =>
    Promise.resolve({
      default: [],
    }),
  name: FALLBACK_LANG,
} satisfies StrictLanguageInfo;

export type StrictLanguageInfo = {
  id: BundledLanguage | PlainTextLanguage;
} & BundledLanguageInfo;
