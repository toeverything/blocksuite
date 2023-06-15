import { defineBlockSchema, type SchemaToModel } from '@blocksuite/store';

export const EmbedBlockSchema = defineBlockSchema({
  flavour: 'affine:embed',
  props: () => ({
    type: 'image',
    caption: '',
    sourceId: '',
    width: 0,
    height: 0,
  }),
  metadata: {
    version: 1,
    role: 'content',
  },
});

export type EmbedBlockModel = SchemaToModel<typeof EmbedBlockSchema>;
