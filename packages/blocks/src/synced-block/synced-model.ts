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
    role: 'hub',
    parent: ['affine:page'],
  },
});

export class SyncedBlockModel extends BlockModel<SyncedBlockProps> {}
