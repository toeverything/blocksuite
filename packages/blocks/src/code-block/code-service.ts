import { BLOCK_ID_ATTR, PREVENT_DEFAULT } from '@blocksuite/global/config';
import type { BaseBlockModel } from '@blocksuite/store';
import { assertExists } from '@blocksuite/store';

import type { KeyboardBindings } from '../__internal__/rich-text/keyboard.js';
import type { AffineVEditor } from '../__internal__/rich-text/virgo/types.js';
import { BaseService } from '../__internal__/service/index.js';
import type {
  BlockRange,
  BlockTransformContext,
  SerializedBlock,
} from '../__internal__/utils/index.js';
import { getVirgoByModel } from '../__internal__/utils/index.js';
import type { CodeBlockModel } from './code-model.js';
import { getStandardLanguage } from './utils/code-languages.js';
import { FALLBACK_LANG } from './utils/consts.js';

const INDENT_SYMBOL = '  ';
const LINE_BREAK_SYMBOL = '\n';
const allIndexOf = (
  text: string,
  symbol: string,
  start = 0,
  end = text.length
) => {
  const indexArr: number[] = [];
  let i = start;

  while (i < end) {
    const index = text.indexOf(symbol, i);
    if (index === -1 || index > end) {
      break;
    }
    indexArr.push(index);
    i = index + 1;
  }
  return indexArr;
};

export class CodeBlockService extends BaseService<CodeBlockModel> {
  setLang(model: CodeBlockModel, lang: string | null) {
    const standardLang = getStandardLanguage(lang);
    const langName = standardLang?.id ?? FALLBACK_LANG;
    model.page.updateBlock(model, {
      language: langName,
    });
  }

  override block2html(
    block: CodeBlockModel,
    { childText = '', begin, end }: BlockTransformContext = {}
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
    pastedBlocks: SerializedBlock[],
    range?: BlockRange
  ) {
    assertExists(range);
    const texts = pastedBlocks.map(block => block.text);
    const lines = texts.map(line => line?.map(op => op.insert).join(''));
    const text = lines.join('\n');
    focusedBlockModel.text?.insert(text, range.startOffset);

    const vEditor = getVirgoByModel(focusedBlockModel);
    assertExists(vEditor);
    vEditor.setVRange({
      index: range.startOffset + text.length,
      length: 0,
    });
  }

  override defineKeymap(
    block: CodeBlockModel,
    virgo: AffineVEditor
  ): KeyboardBindings {
    const keymap = super.defineKeymap(block, virgo);

    return {
      ...keymap,
      tab: {
        key: 'Tab',
        handler(range, context) {
          context.event.stopPropagation();
          const text = this.vEditor.yText.toString();
          const index = text.lastIndexOf(LINE_BREAK_SYMBOL, range.index - 1);
          const indexArr = allIndexOf(
            text,
            LINE_BREAK_SYMBOL,
            range.index,
            range.index + range.length
          )
            .map(i => i + 1)
            .reverse();
          if (index !== -1) {
            indexArr.push(index + 1);
          } else {
            indexArr.push(0);
          }
          indexArr.forEach(i => {
            this.vEditor.insertText(
              {
                index: i,
                length: 0,
              },
              INDENT_SYMBOL
            );
          });
          this.vEditor.setVRange({
            index: range.index + 2,
            length: range.length + (indexArr.length - 1) * INDENT_SYMBOL.length,
          });

          return PREVENT_DEFAULT;
        },
      },
      shiftTab: {
        key: 'Tab',
        shiftKey: true,
        handler: function (range, context) {
          context.event.stopPropagation();
          const text = this.vEditor.yText.toString();
          const index = text.lastIndexOf(LINE_BREAK_SYMBOL, range.index - 1);
          let indexArr = allIndexOf(
            text,
            LINE_BREAK_SYMBOL,
            range.index,
            range.index + range.length
          )
            .map(i => i + 1)
            .reverse();
          if (index !== -1) {
            indexArr.push(index + 1);
          } else {
            indexArr.push(0);
          }
          indexArr = indexArr.filter(
            i => text.slice(i, i + 2) === INDENT_SYMBOL
          );
          indexArr.forEach(i => {
            this.vEditor.deleteText({
              index: i,
              length: 2,
            });
          });
          if (indexArr.length > 0) {
            this.vEditor.setVRange({
              index:
                range.index -
                (indexArr[indexArr.length - 1] < range.index ? 2 : 0),
              length:
                range.length - (indexArr.length - 1) * INDENT_SYMBOL.length,
            });
          }

          return PREVENT_DEFAULT;
        },
      },
    };
  }
}
