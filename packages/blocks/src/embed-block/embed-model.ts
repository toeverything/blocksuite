import { defineBlockSchema, type SchemaToModel } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

export const EmbedBlockSchema = defineBlockSchema({
  flavour: 'affine:embed',
  role: 'content',
  props: () => ({
    type: 'image',
    caption: '',
    sourceId: '',
    width: 0,
    height: 0,
  }),
  metadata: {
    version: 1,
    tag: literal`affine-embed`,
  },
});

export type EmbedBlockModel = SchemaToModel<typeof EmbedBlockSchema>;
