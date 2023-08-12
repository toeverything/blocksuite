import type { Slot } from '@blocksuite/store';
import type { ILanguageRegistration, Lang } from 'shiki';
import { BUNDLED_LANGUAGES } from 'shiki';

import { PLAIN_TEXT_REGISTRATION } from './consts.js';

export interface selectedLanguageChangedSlots {
  selectedLanguageChanged: Slot<{ language: string | null }>;
  dispose: Slot;
}
// TIOBE Index for May 2023
// ref https://www.tiobe.com/tiobe-index/
const PopularLanguages: Lang[] = [
  // 1-20
  'python',
  'c',
  'java',
  'cpp',
  'csharp',
  'vb',
  'javascript',
  'php',
  'sql',
  'asm',
  'pascal',
  'go',
  // 'scratch',
  'swift',
  'matlab',
  'r',
  'rust',
  'ruby',
  // 'fortran',
  // 'classic-visual-basic',

  // 21-50
  'sas',
  // '(Visual) FoxPro',
  'ada',
  'perl',
  'objective-c',
  'cobol',
  'lisp',
  'dart',
  'lua',
  'julia',
  // 'transact-SQL',
  'd',
  'kotlin',
  'logo',
  'scala',
  'haskell',
  'fsharp',
  'scheme',
  // 'cfml',
  'typescript',
  'groovy',
  'abap',
  'prolog',
  'plsql',
  // 'ml',
  // 'bourne shell',
  // 'forth',
  // 'crystal',
  'bash',
  'apex',
  // ⬆️ 50

  // Other
  'markdown',
  'json',
  'html',
  'css',
  'diff',
  'jsx',
  'tsx',
  'vue',
];

const POPULAR_LANGUAGES_MAP: Partial<Record<Lang, number>> =
  PopularLanguages.reduce((acc, lang, i) => {
    return {
      [lang]: i,
      ...acc,
    };
  }, {});

export function getLanguagePriority(lang: Lang, isCurrentLanguage = false) {
  if (isCurrentLanguage) {
    // Important to show the current language first
    return -Infinity;
  }
  return POPULAR_LANGUAGES_MAP[lang] ?? Infinity;
}

function isPlaintext(lang: string) {
  return [
    PLAIN_TEXT_REGISTRATION.id,
    ...PLAIN_TEXT_REGISTRATION.aliases,
  ].includes(lang.toLowerCase());
}

/**
 * Get the standard language registration for a given language name,
 * accept both language id and aliases (by default, or set `strict` to `false`).
 *
 * If the language is plaintext, return `null`.
 */
export const getStandardLanguage = (
  languageName: string,
  strict = false
): ILanguageRegistration | null => {
  if (!languageName) return null;
  if (isPlaintext(languageName)) {
    return null;
  }

  const language = BUNDLED_LANGUAGES.find(
    codeLanguage => codeLanguage.id.toLowerCase() === languageName.toLowerCase()
  );
  if (language) return language;
  if (strict) return null;

  const aliasLanguage = BUNDLED_LANGUAGES.find(codeLanguage =>
    codeLanguage.aliases?.includes(languageName.toLowerCase())
  );
  return aliasLanguage ?? null;
};
