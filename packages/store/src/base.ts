import type { Store } from './store';
import type { TextType } from './text-adapter';
import { Slot } from './utils/slot';

export interface IBaseBlockProps {
  flavour: string;
  type: string;
  id: string;
  children: IBaseBlockProps[];

  // TODO use schema
  text?: TextType;
}

export class BaseBlockModel implements IBaseBlockProps {
  store: Store;
  propsUpdated = new Slot();
  childrenUpdated = new Slot();
  childMap = new Map<string, number>();

  flavour!: string;
  type!: string;
  id: string;
  children: BaseBlockModel[];
  // TODO use schema
  text?: TextType;

  constructor(store: Store, props: Partial<IBaseBlockProps>) {
    this.store = store;
    this.id = props.id as string;
    this.children = [];
  }

  firstChild() {
    const children = this.children;
    if (!children?.length) {
      return null;
    }
    return children[0];
  }

  lastChild() {
    const children = this.children;
    if (!children?.length) {
      return null;
    }
    return children[children.length - 1];
  }

  dispose() {
    this.propsUpdated.dispose();
    this.childrenUpdated.dispose();
  }
}
