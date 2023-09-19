import type { JobMiddleware } from '@blocksuite/store';

import type { DatabaseBlockModel } from '../../database-block/index.js';

export const replaceIdMiddleware: JobMiddleware = ({ slots, workspace }) => {
  const idMap = new Map<string, string>();
  slots.afterImport.on(payload => {
    if (
      payload.type === 'block' &&
      payload.snapshot.flavour === 'affine:database'
    ) {
      const model = payload.model as DatabaseBlockModel;
      Object.keys(model.cells).forEach(cellId => {
        if (idMap.has(cellId)) {
          model.cells[idMap.get(cellId)!] = model.cells[cellId];
          delete model.cells[cellId];
        }
      });
    }
  });
  slots.beforeImport.on(payload => {
    if (payload.type === 'page') {
      payload.snapshot.meta.id = workspace.idGenerator('page');
      return;
    }

    if (payload.type === 'block') {
      const snapshot = payload.snapshot;
      const original = snapshot.id;
      let newId: string;
      if (idMap.has(original)) {
        newId = idMap.get(original)!;
      } else {
        newId = workspace.idGenerator('block');
        idMap.set(original, newId);
      }
      snapshot.id = newId;
    }
  });
};
