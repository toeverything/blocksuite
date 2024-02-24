import { defineBlockSchema, type SchemaToModel } from '@blocksuite/store';

type Props = {
  columnNumber: number;
};

export const ColumnsBlockSchema = defineBlockSchema({
  flavour: 'affine:columns',
  props: (): Props => ({
    columnNumber: 2,
  }),
  metadata: {
    role: 'hub',
    version: 1,
    parent: ['affine:note'],
    children: ['affine:note'],
  },
});

export type ColumnsBlockModel = SchemaToModel<typeof ColumnsBlockSchema>;
