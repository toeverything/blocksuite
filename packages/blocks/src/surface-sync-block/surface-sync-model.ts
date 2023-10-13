import { defineBlockSchema, type SchemaToModel } from '@blocksuite/store';

import type { XYWH } from '../index.js';

export type SurfaceSyncProps = {
  reference: string;
  viewport?: XYWH;
};

export const SurfaceSyncBlockSchema = defineBlockSchema({
  flavour: 'affine:surface-sync',
  props: () => ({
    reference: '',
  }),
  metadata: {
    version: 1,
    role: 'content',
    parent: ['affine:note'],
  },
});

export type SurfaceSyncBlockModel = SchemaToModel<
  typeof SurfaceSyncBlockSchema
>;
