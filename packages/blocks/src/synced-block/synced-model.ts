import { BlockModel, defineBlockSchema } from '@blocksuite/store';

export type SyncedBlockProps = {
  pageId: string;
  blockId: string;
};

export const SyncedBlockSchema = defineBlockSchema({
  flavour: 'affine:synced',
  props: (): SyncedBlockProps => ({
    pageId: '',
    blockId: '',
  }),
  metadata: {
    version: 1,
    role: 'content',
    parent: ['affine:note'],
  },
});

export class SyncedBlockModel extends BlockModel<SyncedBlockProps> {}
