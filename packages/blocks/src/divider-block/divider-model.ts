import { type SchemaToModel, defineBlockSchema } from '@blocksuite/store';

export const DividerBlockSchema = defineBlockSchema({
  flavour: 'affine:divider',
  metadata: {
    children: [],
    role: 'content',
    version: 1,
  },
});

export type DividerBlockModel = SchemaToModel<typeof DividerBlockSchema>;
