import { BLOCK_ID_ATTR } from '@blocksuite/global/config';
import type { BaseBlockModel } from '@blocksuite/store';
import type { DeltaOperation } from 'quill';

import { BaseService } from '../__internal__/service/index.js';
import type { OpenBlockInfo } from '../__internal__/utils/index.js';
import type { CodeBlockModel } from './code-model.js';

export class CodeBlockService extends BaseService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  hljs: any;
  onLoad = async () => {
    // @ts-ignore
    this.hljs = await import('highlight.js');
  };

  setLang(model: CodeBlockModel, lang: string) {
    model.page.updateBlock(model, { language: lang });
  }

  override block2html(
    block: CodeBlockModel,
    {
      childText = '',
      begin,
      end,
    }: {
      childText?: string;
      begin?: number;
      end?: number;
    } = {}
  ): string {
    const codeElement = document.querySelector(
      `[${BLOCK_ID_ATTR}="${block.id}"] pre`
    );
    if (!codeElement) {
      return super.block2html(block, {
        childText,
        begin,
        end,
      });
    }
    codeElement.setAttribute('code-lang', block.language);
    return codeElement.outerHTML;
  }

  override json2Block(
    focusedBlockModel: BaseBlockModel,
    pastedBlocks: OpenBlockInfo[]
  ): void {
    const pastedDelta = pastedBlocks.reduce(
      (deltas: DeltaOperation[], block) => {
        block.text && deltas.push(...block.text);
        return deltas;
      },
      []
    );

    focusedBlockModel.text?.insertList(pastedDelta, 0);
  }
}
