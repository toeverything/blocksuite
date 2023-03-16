import { BLOCK_ID_ATTR, PREVENT_DEFAULT } from '@blocksuite/global/config';
import type { BaseBlockModel, DeltaOperation } from '@blocksuite/store';
import { assertExists } from '@blocksuite/store';

import type { KeyboardBindings } from '../__internal__/rich-text/keyboard.js';
import type { AffineVEditor } from '../__internal__/rich-text/virgo/types.js';
import { BaseService } from '../__internal__/service/index.js';
import type {
  BlockRange,
  BlockTransformContext,
  OpenBlockInfo,
} from '../__internal__/utils/index.js';
import { getVirgoByModel } from '../__internal__/utils/index.js';
import type { CodeBlockModel } from './code-model.js';

export class CodeBlockService extends BaseService<CodeBlockModel> {
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

          const lastLineBreakBeforeCursor = this.vEditor.yText
            .toString()
            .lastIndexOf('\n', range.index - 1);

          const lineStart =
            lastLineBreakBeforeCursor !== -1
              ? lastLineBreakBeforeCursor + 1
              : 0;
          this.vEditor.insertText(
            {
              index: lineStart,
              length: 0,
            },
            '  '
          );
          this.vEditor.setVRange({
            index: range.index + 2,
            length: 0,
          });

          return PREVENT_DEFAULT;
        },
      },
      shiftTab: {
        key: 'Tab',
        shiftKey: true,
        handler(range, context) {
          context.event.stopPropagation();

          const lastLineBreakBeforeCursor = this.vEditor.yText
            .toString()
            .lastIndexOf('\n', range.index - 1);

          const lineStart =
            lastLineBreakBeforeCursor !== -1
              ? lastLineBreakBeforeCursor + 1
              : 0;
          if (
            this.vEditor.yText.length >= 2 &&
            this.vEditor.yText.toString().slice(lineStart, lineStart + 2) ===
              '  '
          ) {
            this.vEditor.deleteText({
              index: lineStart,
              length: 2,
            });
            this.vEditor.setVRange({
              index: range.index - 2,
              length: 0,
            });
          }

          return PREVENT_DEFAULT;
        },
      },
    };
  }
}
