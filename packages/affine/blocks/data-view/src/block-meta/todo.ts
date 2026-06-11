import { type ListBlockModel, ListBlockSchema } from '@labre/affine-model';

import { createBlockMeta } from './base.js';

export const todoMeta = createBlockMeta<ListBlockModel>({
  selector: block => {
    if (block.flavour !== ListBlockSchema.model.flavour) {
      return false;
    }

    return (block.model as ListBlockModel).props.type === 'todo';
  },
});
