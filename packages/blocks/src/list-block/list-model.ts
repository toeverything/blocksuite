import { Store, BaseBlockModel, IBaseBlockProps } from '@blocksuite/store';

export interface ListBlockProps extends IBaseBlockProps {
  flavour: 'list';
}

export class ListBlockModel extends BaseBlockModel implements ListBlockProps {
  flavour = 'list' as const;

  constructor(store: Store, props: Partial<ListBlockProps>) {
    super(store, props);
  }
}
