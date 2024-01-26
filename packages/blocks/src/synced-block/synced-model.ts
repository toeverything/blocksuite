import { BlockModel, defineBlockSchema } from '@blocksuite/store';

export type SyncedBlockProps = {
  pageId: string;
};

export const SyncedBlockSchema = defineBlockSchema({
  flavour: 'affine:synced',
  props: (): SyncedBlockProps => ({
    pageId: '',
  }),
  metadata: {
    version: 1,
    role: 'content',
    parent: ['affine:note'],
  },
});

export class SyncedBlockModel extends BlockModel<SyncedBlockProps> {}
