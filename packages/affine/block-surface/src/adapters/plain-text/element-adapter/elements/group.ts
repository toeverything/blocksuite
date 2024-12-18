import type { DeltaInsert } from '@blocksuite/inline/types';

import type { ElementModelToPlainTextAdapterMatcher } from '../type.js';

export const groupToPlainTextAdapterMatcher: ElementModelToPlainTextAdapterMatcher =
  {
    name: 'group',
    match: elementModel => elementModel.type === 'group',
    toAST: elementModel => {
      let title = '';
      if (
        'title' in elementModel &&
        typeof elementModel.title === 'object' &&
        elementModel.title
      ) {
        let delta: DeltaInsert[] = [];
        if ('delta' in elementModel.title) {
          delta = elementModel.title.delta as DeltaInsert[];
        }
        title = delta.map(d => d.insert).join('');
      }
      const content = `Group, with title "${title}"`;
      return { content };
    },
  };
