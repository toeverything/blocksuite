import { Store, BaseBlockModel, IBaseBlockProps } from '@blocksuite/store';

type ParagraphType =
  | 'paragraph'
  | 'quote'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6';

export interface ParagraphBlockProps extends IBaseBlockProps {
  flavour: 'paragraph';
  type: ParagraphType;
}

export class ParagraphBlockModel
  extends BaseBlockModel
  implements ParagraphBlockProps
{
  flavour = 'paragraph' as const;
  type: ParagraphType = 'paragraph';

  constructor(store: Store, props: Partial<ParagraphBlockProps>) {
    super(store, props);
    this.type = props.type ?? 'text';
  }
}
