import { createZodUnion } from '../../utils/index.js';

export const NOTE_BACKGROUND_COLORS = [
  '--affine-palette-transparent',
  '--affine-note-background-yellow',
  '--affine-note-background-orange',
  '--affine-note-background-red',
  '--affine-note-background-magenta',
  '--affine-note-background-purple',
  '--affine-note-background-blue',
  '--affine-note-background-teal',
  '--affine-note-background-green',
  '--affine-note-background-black',
  '--affine-note-background-grey',
  '--affine-note-background-white',
] as const;

export const NoteBackgroundColorsSchema = createZodUnion(
  NOTE_BACKGROUND_COLORS
);

export const DEFAULT_NOTE_BACKGROUND_COLOR = NOTE_BACKGROUND_COLORS[6];

export const NOTE_SHADOWS = [
  '',
  '--affine-note-shadow-box',
  '--affine-note-shadow-sticker',
  '--affine-note-shadow-paper',
  '--affine-note-shadow-float',
  `--affine-note-shadow-film`,
] as const;

export const NoteShadowsSchema = createZodUnion(NOTE_SHADOWS);

export const DEFAULT_NOTE_SHADOW = NOTE_SHADOWS[2];

export const NOTE_SELECTOR =
  'affine-note, affine-edgeless-note, affine-edgeless-text';
