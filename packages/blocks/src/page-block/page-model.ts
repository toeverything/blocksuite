import type { Y } from '@blocksuite/store';
import { defineBlockSchema, type SchemaToModel } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

export const PageBlockSchema = defineBlockSchema({
  flavour: 'affine:page',
  role: 'root',
  props: internal => ({
    title: internal.Text(),
  }),
  metadata: {
    version: 2,
    tag: literal`affine-page`,
  },
  ext: internal => ({
    cells: internal.Cast<Y.Map<Y.Map<unknown>>>(),
    columns: internal.Cast<Y.Map<unknown>>(),
  }),
});

export type PageBlockModel = SchemaToModel<typeof PageBlockSchema>;
