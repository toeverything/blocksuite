import { defineBlockSchema, type SchemaToModel } from '@blocksuite/store';

export const CellBlockSchema = defineBlockSchema({
  flavour: 'affine:cell',
  metadata: {
    version: 1,
    role: 'hub',
    parent: ['affine:row'],
    children: [
      'affine:paragraph',
      'affine:list',
      'affine:code',
      'affine:divider',
      'affine:image',
      'affine:bookmark',
      'affine:attachment',
      'affine:surface-ref',
      'affine:embed-*',
    ],
  },
});

export type CellBlockModel = SchemaToModel<typeof CellBlockSchema>;

declare global {
  namespace BlockSuite {
    interface BlockModels {
      'affine:cell': CellBlockModel;
    }
  }
}
