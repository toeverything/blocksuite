import { defineBlockSchema, type SchemaToModel } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

export const FrameBlockSchema = defineBlockSchema({
  flavour: 'affine:frame',
  props: () => ({
    xywh: '[0,0,720,480]',
    background: '#FBFAFC',
  }),
  metadata: {
    version: 1,
    role: 'content',
    tag: literal`affine-frame`,
  },
});

export type FrameBlockModel = SchemaToModel<typeof FrameBlockSchema>;
