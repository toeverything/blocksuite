import type { BlockStdScope, UIEventHandler } from '@labre/std';

import { textCommonKeymap } from './basic.js';
import { bracketKeymap } from './bracket.js';
import { textFormatKeymap } from './format.js';

export const textKeymap = (
  std: BlockStdScope
): Record<string, UIEventHandler> => {
  return {
    ...textCommonKeymap(std),
    ...bracketKeymap(std),
    ...textFormatKeymap(std),
  };
};
