import { runAnswerAction } from './answer';
import { runChangeToneAction } from './change-tone';
import { runFixSpellingAction } from './fix-spelling';
import { runImproveWritingAction } from './improve-writing';
import { runMakeLongerAction } from './make-longer';
import { runMakeShorterAction } from './make-shorter';
import { runRefineAction } from './refine';
import { runSimplifyWritingAction } from './simplify-language';
import { runSummaryAction } from './summary';
import { runTranslateAction } from './translate';

export const GPTAPI = {
  answer: runAnswerAction,
  refine: runRefineAction,
  generate: runRefineAction,
  summary: runSummaryAction,
  translate: runTranslateAction,
  improveWriting: runImproveWritingAction,
  fixSpelling: runFixSpellingAction,
  makeShorter: runMakeShorterAction,
  makeLonger: runMakeLongerAction,
  changeTone: runChangeToneAction,
  simplifyLanguage: runSimplifyWritingAction,
};
