import {
  BlockModel,
  BlockSchemaExtension,
  defineBlockSchema,
} from '@blocksuite/store';

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

export const RootBlockSchemaExtension = BlockSchemaExtension(RootBlockSchema);

export class RootBlockModel extends BlockModel<
  ReturnType<(typeof RootBlockSchema)['model']['props']>
> {}

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

export const NoteBlockSchemaExtension = BlockSchemaExtension(NoteBlockSchema);

export class NoteBlockModel extends BlockModel<
  ReturnType<(typeof NoteBlockSchema)['model']['props']>
> {}

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

export const HeadingBlockSchemaExtension =
  BlockSchemaExtension(HeadingBlockSchema);

export class HeadingBlockModel extends BlockModel<
  ReturnType<(typeof HeadingBlockSchema)['model']['props']>
> {}
