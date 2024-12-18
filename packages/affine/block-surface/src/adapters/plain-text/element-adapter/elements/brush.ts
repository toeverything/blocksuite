import type { ElementModelToPlainTextAdapterMatcher } from '../type.js';

export const brushToPlainTextAdapterMatcher: ElementModelToPlainTextAdapterMatcher =
  {
    name: 'brush',
    match: elementModel => elementModel.type === 'brush',
    toAST: () => {
      const content = `Brush Stroke`;
      return { content };
    },
  };
