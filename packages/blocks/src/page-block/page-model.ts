import { BaseBlockModel, Store } from '@blocksuite/store';

export class PageBlockModel extends BaseBlockModel {
  flavour = 'page' as const;
  title = '';
  constructor(store: Store, props: Partial<PageBlockModel>) {
    super(store, props);
    this.title = props.title ?? '';
  }

  override block2html(
    childText: string,
    previousSiblingId: string,
    nextSiblingId: string,
    begin?: number,
    end?: number
  ) {
    return `<h1>${this.title}</h1>${childText}`;
  }

  override block2markdown(
    childText: string,
    previousSiblingId: string,
    nextSiblingId: string,
    begin?: number,
    end?: number
  ) {
    return `# ${this.title}\n\n${childText}`;
  }
}
