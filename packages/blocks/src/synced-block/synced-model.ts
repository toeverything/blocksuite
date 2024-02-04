import { BlockModel, defineBlockSchema } from '@blocksuite/store';

export type SyncedBlockProps = {
  pageId: string;
  caption?: string;
};

export const defaultSyncedProps: SyncedBlockProps = {
  pageId: '',
  caption: undefined,
};

export const SyncedBlockSchema = defineBlockSchema({
  flavour: 'affine:synced',
  props: (): SyncedBlockProps => defaultSyncedProps,
  metadata: {
    version: 1,
    role: 'content',
    parent: ['affine:note'],
  },
  toModel: () => new SyncedBlockModel(),
});

export class SyncedBlockModel extends BlockModel<SyncedBlockProps> {}
