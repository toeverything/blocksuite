import { defineBlockSchema, type SchemaToModel } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

export const DividerBlockSchema = defineBlockSchema(
  'affine:divider',
  () => ({}),
  {
    version: 1,
    tag: literal`affine-divider`,
  }
);

export type DividerBlockModel = SchemaToModel<typeof DividerBlockSchema>;
