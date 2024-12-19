import { z } from 'zod';

import { ColorSchema } from '../color.js';

export const PaletteSchema = z.object({
  key: z.string(),
  value: ColorSchema,
});

export type Palette = z.infer<typeof PaletteSchema>;

export const ThemeSchema = z.object({
  black: ColorSchema,
  white: ColorSchema,
  transparent: z.literal('transparent'),
  textColor: ColorSchema,
  shapeTextColor: ColorSchema,
  shapeStrokeColor: ColorSchema,
  shapeFillColor: ColorSchema,
  connectorColor: ColorSchema,
  palettes: z.array(PaletteSchema),
  noteBackgrounColor: ColorSchema,
  notePalettes: z.array(PaletteSchema),
  globalToolbarPalettes: z.array(PaletteSchema),
  globalToolbarShapeFillPalettes: z.array(PaletteSchema),
  StrokeColorMap: z.record(z.string(), ColorSchema),
  FillColorMap: z.record(z.string(), ColorSchema),
  NoteBackgroundColorMap: z.record(z.string(), ColorSchema),
});

export type Theme = z.infer<typeof ThemeSchema>;
