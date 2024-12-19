import type { ElementModelToMarkdownAdapterMatcher } from '../type.js';

import { getGroupTitle } from '../../../utils/text.js';

export const groupToMarkdownAdapterMatcher: ElementModelToMarkdownAdapterMatcher =
  {
    name: 'group',
    match: elementModel => elementModel.type === 'group',
    toAST: elementModel => {
      const title = getGroupTitle(elementModel);
      if (!title) {
        return null;
      }

      const content = `Group, with title "${title}"`;
      return {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            value: content,
          },
        ],
      };
    },
  };
