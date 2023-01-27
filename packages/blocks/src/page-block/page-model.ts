import { defineBlockSchema, SchemaToModel } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

export const PageBlockModelSchema = defineBlockSchema(
  'affine:page',
  {
    title: '',
  },
  {
    version: 1,
    tag: literal`affine-page`,
  }
);

export type PageBlockModel = SchemaToModel<typeof PageBlockModelSchema>;
