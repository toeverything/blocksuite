import {
  defineBlockSchema,
  type SchemaToModel,
  type Text,
} from '@blocksuite/store';

export type ParagraphType =
  | 'text'
  | 'quote'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6';

export type ParagraphProps = {
  type: ParagraphType;
  text: Text;
};

export const ParagraphBlockSchema = defineBlockSchema({
  flavour: 'affine:paragraph',
  props: (internal): ParagraphProps => ({
    type: 'text',
    text: internal.Text(),
  }),
  metadata: {
    version: 1,
    role: 'content',
    parent: [
      'affine:note',
      'affine:database',
      'affine:paragraph',
      'affine:list',
      'affine:edgeless-text',
    ],
  },
});

export type ParagraphBlockModel = SchemaToModel<typeof ParagraphBlockSchema>;

declare global {
  namespace BlockSuite {
    interface BlockModels {
      'affine:paragraph': ParagraphBlockModel;
    }
  }
}
