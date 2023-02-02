import {
  defineBlockSchema,
  SchemaToModel,
  RichTextType,
} from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

export const CodeBlockModelSchema = defineBlockSchema(
  'affine:code',
  () => ({
    language: 'JavaScript',
    text: RichTextType,
  }),
  {
    version: 1,
    tag: literal`affine-code`,
  }
);

export type CodeBlockModel = SchemaToModel<typeof CodeBlockModelSchema>;
