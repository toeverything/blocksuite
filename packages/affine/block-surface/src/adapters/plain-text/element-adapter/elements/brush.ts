import type { ElementModelToPlainTextAdapterMatcher } from './type.js';

export const brushElementModelToPlainTextAdapterMatcher: ElementModelToPlainTextAdapterMatcher =
  {
    name: 'brush',
    match: elementModel => elementModel.type === 'brush',
    toAST: () => {
      const content = `Brush Stroke`;
      return { content };
    },
  };
