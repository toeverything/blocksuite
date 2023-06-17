import { defineBlockSchema, type SchemaToModel } from '@blocksuite/store';

export const ImageBlockSchema = defineBlockSchema({
  flavour: 'affine:image',
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

export type ImageBlockModel = SchemaToModel<typeof ImageBlockSchema>;
