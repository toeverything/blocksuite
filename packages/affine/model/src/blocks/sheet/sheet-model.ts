import type { SchemaToModel } from '@blocksuite/store';

import { defineBlockSchema } from '@blocksuite/store';

export const SheetBlockSchema = defineBlockSchema({
  flavour: 'affine:sheet',
  metadata: {
    version: 1,
    role: 'hub',
    parent: ['affine:note'],
    children: ['affine:sheet-row'],
  },
});

export const SheetRowSchema = defineBlockSchema({
  flavour: 'affine:sheet-row',
  metadata: {
    version: 1,
    role: 'hub',
    parent: ['affine:sheet'],
    children: ['affine:sheet-cell'],
  },
});

export const SheetCellSchema = defineBlockSchema({
  flavour: 'affine:sheet-cell',
  metadata: {
    version: 1,
    role: 'hub',
    parent: ['affine:sheet-row'],
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

export type SheetBlockModel = SchemaToModel<typeof SheetBlockSchema>;
export type SheetRowModel = SchemaToModel<typeof SheetRowSchema>;
export type SheetCellModel = SchemaToModel<typeof SheetCellSchema>;

declare global {
  namespace BlockSuite {
    interface BlockModels {
      'affine:sheet': SheetBlockModel;
      'affine:sheet-row': SheetRowModel;
      'affine:sheet-cell': SheetCellModel;
    }
  }
}
