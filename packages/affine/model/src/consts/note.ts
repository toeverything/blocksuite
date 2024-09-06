import { z } from 'zod';

import { createEnumMap } from '../utils/enum.js';

export const NOTE_WIDTH = 800;

export enum NoteBackgroundColor {
  Black = '--affine-note-background-black',
  Blue = '--affine-note-background-blue',
  Green = '--affine-note-background-green',
  Grey = '--affine-note-background-grey',
  Magenta = '--affine-note-background-magenta',
  Orange = '--affine-note-background-orange',
  Purple = '--affine-note-background-purple',
  Red = '--affine-note-background-red',
  Teal = '--affine-note-background-teal',
  White = '--affine-note-background-white',
  Yellow = '--affine-note-background-yellow',
}

export const NoteBackgroundColorMap = createEnumMap(NoteBackgroundColor);

export const NOTE_BACKGROUND_COLORS = [
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

export const DEFAULT_NOTE_BACKGROUND_COLOR = NoteBackgroundColor.White;

export const NoteBackgroundColorsSchema = z.nativeEnum(NoteBackgroundColor);

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
