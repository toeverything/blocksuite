import type { ILanguageRegistration } from 'shiki';

export const DARK_THEME = 'gh/fisheva/Eva-Theme@master/themes/Eva-Dark';
export const LIGHT_THEME = 'npm/shiki@0.14.1/themes/github-light';
export const FALLBACK_LANG = 'Plain Text';

/**
 * Note: Use it carefully because it is not a valid language registration.
 */
export const PLAIN_TEXT_REGISTRATION = {
  id: FALLBACK_LANG,
  scopeName: 'source.plaintext',
  /**
   * Do not use this path. It is only used to match the type of `ILanguageRegistration`
   *
   * @deprecated
   */
  path: 'PLEASE-DO-NOT-USE-THIS' as const,
  aliases: ['plaintext', 'txt', 'text'],
} satisfies ILanguageRegistration;
