import type { Store } from './store';

export interface IBaseBlockModel {
  flavour: string;
  id: string;
}

export class BaseBlockModel implements IBaseBlockModel {
  store: Store;
  flavour!: string;
  id: string;
  constructor(store: Store, props: Partial<IBaseBlockModel>) {
    this.store = store;
    this.id = props.id as string;
  }
}
