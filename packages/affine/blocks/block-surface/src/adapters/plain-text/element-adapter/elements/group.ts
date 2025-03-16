import { getGroupTitle } from '../../../utils/text.js';
import { ElementToPlainTextAdapterExtension } from '../type.js';

export const groupToPlainTextAdapterMatcher =
  ElementToPlainTextAdapterExtension({
    name: 'group',
    match: elementModel => elementModel.type === 'group',
    toAST: elementModel => {
      const title = getGroupTitle(elementModel);
      const content = `Group, with title "${title}"`;
      return { content };
    },
  });
