import { defineBlockSchema, type SchemaToModel } from '@blocksuite/store';

type SurfaceBlockProps = {
  elements: Record<string, unknown>;
};

export const SurfaceBlockSchema = defineBlockSchema({
  flavour: 'affine:surface',
  props: (): SurfaceBlockProps => ({
    elements: {},
  }),
  metadata: {
    version: 4,
    role: 'hub',
    parent: ['affine:page'],
    children: [],
  },
});

export type SurfaceBlockModel = SchemaToModel<typeof SurfaceBlockSchema>;
