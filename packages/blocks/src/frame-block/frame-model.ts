import { EDITOR_WIDTH } from '@blocksuite/global/config';
import { defineBlockSchema, type SchemaToModel } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

import type { CssVariableName } from '../__internal__/theme/css-variables.js';

export const FRAME_COLORS: CssVariableName[] = [
  '--affine-background-secondary-color',
  '--affine-tag-yellow',
  '--affine-tag-red',
  '--affine-tag-green',
  '--affine-tag-blue',
  '--affine-tag-purple',
];

export const DEFAULT_FRAME_COLOR = FRAME_COLORS[0];

export const FrameBlockSchema = defineBlockSchema({
  flavour: 'affine:frame',
  props: () => ({
    xywh: `[0,0,${EDITOR_WIDTH},480]`,
    background: DEFAULT_FRAME_COLOR,
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
