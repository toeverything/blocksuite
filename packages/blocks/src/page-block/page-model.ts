import { BaseBlockModel, Store } from '@blocksuite/store';

export class PageBlockModel extends BaseBlockModel {
  flavour = 'page' as const;
  title = '';
  constructor(store: Store, props: Partial<PageBlockModel>) {
    super(store, props);
    this.title = props.title ?? '';
  }
}
