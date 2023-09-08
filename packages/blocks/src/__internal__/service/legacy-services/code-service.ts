import type { TextRangePoint } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { BaseBlockModel } from '@blocksuite/store';

import type {
  CodeBlockModel,
  HighlightOptionsGetter,
} from '../../../code-block/code-model.js';
import { getStandardLanguage } from '../../../code-block/utils/code-languages.js';
import {
  DARK_THEME,
  FALLBACK_LANG,
  LIGHT_THEME,
} from '../../../code-block/utils/consts.js';
import { BLOCK_ID_ATTR } from '../../consts.js';
import type {
  BlockTransformContext,
  SerializedBlock,
} from '../../utils/index.js';
import { getVirgoByModel, queryCurrentMode } from '../../utils/index.js';
import { BaseService } from '../service.js';

export class CodeBlockService extends BaseService<CodeBlockModel> {
  highlightOptionsGetter: HighlightOptionsGetter = null;

  setHighlightOptionsGetter(fn: HighlightOptionsGetter) {
    this.highlightOptionsGetter = fn;
  }

  setLang(model: CodeBlockModel, lang: string | null) {
    const standardLang = lang ? getStandardLanguage(lang) : null;
    const langName = standardLang?.id ?? FALLBACK_LANG;
    model.page.updateBlock(model, {
      language: langName,
    });
  }

  override async block2html(
    block: CodeBlockModel,
    { childText = '', begin, end }: BlockTransformContext = {}
  ): Promise<string> {
    const richTextElement = document.querySelector(
      `[${BLOCK_ID_ATTR}="${block.id}"] rich-text`
    );
    if (!richTextElement) {
      return await super.block2html(block, {
        childText,
        begin,
        end,
      });
    }
    assertExists(
      this.highlightOptionsGetter,
      'highlightOptionsGetter is not set'
    );
    const { lang, highlighter } = this.highlightOptionsGetter();
    const preElement = document.createElement('pre');
    const codeElement = document.createElement('code');
    preElement.setAttribute('code-lang', block.language);
    codeElement.innerHTML = Array.from(
      richTextElement.querySelectorAll('v-line')
    )
      .map(line => line.textContent + '\n')
      .join('');
    preElement.append(codeElement);

    if (highlighter) {
      const codeHtml = highlighter.codeToHtml(codeElement.innerHTML, {
        lang,
        theme: queryCurrentMode() === 'dark' ? DARK_THEME : LIGHT_THEME,
      });
      return codeHtml ?? preElement.outerHTML;
    } else {
      return preElement.outerHTML;
    }
  }

  override async block2markdown(block: CodeBlockModel): Promise<string> {
    return '```' + block.language + '\r\n' + block.text.toString() + '\r\n```';
  }

  override block2Json(
    block: CodeBlockModel,
    children: SerializedBlock[],
    begin?: number,
    end?: number
  ) {
    return {
      ...super.block2Json(block, children, begin, end),
      language: block.language,
    };
  }

  override async json2Block(
    focusedBlockModel: BaseBlockModel,
    pastedBlocks: SerializedBlock[],
    textRangePoint?: TextRangePoint
  ) {
    assertExists(textRangePoint);
    const texts = pastedBlocks.map(block => block.text);
    const lines = texts.map(line => line?.map(op => op.insert).join(''));
    const text = lines.join('\n');
    focusedBlockModel.text?.insert(text, textRangePoint.index);

    const vEditor = getVirgoByModel(focusedBlockModel);
    assertExists(vEditor);
    vEditor.setVRange({
      index: textRangePoint.index + textRangePoint.length,
      length: 0,
    });
  }
}
