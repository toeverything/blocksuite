import { FRAME_BACKGROUND_COLORS } from '@blocksuite/global/config';
import { defineBlockSchema, type SchemaToModel } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

export const FrameBlockSchema = defineBlockSchema({
  flavour: 'affine:frame',
  props: () => ({
    xywh: '[0,0,720,480]',
    background: FRAME_BACKGROUND_COLORS[0],
  }),
  metadata: {
    version: 1,
    role: 'hub',
    tag: literal`affine-frame`,
  },
});

export type FrameBlockModel = SchemaToModel<typeof FrameBlockSchema>;
