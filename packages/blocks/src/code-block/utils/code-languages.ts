import type { ILanguageRegistration, Lang } from 'shiki';
import { BUNDLED_LANGUAGES } from 'shiki';

import { PLAIN_TEXT_REGISTRATION } from './consts.js';

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

export const POPULAR_LANGUAGES_MAP: Partial<Record<Lang, number>> =
  PopularLanguages.reduce((acc, lang, i) => {
    return {
      [lang]: i,
      ...acc,
    };
  }, {});

function isPlaintext(lang: string) {
  return [
    PLAIN_TEXT_REGISTRATION.id,
    ...PLAIN_TEXT_REGISTRATION.aliases,
  ].includes(lang.toLowerCase());
}

export const getStandardLanguage = (
  languageName: string | null
): ILanguageRegistration | null => {
  if (!languageName) return null;
  if (isPlaintext(languageName)) {
    return null;
  }

  const language = BUNDLED_LANGUAGES.find(
    codeLanguage =>
      codeLanguage.id.toLowerCase() === languageName.toLowerCase() ||
      codeLanguage.aliases?.includes(languageName.toLowerCase())
  );
  return language ?? null;
};
