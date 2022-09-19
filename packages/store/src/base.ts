import type { Store } from './store';

export interface IBaseBlockProps {
  flavour: string;
  id: string;
  children: string[];
}

export class BaseBlockModel implements IBaseBlockProps {
  store: Store;
  flavour!: string;
  id: string;
  children: string[];
  constructor(store: Store, props: Partial<IBaseBlockProps>) {
    this.store = store;
    this.id = props.id as string;
    this.children = props?.children || [];
  }
}
