import type { AsyncServiceProtocol } from '../__internal__/index.js';
import { BLOCK_ID_ATTR } from '../__internal__/index.js';
import type { CodeBlockModel } from './code-model.js';
import { BaseService } from '../__internal__/service.js';

export class CodeBlockService
  extends BaseService
  implements AsyncServiceProtocol
{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  hljs: any;
  isLoaded = false;
  load = async () => {
    // @ts-ignore
    this.hljs = await import('highlight.js');
  };

  // TODO block2html

  block2html(
    model: CodeBlockModel,
    childText: string,
    _previousSiblingId: string,
    _nextSiblingId: string,
    begin?: number,
    end?: number
  ): string {
    const codeElement = document.querySelector(
      `[${BLOCK_ID_ATTR}="${model.id}"] pre`
    );
    if (!codeElement) {
      return super.block2html(
        model,
        childText,
        _previousSiblingId,
        _nextSiblingId,
        begin,
        end
      );
    }
    codeElement.setAttribute('code-lang', model.language);
    return codeElement.outerHTML;
  }
}

export default CodeBlockService;
