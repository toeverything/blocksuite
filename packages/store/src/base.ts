import type { Store } from './store';
import { Slot } from './utils/slot';

export interface IBaseBlockProps {
  flavour: string;
  id: string;
  children: IBaseBlockProps[];
}

export class BaseBlockModel implements IBaseBlockProps {
  store: Store;
  propsUpdated = new Slot();
  childrenUpdated = new Slot();
  childMap = new Map<string, number>();

  flavour!: string;
  id: string;
  children: BaseBlockModel[];
  constructor(store: Store, props: Partial<IBaseBlockProps>) {
    this.store = store;
    this.id = props.id as string;
    this.children = [];
  }

  dispose() {
    this.propsUpdated.dispose();
    this.childrenUpdated.dispose();
  }
}
