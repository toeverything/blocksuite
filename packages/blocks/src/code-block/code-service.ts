import { BLOCK_ID_ATTR } from '@blocksuite/global/config';

import { BaseService } from '../__internal__/service/index.js';
import type { CodeBlockModel } from './code-model.js';

export class CodeBlockService extends BaseService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  hljs: any;
  onLoad = async () => {
    // @ts-ignore
    this.hljs = await import('highlight.js');
  };

  setLang(model: CodeBlockModel, lang: string) {
    model.language = lang;
  }

  // TODO block2html

  override block2html(
    block: CodeBlockModel,
    childText: string,
    _previousSiblingId: string,
    _nextSiblingId: string,
    begin?: number,
    end?: number
  ): string {
    const codeElement = document.querySelector(
      `[${BLOCK_ID_ATTR}="${block.id}"] pre`
    );
    if (!codeElement) {
      return super.block2html(
        block,
        childText,
        _previousSiblingId,
        _nextSiblingId,
        begin,
        end
      );
    }
    codeElement.setAttribute('code-lang', block.language);
    return codeElement.outerHTML;
  }
}
