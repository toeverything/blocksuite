import { Store, BaseBlockModel, IBaseBlockProps } from '@blocksuite/store';

export interface TextBlockProps extends IBaseBlockProps {
  flavour: 'text';
}

export class TextBlockModel extends BaseBlockModel implements TextBlockProps {
  flavour = 'text' as const;

  constructor(store: Store, props: Partial<TextBlockProps>) {
    super(store, props);
  }
}
