import { defineBlockSchema, Model } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

export const CodeBlockSchema = defineBlockSchema(
  'affine:code',
  {
    language: 'JavaScript',
  },
  {
    version: 1,
    tag: literal`affine-code`,
  }
);

export type CodeBlockModel = Model<typeof CodeBlockSchema>;
