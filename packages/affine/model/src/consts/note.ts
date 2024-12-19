import { themeToVar } from '@toeverything/theme/v2';
import { z } from 'zod';

import { createEnumMap } from '../utils/enum.js';

export const NOTE_MIN_WIDTH = 450 + 24 * 2;
export const NOTE_MIN_HEIGHT = 92;

export const DEFAULT_NOTE_WIDTH = NOTE_MIN_WIDTH;
export const DEFAULT_NOTE_HEIGHT = NOTE_MIN_HEIGHT;

export enum NoteShadow {
  Box = '--affine-note-shadow-box',
  Film = '--affine-note-shadow-film',
  Float = '--affine-note-shadow-float',
  None = '',
  Paper = '--affine-note-shadow-paper',
  Sticker = '--affine-note-shadow-sticker',
}

export const NoteShadowMap = createEnumMap(NoteShadow);

export const NOTE_SHADOWS = [
  NoteShadow.None,
  NoteShadow.Box,
  NoteShadow.Sticker,
  NoteShadow.Paper,
  NoteShadow.Float,
  NoteShadow.Film,
] as const;

export const DEFAULT_NOTE_SHADOW = NoteShadow.Box;

export const NoteShadowsSchema = z.nativeEnum(NoteShadow);

export enum NoteDisplayMode {
  DocAndEdgeless = 'both',
  DocOnly = 'doc',
  EdgelessOnly = 'edgeless',
}

export enum StrokeStyle {
  Dash = 'dash',
  None = 'none',
  Solid = 'solid',
}

export const DEFAULT_NOTE_BORDER_STYLE = StrokeStyle.None;

export const StrokeStyleMap = createEnumMap(StrokeStyle);

export enum NoteCorners {
  Huge = 32,
  Large = 24,
  Medium = 16,
  None = 0,
  Small = 8,
}

export const NoteCornersMap = createEnumMap(NoteCorners);

export const NOTE_CORNERS = [
  NoteCorners.None,
  NoteCorners.Small,
  NoteCorners.Medium,
  NoteCorners.Large,
  NoteCorners.Huge,
] as const;

export const DEFAULT_NOTE_CORNER = NoteCorners.Small;

export const NoteCornersSchema = z.nativeEnum(NoteCorners);

export const DEFAULT_NOTE_BORDER_SIZE = 4;

export const NoteBackgroundColor = {
  Yellow: themeToVar('edgeless/note/yellow'),
  Orange: themeToVar('edgeless/note/orange'),
  Red: themeToVar('edgeless/note/red'),
  Magenta: themeToVar('edgeless/note/magenta'),
  Purple: themeToVar('edgeless/note/purple'),
  Blue: themeToVar('edgeless/note/blue'),
  Teal: themeToVar('edgeless/note/teal'),
  Green: themeToVar('edgeless/note/green'),
  Black: themeToVar('edgeless/note/black'),
  Grey: themeToVar('edgeless/note/grey'),
  White: themeToVar('edgeless/note/white'),
} as const;

export const NOTE_BACKGROUND_PALETTES = [
  NoteBackgroundColor.Yellow,
  NoteBackgroundColor.Orange,
  NoteBackgroundColor.Red,
  NoteBackgroundColor.Magenta,
  NoteBackgroundColor.Purple,
  NoteBackgroundColor.Blue,
  NoteBackgroundColor.Teal,
  NoteBackgroundColor.Green,
  NoteBackgroundColor.Black,
  NoteBackgroundColor.Grey,
  NoteBackgroundColor.White,
] as const;

export const NoteBackgroundPaletteEnum = z.enum(NOTE_BACKGROUND_PALETTES);
export type NoteBackgroundPaletteEnum = z.infer<
  typeof NoteBackgroundPaletteEnum
>;

export const NoteBackgroundColorMap = createEnumMap(NoteBackgroundColor);

export const DEFAULT_NOTE_BACKGROUND_COLOR = NoteBackgroundColor.White;
