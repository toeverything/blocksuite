import { StrokeStyle } from '../../../surface-block/consts.js';
import type { CssVariableName } from '../../theme/css-variables.js';

export const NOTE_COLORS: CssVariableName[] = [
  '--affine-background-secondary-color',
  '--affine-tag-yellow',
  '--affine-tag-red',
  '--affine-tag-green',
  '--affine-tag-blue',
  '--affine-tag-purple',
];

export const DEFAULT_NOTE_COLOR = NOTE_COLORS[0];

export const NOTE_SHADOWS = [
  '',
  '--affine-note-shadow-box',
  '--affine-note-shadow-sticker',
  '--affine-note-shadow-paper',
  '--affine-note-shadow-float',
  `--affine-note-shadow-film`,
];

export const DEFAULT_EDGELESS_PROP = {
  style: {
    borderRadius: 8,
    borderSize: 4,
    borderStyle: StrokeStyle.Solid,
    shadowType: NOTE_SHADOWS[1],
  },
  collapse: false,
  collapsedHeight: 0,
};
