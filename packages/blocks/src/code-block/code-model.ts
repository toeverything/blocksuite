import { defineBlockSchema, type SchemaToModel } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

export const CodeBlockSchema = defineBlockSchema(
  'affine:code',
  internal => ({
    text: internal.Text(),
    language: 'JavaScript',
  }),
  {
    version: 1,
    tag: literal`affine-code`,
  }
);

export type CodeBlockModel = SchemaToModel<typeof CodeBlockSchema>;
