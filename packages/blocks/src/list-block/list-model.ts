import { Store, BaseBlockModel, type IBaseBlockProps } from '@blocksuite/store';

type ListType = 'bulleted' | 'numbered' | 'todo';

export interface ListBlockProps extends IBaseBlockProps {
  flavour: 'list';
  type: ListType;
}

export class ListBlockModel extends BaseBlockModel implements ListBlockProps {
  flavour = 'list' as const;
  type: ListType;

  constructor(store: Store, props: Partial<ListBlockProps>) {
    super(store, props);
    this.type = props.type ?? 'bulleted';
  }
}
