import type { DeltaInsert } from '@blocksuite/inline/types';

import type { ElementModelToPlainTextAdapterMatcher } from './type.js';

export const shapeElementModelToPlainTextAdapterMatcher: ElementModelToPlainTextAdapterMatcher =
  {
    name: 'shape',
    match: elementModel => elementModel.type === 'shape',
    toAST: elementModel => {
      let text = '';
      let shapeType = '';
      if ('text' in elementModel && elementModel.text) {
        let delta: DeltaInsert[] = [];
        if ('delta' in elementModel.text) {
          delta = elementModel.text.delta as DeltaInsert[];
        }
        text = delta.map(d => d.insert).join('');
      }
      if ('shapeType' in elementModel) {
        shapeType =
          elementModel.shapeType.charAt(0).toUpperCase() +
          elementModel.shapeType.slice(1);
      }
      const content = `${shapeType}, with text label "${text}"`;
      return { content };
    },
  };
