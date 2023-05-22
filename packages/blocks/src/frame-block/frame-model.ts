import { FRAME_BACKGROUND_COLORS } from '@blocksuite/global/config';
import { defineBlockSchema, type SchemaToModel } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

export const FrameBlockSchema = defineBlockSchema({
  flavour: 'affine:frame',
  props: () => ({
    xywh: '[0,0,720,480]',
    background: FRAME_BACKGROUND_COLORS[0],
    index: 'a0',
  }),
  metadata: {
    version: 1,
    role: 'hub',
    tag: literal`affine-frame`,
    parent: ['affine:page'],
    children: [
      'affine:paragraph',
      'affine:list',
      'affine:code',
      'affine:divider',
      'affine:database',
      'affine:embed',
      'affine:frame-block-*',
      'affine:bookmark',
    ],
  },
});

export type FrameBlockModel = SchemaToModel<typeof FrameBlockSchema>;
