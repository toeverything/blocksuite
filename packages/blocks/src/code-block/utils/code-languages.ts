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

  // other

  // 24
  'perl',
  'objective-c',
  // 28
  'dart',
  'lua',
  // 33
  'kotlin',
  'logo',
  'scala',
  'haskell',
  'fsharp',
  'scheme',
  // 40
  'typescript',
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
