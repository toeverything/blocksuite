import { defineBlockSchema, type SchemaToModel } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

export const SurfaceBlockSchema = defineBlockSchema(
  'affine:surface',
  () => ({}),
  {
    version: 1,
    tag: literal`affine-surface`,
  }
);

export type SurfaceBlockModel = SchemaToModel<typeof SurfaceBlockSchema>;
