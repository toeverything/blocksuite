import type { JobMiddleware } from '@blocksuite/store';

export const copyEmbedDoc: JobMiddleware = ({ slots, collection }) => {
  slots.beforeImport.on(payload => {
    if (
      payload.type === 'block' &&
      ['affine:embed-linked-doc', 'affine:embed-synced-doc'].includes(
        payload.snapshot.flavour
      )
    ) {
      payload.snapshot.id = collection.idGenerator();
    }
  });
};
