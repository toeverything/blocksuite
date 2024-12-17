import { BlockModel, defineBlockSchema, type Text } from '@blocksuite/store';

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
  collapsed: boolean;
};

export const ParagraphBlockSchema = defineBlockSchema({
  flavour: 'affine:paragraph',
  props: (internal): ParagraphProps => ({
    type: 'text',
    text: internal.Text(),
    collapsed: false,
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
  toModel: () => new ParagraphBlockModel(),
});

export class ParagraphBlockModel extends BlockModel<ParagraphProps> {
  override flavour!: 'affine:paragraph';

  override text!: Text;

  constructor() {
    super();

    this.propsUpdated.on(({ key }) => {
      if (key === 'type') {
        if (!this.type.startsWith('h')) {
          this.collapsed = false;
        }
      }
    });
  }
}

declare global {
  namespace BlockSuite {
    interface BlockModels {
      'affine:paragraph': ParagraphBlockModel;
    }
  }
}
