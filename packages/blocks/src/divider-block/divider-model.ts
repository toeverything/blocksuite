import { defineBlockSchema, type SchemaToModel } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

export const DividerBlockSchema = defineBlockSchema({
  flavour: 'affine:divider',
  role: 'content',
  metadata: {
    version: 1,
    tag: literal`affine-divider`,
  },
});

export type DividerBlockModel = SchemaToModel<typeof DividerBlockSchema>;
