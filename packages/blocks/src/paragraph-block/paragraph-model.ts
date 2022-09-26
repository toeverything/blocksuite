import { Store, BaseBlockModel, IBaseBlockProps } from '@blocksuite/store';

export interface ParagraphBlockProps extends IBaseBlockProps {
  flavour: 'paragraph';
}

export class ParagraphBlockModel
  extends BaseBlockModel
  implements ParagraphBlockProps
{
  flavour = 'paragraph' as const;

  constructor(store: Store, props: Partial<ParagraphBlockProps>) {
    super(store, props);
  }
}
