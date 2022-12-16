import { BaseBlockModel, IBaseBlockProps, Page } from '@blocksuite/store';

export class CodeBlockModel extends BaseBlockModel implements IBaseBlockProps {
  static version = [1, 0] as [number, number];
  flavour = 'affine:code-block' as const;

  language = 'javascript';

  setLang(lang: string) {
    this.page.updateBlockById(this.id, {
      language: lang,
    });
  }

  constructor(page: Page, props: Partial<IBaseBlockProps>) {
    super(page, props);
  }

  // TODO block2html
}
