import type { DeltaInsert } from '@blocksuite/inline/types';

import type { ElementModelToPlainTextAdapterMatcher } from '../type.js';

export const textToPlainTextAdapterMatcher: ElementModelToPlainTextAdapterMatcher =
  {
    name: 'text',
    match: elementModel => elementModel.type === 'text',
    toAST: elementModel => {
      let content = '';
      if (
        'text' in elementModel &&
        typeof elementModel.text === 'object' &&
        elementModel.text
      ) {
        let delta: DeltaInsert[] = [];
        if ('delta' in elementModel.text) {
          delta = elementModel.text.delta as DeltaInsert[];
        }
        content = delta.map(d => d.insert).join('');
      }
      return { content };
    },
  };
