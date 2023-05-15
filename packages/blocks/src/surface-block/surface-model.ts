import { defineBlockSchema, type SchemaToModel } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

export const SurfaceBlockSchema = defineBlockSchema({
  flavour: 'affine:surface',
  metadata: {
    version: 2,
    role: 'hub',
    tag: literal`affine-surface`,
    parent: ['affine:page'],
    children: [],
  },
});

export type SurfaceBlockModel = SchemaToModel<typeof SurfaceBlockSchema>;
