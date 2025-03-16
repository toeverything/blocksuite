import type { BlockStdScope } from '@blocksuite/block-std';
import type { TransformerMiddleware } from '@blocksuite/store';

export const surfaceRefToEmbed =
  (std: BlockStdScope): TransformerMiddleware =>
  ({ slots }) => {
    let pageId: string | null = null;
    slots.beforeImport.subscribe(payload => {
      if (payload.type === 'slice') {
        pageId = payload.snapshot.pageId;
      }
    });
    slots.beforeImport.subscribe(payload => {
      if (
        pageId &&
        payload.type === 'block' &&
        payload.snapshot.flavour === 'affine:surface-ref' &&
        !std.store.hasBlock(payload.snapshot.id)
      ) {
        // The blockId of the original surface-ref block
        const blockId = payload.snapshot.id;
        payload.snapshot.id = std.workspace.idGenerator();
        payload.snapshot.flavour = 'affine:embed-linked-doc';
        payload.snapshot.props = {
          pageId,
          params: {
            mode: 'page',
            blockIds: [blockId],
          },
        };
      }
    });
  };
