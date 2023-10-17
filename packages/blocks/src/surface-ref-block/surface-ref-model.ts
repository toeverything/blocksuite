import { defineBlockSchema, type SchemaToModel } from '@blocksuite/store';

import type { XYWH } from '../index.js';

export type SurfaceRefProps = {
  reference: string;
  viewport?: XYWH;
};

export const SurfaceRefBlockSchema = defineBlockSchema({
  flavour: 'affine:surface-ref',
  props: () => ({
    reference: '',
  }),
  metadata: {
    version: 1,
    role: 'hub',
    parent: ['affine:page'],
  },
});

export type SurfaceRefBlockModel = SchemaToModel<typeof SurfaceRefBlockSchema>;
