import { EDITOR_WIDTH } from '@blocksuite/global/config';
import { defineBlockSchema, type SchemaToModel } from '@blocksuite/store';

import type { CssVariableName } from '../__internal__/theme/css-variables.js';

export const NOTE_COLORS: CssVariableName[] = [
  '--affine-background-secondary-color',
  '--affine-tag-yellow',
  '--affine-tag-red',
  '--affine-tag-green',
  '--affine-tag-blue',
  '--affine-tag-purple',
];

export const DEFAULT_NOTE_COLOR = NOTE_COLORS[0];

export const NoteBlockSchema = defineBlockSchema({
  flavour: 'affine:note',
  props: () => ({
    xywh: `[0,0,${EDITOR_WIDTH},480]`,
    background: DEFAULT_NOTE_COLOR,
    index: 'a0',
    hidden: false,
  }),
  metadata: {
    version: 1,
    role: 'hub',
    parent: ['affine:page'],
    children: [
      'affine:paragraph',
      'affine:list',
      'affine:code',
      'affine:divider',
      'affine:database',
      'affine:image',
      'affine:note-block-*',
      'affine:bookmark',
    ],
  },
});

export type NoteBlockModel = SchemaToModel<typeof NoteBlockSchema>;
