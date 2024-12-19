import type { ElementModelToMarkdownAdapterMatcher } from '../type.js';

export const brushToMarkdownAdapterMatcher: ElementModelToMarkdownAdapterMatcher =
  {
    name: 'brush',
    match: elementModel => elementModel.type === 'brush',
    toAST: () => {
      const content = `Brush Stroke`;
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
