import { defineBlockSchema, type SchemaToModel } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

export const FrameBlockSchema = defineBlockSchema({
  flavour: 'affine:frame',
  role: 'content',
  props: () => ({
    xywh: '[0,0,720,480]',
    background: 'var(--affine-background-secondary-color)',
  }),
  metadata: {
    version: 1,
    tag: literal`affine-frame`,
  },
});

export type FrameBlockModel = SchemaToModel<typeof FrameBlockSchema>;
