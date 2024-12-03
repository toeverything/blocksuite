import { defineBlockSchema, type SchemaToModel } from '@blocksuite/store';

export const RowBlockSchema = defineBlockSchema({
  flavour: 'affine:row',
  metadata: {
    version: 1,
    role: 'hub',
    parent: ['affine:microsheet'],
    children: ['affine:cell'],
  },
});

export type RowBlockModel = SchemaToModel<typeof RowBlockSchema>;

declare global {
  namespace BlockSuite {
    interface BlockModels {
      'affine:row': RowBlockModel;
    }
  }
}
