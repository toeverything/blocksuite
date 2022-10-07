import { Store, BaseBlockModel, IBaseBlockProps } from '@blocksuite/store';

type ParagraphType = 'text' | 'h1' | 'h2' | 'h3' | 'quote';

export interface ParagraphBlockProps extends IBaseBlockProps {
  flavour: 'paragraph';
  type: ParagraphType;
}

export class ParagraphBlockModel
  extends BaseBlockModel
  implements ParagraphBlockProps
{
  flavour = 'paragraph' as const;
  type: ParagraphType = 'text';

  constructor(store: Store, props: Partial<ParagraphBlockProps>) {
    super(store, props);
    this.type = props.type ?? 'text';
  }
}
