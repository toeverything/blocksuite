import { defineBlockSchema, type SchemaToModel } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

export const PageBlockSchema = defineBlockSchema({
  flavour: 'affine:page',
  props: internal => ({
    title: internal.Text(),
  }),
  metadata: {
    version: 2,
    role: 'root',
    tag: literal`affine-page`,
  },
});

export type PageBlockModel = SchemaToModel<typeof PageBlockSchema>;
