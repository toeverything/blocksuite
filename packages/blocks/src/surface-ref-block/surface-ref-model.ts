import { type SchemaToModel, defineBlockSchema } from '@blocksuite/store';

type SurfaceRefProps = {
  caption: string;
  refFlavour: string;
  reference: string;
};

export const SurfaceRefBlockSchema = defineBlockSchema({
  flavour: 'affine:surface-ref',
  metadata: {
    parent: ['affine:note', 'affine:paragraph', 'affine:list'],
    role: 'content',
    version: 1,
  },
  props: () =>
    ({
      caption: '',
      reference: '',
    }) as SurfaceRefProps,
});

export type SurfaceRefBlockModel = SchemaToModel<typeof SurfaceRefBlockSchema>;
