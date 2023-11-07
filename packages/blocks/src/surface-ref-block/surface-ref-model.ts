import { defineBlockSchema, type SchemaToModel } from '@blocksuite/store';

export type SurfaceRefProps = {
  reference: string;
  caption?: string;
  refFlavour?: string;
};

export const SurfaceRefBlockSchema = defineBlockSchema({
  flavour: 'affine:surface-ref',
  props: () =>
    ({
      reference: '',
      caption: '',
    }) as SurfaceRefProps,
  metadata: {
    version: 1,
    role: 'content',
    parent: ['affine:note'],
  },
});

export type SurfaceRefBlockModel = SchemaToModel<typeof SurfaceRefBlockSchema>;
