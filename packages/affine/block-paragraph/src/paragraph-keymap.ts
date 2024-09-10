import {
  getInlineEditorByModel,
  markdownInput,
  textKeymap,
} from '@blocksuite/affine-components/rich-text';
import { ParagraphBlockSchema } from '@blocksuite/affine-model';
import { matchFlavours } from '@blocksuite/affine-shared/utils';
import { KeymapExtension } from '@blocksuite/block-std';
import { IS_MAC } from '@blocksuite/global/env';

import { forwardDelete } from './utils/forward-delete.js';
import { mergeWithPrev } from './utils/merge-with-prev.js';

export const ParagraphKeymapExtension = KeymapExtension(
  std => {
    return {
      Backspace: ctx => {
        const text = std.selection.find('text');
        if (!text) return;
        const isCollapsed = text.isCollapsed();
        const isStart = isCollapsed && text.from.index === 0;
        if (!isStart) return;

        const { doc } = std;
        const model = doc.getBlock(text.from.blockId)?.model;
        if (!model || !matchFlavours(model, ['affine:paragraph'])) return;

        // const { model, doc } = this;
        const event = ctx.get('keyboardState').raw;
        event.preventDefault();

        // When deleting at line start of a paragraph block,
        // firstly switch it to normal text, then delete this empty block.
        if (model.type !== 'text') {
          // Try to switch to normal text
          doc.captureSync();
          doc.updateBlock(model, { type: 'text' });
          return true;
        }

        const merged = mergeWithPrev(std.host, model);
        if (merged) {
          return true;
        }

        std.command.exec('dedentParagraph');
        return true;
      },
      'Mod-Enter': ctx => {
        const { doc } = std;
        const text = std.selection.find('text');
        if (!text) return;
        const model = doc.getBlock(text.from.blockId)?.model;
        if (!model || !matchFlavours(model, ['affine:paragraph'])) return;
        const inlineEditor = getInlineEditorByModel(
          std.host,
          text.from.blockId
        );
        const inlineRange = inlineEditor?.getInlineRange();
        if (!inlineRange || !inlineEditor) return;
        const raw = ctx.get('keyboardState').raw;
        raw.preventDefault();
        if (model.type === 'quote') {
          doc.captureSync();
          inlineEditor.insertText(inlineRange, '\n');
          inlineEditor.setInlineRange({
            index: inlineRange.index + 1,
            length: 0,
          });
          return true;
        }

        std.command.exec('addParagraph');
        return true;
      },
      Enter: ctx => {
        const { doc } = std;
        const text = std.selection.find('text');
        if (!text) return;
        const model = doc.getBlock(text.from.blockId)?.model;
        if (!model || !matchFlavours(model, ['affine:paragraph'])) return;
        const inlineEditor = getInlineEditorByModel(
          std.host,
          text.from.blockId
        );
        const range = inlineEditor?.getInlineRange();
        if (!range || !inlineEditor) return;

        const raw = ctx.get('keyboardState').raw;
        const isEnd = model.text.length === range.index;

        if (model.type === 'quote') {
          const textStr = model.text.toString();

          /**
           * If quote block ends with two blank lines, split the block
           * ---
           * before:
           * > \n
           * > \n|
           *
           * after:
           * > \n
           * |
           * ---
           */
          const endWithTwoBlankLines =
            textStr === '\n' || textStr.endsWith('\n');
          if (isEnd && endWithTwoBlankLines) {
            raw.preventDefault();
            doc.captureSync();
            model.text.delete(range.index - 1, 1);
            std.command.exec('addParagraph');
            return true;
          }
          return true;
        }

        raw.preventDefault();

        if (markdownInput(std, model.id)) {
          return true;
        }

        if (isEnd) {
          std.command.exec('addParagraph');
          return true;
        }

        std.command.exec('splitParagraph');
        return true;
      },
      Delete: ctx => {
        const deleted = forwardDelete(std);
        if (!deleted) {
          return;
        }
        const event = ctx.get('keyboardState').raw;
        event.preventDefault();
        return true;
      },
      'Control-d': ctx => {
        if (!IS_MAC) return;
        const deleted = forwardDelete(std);
        if (!deleted) {
          return;
        }
        const event = ctx.get('keyboardState').raw;
        event.preventDefault();
        return true;
      },
      Space: ctx => {
        if (!markdownInput(std)) {
          return;
        }
        ctx.get('keyboardState').raw.preventDefault();
        return true;
      },
      'Shift-Space': ctx => {
        if (!markdownInput(std)) {
          return;
        }
        ctx.get('keyboardState').raw.preventDefault();
        return true;
      },
      Tab: ctx => {
        const { success } = std.command.exec('indentParagraph');
        if (!success) {
          return;
        }
        ctx.get('keyboardState').raw.preventDefault();
        return true;
      },
      'Shift-Tab': ctx => {
        const { success } = std.command.exec('dedentParagraph');
        if (!success) {
          return;
        }
        ctx.get('keyboardState').raw.preventDefault();
        return true;
      },
    };
  },
  {
    flavour: ParagraphBlockSchema.model.flavour,
  }
);

export const ParagraphTextKeymapExtension = KeymapExtension(textKeymap, {
  flavour: ParagraphBlockSchema.model.flavour,
});
