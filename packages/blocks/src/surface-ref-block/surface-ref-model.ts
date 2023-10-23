import { defineBlockSchema, type SchemaToModel } from '@blocksuite/store';

export type SurfaceRefProps = {
  reference: string;
  refFlavour?: string;
};

export const SurfaceRefBlockSchema = defineBlockSchema({
  flavour: 'affine:surface-ref',
  props: () =>
    ({
      reference: '',
    }) as SurfaceRefProps,
  metadata: {
    version: 1,
    role: 'hub',
    parent: ['affine:page'],
  },
});

export type SurfaceRefBlockModel = SchemaToModel<typeof SurfaceRefBlockSchema>;
