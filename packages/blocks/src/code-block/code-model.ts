import { defineBlockSchema, SchemaToModel } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

export const CodeBlockModelSchema = defineBlockSchema(
  'affine:code',
  () => ({
    language: 'JavaScript',
  }),
  {
    version: 1,
    tag: literal`affine-code`,
  },
  {
    enableText: true,
  }
);

export type CodeBlockModel = SchemaToModel<typeof CodeBlockModelSchema>;
