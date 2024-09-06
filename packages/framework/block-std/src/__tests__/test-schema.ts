import { defineBlockSchema, type SchemaToModel } from '@blocksuite/store';

export const RootBlockSchema = defineBlockSchema({
  flavour: 'test:page',
  props: internal => ({
    title: internal.Text(),
    count: 0,
    style: {} as Record<string, unknown>,
    items: [] as unknown[],
  }),
  metadata: {
    version: 2,
    role: 'root',
    children: ['test:note'],
  },
});

export type RootBlockModel = SchemaToModel<typeof RootBlockSchema>;

export const NoteBlockSchema = defineBlockSchema({
  flavour: 'test:note',
  props: () => ({}),
  metadata: {
    version: 1,
    role: 'hub',
    parent: ['test:page'],
    children: ['test:heading'],
  },
});

export type NoteBlockModel = SchemaToModel<typeof NoteBlockSchema>;

export const HeadingBlockSchema = defineBlockSchema({
  flavour: 'test:heading',
  props: internal => ({
    type: 'h1',
    text: internal.Text(),
  }),
  metadata: {
    version: 1,
    role: 'content',
    parent: ['test:note'],
  },
});

export type HeadingBlockModel = SchemaToModel<typeof HeadingBlockSchema>;

declare global {
  namespace BlockSuite {
    interface BlockModels {
      'test:page': RootBlockModel;
      'test:note': NoteBlockModel;
      'test:heading': HeadingBlockModel;
    }
  }
}
