import { createZodUnion } from '../../utils/index.js';

export const NOTE_COLORS = [
  '--affine-background-secondary-color',
  '--affine-tag-yellow',
  '--affine-tag-red',
  '--affine-tag-green',
  '--affine-tag-blue',
  '--affine-tag-purple',
] as const;

export const NoteColorsSchema = createZodUnion(NOTE_COLORS);

export const DEFAULT_NOTE_COLOR = NOTE_COLORS[0];

export const NOTE_SHADOWS = [
  '',
  '--affine-note-shadow-box',
  '--affine-note-shadow-sticker',
  '--affine-note-shadow-paper',
  '--affine-note-shadow-float',
  `--affine-note-shadow-film`,
] as const;

export const NoteShadowsSchema = createZodUnion(NOTE_SHADOWS);
