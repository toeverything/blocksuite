import {
  BlockModel,
  BlockSchemaExtension,
  defineBlockSchema,
  type Text,
} from '@blocksuite/store';

interface CodeBlockProps {
  text: Text;
  language: string | null;
  wrap: boolean;
  caption: string;
}

export const CodeBlockSchema = defineBlockSchema({
  flavour: 'affine:code',
  props: internal =>
    ({
      text: internal.Text(),
      language: null,
      wrap: false,
      caption: '',
    }) as CodeBlockProps,
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
  toModel: () => new CodeBlockModel(),
});

export const CodeBlockSchemaExtension = BlockSchemaExtension(CodeBlockSchema);

export class CodeBlockModel extends BlockModel<CodeBlockProps> {}
