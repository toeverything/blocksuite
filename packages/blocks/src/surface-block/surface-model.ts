import { defineBlockSchema, type SchemaToModel } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

export const SurfaceBlockSchema = defineBlockSchema({
  flavour: 'affine:surface',
  metadata: {
    version: 1,
    role: 'root',
    tag: literal`affine-surface`,
    children: [],
  },
});

export type SurfaceBlockModel = SchemaToModel<typeof SurfaceBlockSchema>;
