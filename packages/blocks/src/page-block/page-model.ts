import { defineBlockSchema, SchemaToModel, Text } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

export const PageBlockModelSchema = defineBlockSchema(
  'affine:page',
  () => ({
    title: new Text(),
  }),
  {
    version: 1,
    tag: literal`affine-page`,
  }
);

export type PageBlockModel = SchemaToModel<typeof PageBlockModelSchema>;
