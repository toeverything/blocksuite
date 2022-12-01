import { BaseBlockModel, Page } from '@blocksuite/store';

export class PageBlockModel extends BaseBlockModel {
  flavour = 'affine:page' as const;
  title = '';
  constructor(page: Page, props: Partial<PageBlockModel>) {
    super(page, props);
    this.title = props.title ?? '';
  }

  override block2html(
    childText: string,
    previousSiblingId: string,
    nextSiblingId: string,
    begin?: number,
    end?: number
  ) {
    return `<div>${this.title}${childText}</div>`;
  }

  override block2Text(childText: string, begin?: number, end?: number) {
    const text = (this.title || '').slice(begin || 0, end);
    return `${text}${childText}`;
  }
}
