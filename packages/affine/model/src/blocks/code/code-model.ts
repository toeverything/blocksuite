import { type SchemaToModel, defineBlockSchema } from '@blocksuite/store';

export const FALLBACK_LANG = 'Plain Text';

export const CodeBlockSchema = defineBlockSchema({
  flavour: 'affine:code',
  props: internal => ({
    text: internal.Text(),
    language: FALLBACK_LANG,
    wrap: false,
    caption: '',
  }),
  metadata: {
    version: 1,
    role: 'content',
    parent: [
      'affine:note',
      'affine:paragraph',
      'affine:list',
      'affine:edgeless-text',
    ],
    children: [],
  },
});

export type CodeBlockModel = SchemaToModel<typeof CodeBlockSchema>;

declare global {
  namespace BlockSuite {
    interface BlockModels {
      'affine:code': CodeBlockModel;
    }
  }
}
