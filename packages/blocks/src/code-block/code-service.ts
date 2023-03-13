import { BLOCK_ID_ATTR } from '@blocksuite/global/config';
import type { BaseBlockModel, DeltaOperation } from '@blocksuite/store';
import { assertExists } from '@blocksuite/store';

import { BaseService } from '../__internal__/service/index.js';
import type { BlockRange, OpenBlockInfo } from '../__internal__/utils/index.js';
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

  override async json2Block(
    focusedBlockModel: BaseBlockModel,
    pastedBlocks: OpenBlockInfo[],
    range?: BlockRange
  ) {
    assertExists(range);
    const text = pastedBlocks
      .reduce((deltas: DeltaOperation[], block) => {
        block.text && deltas.push(...block.text);
        return deltas;
      }, [])
      .map(op => op.insert)
      .join('');
    focusedBlockModel.text?.insert(text, range.startOffset);
  }
}
