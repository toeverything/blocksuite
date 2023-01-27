import {
  defineBlockSchema,
  SchemaToModel,
  $textValue,
} from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

export const CodeBlockModelSchema = defineBlockSchema(
  'affine:code',
  () => ({
    language: 'JavaScript',
    text: $textValue,
  }),
  {
    version: 1,
    tag: literal`affine-code`,
  }
);

export type CodeBlockModel = SchemaToModel<typeof CodeBlockModelSchema>;
