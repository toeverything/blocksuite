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

  block2html(childText: string, begin?: number, end?: number) {
    const delta = this.text?.sliceToDelta(begin || 0, end);
    const text = delta.reduce((html: string, item: Record<string, unknown>) => {
      return html + this._deltaLeaf2Html(item);
    }, '');
    return `${text}${childText}`;
  }

  private _deltaLeaf2Html(deltaLeaf: Record<string, unknown>) {
    const text = deltaLeaf.insert;
    const attributes: Record<string, boolean> = deltaLeaf.attributes as Record<
      string,
      boolean
    >;
    if (!attributes) {
      return text;
    }
    if (attributes.bold) {
      return `<strong>${text}</strong>`;
    }
    if (attributes.italic) {
      return `<em>${text}</em>`;
    }
    if (attributes.underline) {
      return `<u>${text}</u>`;
    }
    if (attributes.inlinecode) {
      return `<code>${text}</code>`;
    }
    if (attributes.strikethrough) {
      return `<s>${text}</s>`;
    }
    return text;
  }

  dispose() {
    this.propsUpdated.dispose();
    this.childrenUpdated.dispose();
  }
}
