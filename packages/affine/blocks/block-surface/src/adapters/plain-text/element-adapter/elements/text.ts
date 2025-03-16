import { getTextElementText } from '../../../utils/text.js';
import { ElementToPlainTextAdapterExtension } from '../type.js';

export const textToPlainTextAdapterMatcher = ElementToPlainTextAdapterExtension(
  {
    name: 'text',
    match: elementModel => elementModel.type === 'text',
    toAST: elementModel => {
      const content = getTextElementText(elementModel);
      return { content };
    },
  }
);
