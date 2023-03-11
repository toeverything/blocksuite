import { defineBlockSchema, type SchemaToModel } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

export const EmbedBlockModelSchema = defineBlockSchema(
  'affine:embed',
  () => ({
    type: 'image',
    caption: '',
    sourceId: '',
    width: 0,
    height: 0,
  }),
  {
    version: 1,
    tag: literal`affine-embed`,
  }
);

export type EmbedBlockModel = SchemaToModel<typeof EmbedBlockModelSchema>;
