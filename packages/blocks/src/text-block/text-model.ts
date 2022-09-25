import { Store, BaseBlockModel, IBaseBlockProps } from '@blocksuite/store';

export interface TextBlockProps extends IBaseBlockProps {
  flavour: 'text';
  text: string;
}

export class TextBlockModel extends BaseBlockModel implements TextBlockProps {
  flavour = 'text' as const;
  text = '';

  constructor(store: Store, props: Partial<TextBlockProps>) {
    super(store, props);
    this.text = props.text as string;
  }
}
