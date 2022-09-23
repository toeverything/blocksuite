import { BaseBlockModel, Store } from '@building-blocks/store';

export class PageBlockModel extends BaseBlockModel {
  flavour = 'page' as const;
  title = '';
  constructor(store: Store, props: Partial<PageBlockModel>) {
    super(store, props);
    Object.assign(this, props);
  }
}
