import type { BlockStdScope } from '@blocksuite/block-std';
import type { JobMiddleware } from '@blocksuite/store';

export const newIdCrossDoc =
  (std: BlockStdScope): JobMiddleware =>
  ({ slots, collection }) => {
    let samePage = false;
    slots.beforeImport.on(payload => {
      if (payload.type === 'slice') {
        samePage = payload.snapshot.pageId === std.doc.id;
      }
      if (payload.type === 'block' && !samePage) {
        payload.snapshot.id = collection.idGenerator();
      }
    });
  };
