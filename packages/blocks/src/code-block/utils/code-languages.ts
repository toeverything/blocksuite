import type { Slot } from '@blocksuite/global/utils';
import type { BundledLanguage } from 'shiki';
import { bundledLanguagesInfo, isPlainLang } from 'shiki';

import { PLAIN_TEXT_LANG_INFO, type StrictLanguageInfo } from './consts.js';

export interface selectedLanguageChangedSlots {
  selectedLanguageChanged: Slot<{ language: string | null }>;
  dispose: Slot;
}
// TIOBE Index for May 2023
// ref https://www.tiobe.com/tiobe-index/
const PopularLanguages: BundledLanguage[] = [
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

const POPULAR_LANGUAGES_MAP: Partial<Record<BundledLanguage, number>> =
  PopularLanguages.reduce((acc, lang, i) => {
    return {
      [lang]: i,
      ...acc,
    };
  }, {});

export function getLanguagePriority(lang: BundledLanguage) {
  return POPULAR_LANGUAGES_MAP[lang] ?? Infinity;
}

export function isPlaintext(lang: string) {
  return isPlainLang(lang) || PLAIN_TEXT_LANG_INFO.id === lang;
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
): StrictLanguageInfo | null => {
  if (!languageName) return null;
  if (isPlaintext(languageName)) {
    return null;
  }

  const language = bundledLanguagesInfo.find(
    codeLanguage => codeLanguage.id.toLowerCase() === languageName.toLowerCase()
  );
  // The language is found from the bundledLanguagesInfo,
  // so it is safe to cast it to `StrictLanguageInfo`.
  if (language) return language as StrictLanguageInfo;
  if (strict) return null;

  const aliasLanguage = bundledLanguagesInfo.find(codeLanguage =>
    codeLanguage.aliases?.includes(languageName.toLowerCase())
  );
  return (aliasLanguage as StrictLanguageInfo) ?? null;
};
