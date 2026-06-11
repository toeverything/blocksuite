import { ElementToPlainTextAdapterExtension } from '@labre/affine-block-surface';

export const brushToPlainTextAdapterMatcher =
  ElementToPlainTextAdapterExtension({
    name: 'brush',
    match: elementModel => elementModel.type === 'brush',
    toAST: () => {
      const content = `Brush Stroke`;
      return { content };
    },
  });
