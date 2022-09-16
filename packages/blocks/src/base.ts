import type { Store } from '@building-blocks/framework';

export interface IBaseBlockModel {
  type: string;
  id: string;
  parentId: string;
}

export class BaseBlockModel implements IBaseBlockModel {
  store: Store;
  type!: string;
  id: string;
  parentId!: string;
  constructor(store: Store, props: Partial<IBaseBlockModel>) {
    this.store = store;
    this.id = props.id as string;
    this.parentId = props.parentId as string;
  }
}
