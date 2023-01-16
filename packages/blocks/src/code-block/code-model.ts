import { BaseBlockModel, Page } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';
import { BLOCK_ID_ATTR } from '../__internal__/utils/consts.js';

export class CodeBlockModel
  extends BaseBlockModel<BlockSuiteModelProps.CodeBlockModel>
  implements BlockSuiteModelProps.CodeBlockModel
{
  static version = 1;
  flavour = 'affine:code' as const;
  type = 'code' as const;
  tag = literal`affine-code`;

  language: string;

  setLang(lang: string) {
    this.page.updateBlockById(this.id, {
      language: lang,
    });
  }

  constructor(
    page: Page,
    props: PropsWithId<Partial<BlockSuiteModelProps.CodeBlockModel>>
  ) {
    super(page, props);
    this.language = props.language ?? 'JavaScript';
  }

  // TODO block2html

  block2html(
    childText: string,
    _previousSiblingId: string,
    _nextSiblingId: string,
    begin?: number,
    end?: number
  ): string {
    const codeElement = document.querySelector(
      `[${BLOCK_ID_ATTR}="${this.id}"] pre`
    );
    if (!codeElement) {
      return super.block2html(
        childText,
        _previousSiblingId,
        _nextSiblingId,
        begin,
        end
      );
    }
    codeElement.setAttribute('code-lang', this.language);
    return codeElement.outerHTML;
  }
}
