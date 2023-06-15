import { defineBlockSchema, type SchemaToModel } from '@blocksuite/store';

export const SurfaceBlockSchema = defineBlockSchema({
  flavour: 'affine:surface',
  metadata: {
    version: 3,
    role: 'hub',
    parent: ['affine:page'],
    children: [],
  },
});

export type SurfaceBlockModel = SchemaToModel<typeof SurfaceBlockSchema>;
