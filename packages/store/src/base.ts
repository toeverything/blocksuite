import type { Store } from './store';

export interface IBaseBlockProps {
  flavour: string;
  id: string;
  children: IBaseBlockProps[];
}

export class BaseBlockModel implements IBaseBlockProps {
  store: Store;
  flavour!: string;
  id: string;
  children: BaseBlockModel[];
  constructor(store: Store, props: Partial<IBaseBlockProps>) {
    this.store = store;
    this.id = props.id as string;
    this.children = [];
  }
}
