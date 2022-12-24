import { BaseBlockModel, IBaseBlockProps, Page } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

export class CodeBlockModel extends BaseBlockModel implements IBaseBlockProps {
  static version = [1, 0] as [number, number];
  flavour = 'affine:code' as const;
  type = 'code' as const;
  tag = literal`affine-code`;

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
