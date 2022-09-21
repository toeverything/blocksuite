import { Store, BaseBlockModel, IBaseBlockProps } from '@building-blocks/store';

export interface ListBlockProps extends IBaseBlockProps {
  flavour: 'list';
  text: string;
}

export class ListBlockModel extends BaseBlockModel implements ListBlockProps {
  flavour = 'list' as const;
  text = '';

  constructor(store: Store, props: Partial<ListBlockProps>) {
    super(store, props);
    this.text = props.text as string;
  }
}
