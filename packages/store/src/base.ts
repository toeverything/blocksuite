import type { Page } from './workspace';
import type { TextType } from './text-adapter';
import { Signal } from './utils/signal';

export interface IBaseBlockProps {
  flavour: string;
  type: string;
  id: string;
  children: IBaseBlockProps[];

  // TODO use schema
  text?: TextType;
}

export class BaseBlockModel implements IBaseBlockProps {
  page: Page;
  propsUpdated = new Signal();
  childrenUpdated = new Signal();
  childMap = new Map<string, number>();

  flavour!: string;
  type!: string;
  id: string;
  children: BaseBlockModel[];
  // TODO use schema
  text?: TextType;
  sourceId?: string;

  constructor(page: Page, props: Partial<IBaseBlockProps>) {
    this.page = page;
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

  lastChild(): BaseBlockModel | null {
    if (!this.children.length) {
      return this;
    }
    return this.children[this.children.length - 1].lastChild();
  }

  block2html(
    childText: string,
    _previousSiblingId: string,
    _nextSiblingId: string,
    begin?: number,
    end?: number
  ) {
    const delta = this.text?.sliceToDelta(begin || 0, end);
    const text = delta.reduce((html: string, item: Record<string, unknown>) => {
      return html + this._deltaLeaf2Html(item);
    }, '');
    return `${text}${childText}`;
  }

  block2Text(childText: string, begin?: number, end?: number) {
    const text = (this.text?.toString() || '').slice(begin || 0, end);
    return `${text}${childText}`;
  }

  _deltaLeaf2Html(deltaLeaf: Record<string, unknown>) {
    let text = deltaLeaf.insert;
    const attributes: Record<string, boolean> = deltaLeaf.attributes as Record<
      string,
      boolean
    >;
    if (!attributes) {
      return text;
    }
    if (attributes.code) {
      text = `<code>${text}</code>`;
    }
    if (attributes.bold) {
      text = `<strong>${text}</strong>`;
    }
    if (attributes.italic) {
      text = `<em>${text}</em>`;
    }
    if (attributes.underline) {
      text = `<u>${text}</u>`;
    }
    if (attributes.strikethrough) {
      text = `<s>${text}</s>`;
    }
    if (attributes.link) {
      text = `<a href='${attributes.link}'>${text}</a>`;
    }
    return text;
  }

  dispose() {
    this.propsUpdated.dispose();
    this.childrenUpdated.dispose();
  }
}
