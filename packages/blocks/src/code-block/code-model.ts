import { BaseBlockModel, IBaseBlockProps, Page } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';
import { assertExists, getBlockById } from '../__internal__/index.js';

export class CodeBlockModel extends BaseBlockModel implements IBaseBlockProps {
  static version = [1, 0] as [number, number];
  flavour = 'affine:code' as const;
  type = 'code' as const;
  tag = literal`affine-code`;

  language = 'JavaScript';

  setLang(lang: string) {
    this.page.updateBlockById(this.id, {
      language: lang,
    });
  }

  constructor(page: Page, props: Partial<IBaseBlockProps>) {
    super(page, props);
  }

  // TODO block2html

  block2html(
    childText: string,
    _previousSiblingId: string,
    _nextSiblingId: string,
    begin?: number,
    end?: number
  ): string {
    const codeBlockElement = getBlockById(this.id);
    assertExists(codeBlockElement);
    const codeElement = codeBlockElement.querySelector('pre');
    assertExists(codeElement);
    codeElement.setAttribute('code-lang', this.language);
    return codeElement.outerHTML;
  }
}
