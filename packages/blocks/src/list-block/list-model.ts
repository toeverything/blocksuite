import { type SchemaToModel, defineBlockSchema } from '@blocksuite/store';

export type ListType = 'bulleted' | 'numbered' | 'todo' | 'toggle';

declare const BackwardUndefined: unique symbol;
/**
 * The `collapsed` property may be `undefined` due to legacy data,
 * but you should not manually set it to undefined.
 */
type ListCollapsed = boolean | typeof BackwardUndefined;

export const ListBlockSchema = defineBlockSchema({
  flavour: 'affine:list',
  metadata: {
    parent: [
      'affine:note',
      'affine:database',
      'affine:list',
      'affine:paragraph',
      'affine:edgeless-text',
    ],
    role: 'content',
    version: 1,
  },
  props: internal => ({
    checked: false,
    collapsed: false as ListCollapsed,
    text: internal.Text(),
    type: 'bulleted' as ListType,
  }),
});

export type ListBlockModel = SchemaToModel<typeof ListBlockSchema>;
