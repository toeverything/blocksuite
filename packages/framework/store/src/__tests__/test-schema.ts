import { type SchemaToModel, defineBlockSchema } from '../schema/index.js';

export const RootBlockSchema = defineBlockSchema({
  flavour: 'affine:page',
  metadata: {
    role: 'root',
    version: 2,
  },
  props: internal => ({
    count: 0,
    items: [] as unknown[],
    style: {} as Record<string, unknown>,
    title: internal.Text(),
  }),
});

export type RootBlockModel = SchemaToModel<typeof RootBlockSchema>;

export const NoteBlockSchema = defineBlockSchema({
  flavour: 'affine:note',
  metadata: {
    children: [
      'affine:paragraph',
      'affine:list',
      'affine:code',
      'affine:divider',
      'affine:database',
      'affine:data-view',
      'affine:image',
      'affine:note-block-*',
      'affine:bookmark',
      'affine:attachment',
      'affine:surface-ref',
      'affine:embed-*',
    ],
    parent: ['affine:page'],
    role: 'hub',
    version: 1,
  },
  props: () => ({}),
});

export const ParagraphBlockSchema = defineBlockSchema({
  flavour: 'affine:paragraph',
  metadata: {
    parent: [
      'affine:note',
      'affine:database',
      'affine:paragraph',
      'affine:list',
    ],
    role: 'content',
    version: 1,
  },
  props: internal => ({
    text: internal.Text(),
    type: 'text',
  }),
});

export const ListBlockSchema = defineBlockSchema({
  flavour: 'affine:list',
  metadata: {
    parent: [
      'affine:note',
      'affine:database',
      'affine:list',
      'affine:paragraph',
    ],
    role: 'content',
    version: 1,
  },
  props: internal => ({
    checked: false,
    collapsed: false,
    text: internal.Text(),
    type: 'bulleted',
  }),
});

export const DividerBlockSchema = defineBlockSchema({
  flavour: 'affine:divider',
  metadata: {
    children: [],
    role: 'content',
    version: 1,
  },
});
