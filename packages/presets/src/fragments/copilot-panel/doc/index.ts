import { runAnswerAction } from './answer.js';
import { runChangeToneAction } from './change-tone.js';
import { runFixSpellingAction } from './fix-spelling.js';
import { runGenerateAction } from './generate.js';
import { runImproveWritingAction } from './improve-writing.js';
import { runMakeLongerAction } from './make-longer.js';
import { runMakeShorterAction } from './make-shorter.js';
import { runRefineAction } from './refine.js';
import { runSimplifyWritingAction } from './simplify-language.js';
import { runSummaryAction } from './summary.js';
import { runTranslateAction } from './translate.js';

export const GPTAPI = {
  answer: runAnswerAction,
  refine: runRefineAction,
  generate: runGenerateAction,
  summary: runSummaryAction,
  translate: runTranslateAction,
  improveWriting: runImproveWritingAction,
  fixSpelling: runFixSpellingAction,
  makeShorter: runMakeShorterAction,
  makeLonger: runMakeLongerAction,
  changeTone: runChangeToneAction,
  simplifyLanguage: runSimplifyWritingAction,
} satisfies Record<string, (payload: never) => Promise<string | null>>;

export type GPTAPIPayloadMap = {
  [K in keyof typeof GPTAPI]: Parameters<(typeof GPTAPI)[K]>[0];
};
