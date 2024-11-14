import type {
  DatabaseBlockModel,
  DatabaseBlockProps,
} from '@blocksuite/affine-model';

import { produce } from 'immer';

export const updateProps = <K extends keyof DatabaseBlockProps>(
  model: DatabaseBlockModel,
  key: K,
  update: (columns: DatabaseBlockProps[K]) => void,
  updateSignal = true
) => {
  const newData = produce(model[`${key}$`].value, update);
  model.doc.transact(() => {
    update(model[key]);
  });
  if (updateSignal) {
    model[`${key}$`].value = newData;
  }
};

export const DATABASE_CONVERT_WHITE_LIST = ['affine:list', 'affine:paragraph'];
