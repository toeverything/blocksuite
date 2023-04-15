import { defineBlockSchema, type SchemaToModel } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

export const SurfaceBlockSchema = defineBlockSchema({
  flavour: 'affine:surface',
  metadata: {
    version: 1,
    role: 'hub',
    tag: literal`affine-surface`,
  },
});

export type SurfaceBlockModel = SchemaToModel<typeof SurfaceBlockSchema>;
