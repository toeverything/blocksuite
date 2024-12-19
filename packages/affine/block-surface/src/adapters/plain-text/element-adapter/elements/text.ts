import type { ElementModelToPlainTextAdapterMatcher } from '../type.js';

import { getTextElementText } from '../../../utils/text.js';

export const textToPlainTextAdapterMatcher: ElementModelToPlainTextAdapterMatcher =
  {
    name: 'text',
    match: elementModel => elementModel.type === 'text',
    toAST: elementModel => {
      const content = getTextElementText(elementModel);
      return { content };
    },
  };
