import { defineBlockSchema, type SchemaToModel } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

export const FrameBlockModelSchema = defineBlockSchema(
  'affine:frame',
  () => ({
    xywh: '[0,0,720,480]',
  }),
  {
    version: 1,
    tag: literal`affine-frame`,
  }
);

export type FrameBlockModel = SchemaToModel<typeof FrameBlockModelSchema>;
