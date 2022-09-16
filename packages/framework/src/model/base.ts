import type { Store } from './store';

export interface IBaseBlockModel {
  type: string;
  id: string;
}

export class BaseBlockModel implements IBaseBlockModel {
  store: Store;
  type!: string;
  id: string;
  constructor(store: Store, props: Partial<IBaseBlockModel>) {
    this.store = store;
    this.id = props.id as string;
  }
}
