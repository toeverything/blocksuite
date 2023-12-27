import { z } from 'zod';

export const NOTE_COLORS = [
  '--affine-background-secondary-color',
  '--affine-tag-yellow',
  '--affine-tag-red',
  '--affine-tag-green',
  '--affine-tag-blue',
  '--affine-tag-purple',
] as const;

export const NoteColorsSchema = z.union([
  z.literal('--affine-background-secondary-color'),
  z.literal('--affine-tag-yellow'),
  z.literal('--affine-tag-red'),
  z.literal('--affine-tag-green'),
  z.literal('--affine-tag-blue'),
  z.literal('--affine-tag-purple'),
]);

export const DEFAULT_NOTE_COLOR = NOTE_COLORS[0];

export const NOTE_SHADOWS = [
  '',
  '--affine-note-shadow-box',
  '--affine-note-shadow-sticker',
  '--affine-note-shadow-paper',
  '--affine-note-shadow-float',
  `--affine-note-shadow-film`,
] as const;

export const NoteShadowsSchema = z.union([
  z.literal(''),
  z.literal('--affine-note-shadow-box'),
  z.literal('--affine-note-shadow-sticker'),
  z.literal('--affine-note-shadow-paper'),
  z.literal('--affine-note-shadow-float'),
  z.literal('--affine-note-shadow-film'),
]);
