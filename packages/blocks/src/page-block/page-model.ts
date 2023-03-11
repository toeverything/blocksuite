import { defineBlockSchema, type SchemaToModel } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

export const PageBlockModelSchema = defineBlockSchema(
  'affine:page',
  internal => ({
    title: internal.Text(),
  }),
  {
    version: 2,
    tag: literal`affine-page`,
  }
);

export type PageBlockModel = SchemaToModel<typeof PageBlockModelSchema>;
