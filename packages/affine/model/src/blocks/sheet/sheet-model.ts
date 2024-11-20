import type { SchemaToModel, Text } from '@blocksuite/store';

import { defineBlockSchema } from '@blocksuite/store';

export interface SheetProps {
  text: Text;
  checked: boolean;
  collapsed: boolean;
  order: number | null;
}

export const SheetBlockSchema = defineBlockSchema({
  flavour: 'affine:sheet',
  props: internal =>
    ({
      text: internal.Text(),
      checked: false,
      collapsed: false,
      order: null,
    }) as SheetProps,
  metadata: {
    version: 1,
    role: 'content',
    parent: [
      'affine:note',
      'affine:database',
      'affine:sheet',
      'affine:paragraph',
      'affine:edgeless-text',
    ],
  },
});

export type SheetBlockModel = SchemaToModel<typeof SheetBlockSchema>;

declare global {
  namespace BlockSuite {
    interface BlockModels {
      'affine:sheet': SheetBlockModel;
    }
  }
}
