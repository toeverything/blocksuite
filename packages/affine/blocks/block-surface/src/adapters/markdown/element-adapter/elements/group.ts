import { getGroupTitle } from '../../../utils/text.js';
import { ElementToMarkdownAdapterExtension } from '../type.js';

export const groupToMarkdownAdapterMatcher = ElementToMarkdownAdapterExtension({
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
});
