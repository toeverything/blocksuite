import type { Command } from '@blocksuite/block-std';

import { INLINE_ROOT_ATTR, type InlineRootElement } from '@blocksuite/inline';

import type { AffineTextAttributes } from '../extension/index.js';

import { toggleLinkPopup } from '../inline/index.js';
import { generateTextStyleCommand, getCombinedTextStyle } from './utils.js';

export const toggleBold: Command = generateTextStyleCommand('bold');
export const toggleItalic: Command = generateTextStyleCommand('italic');
export const toggleUnderline: Command = generateTextStyleCommand('underline');
export const toggleStrike: Command = generateTextStyleCommand('strike');
export const toggleCode: Command = generateTextStyleCommand('code');

export const toggleLink: Command = (_ctx, next) => {
  const selection = document.getSelection();
  if (!selection || selection.rangeCount === 0) return false;

  const range = selection.getRangeAt(0);
  if (range.collapsed) return false;
  const inlineRoot = range.startContainer.parentElement?.closest<
    InlineRootElement<AffineTextAttributes>
  >(`[${INLINE_ROOT_ATTR}]`);
  if (!inlineRoot) return false;

  const inlineEditor = inlineRoot.inlineEditor;
  const targetInlineRange = inlineEditor.getInlineRange();

  if (!targetInlineRange || targetInlineRange.length === 0) return false;

  const format = inlineEditor.getFormat(targetInlineRange);
  if (format.link) {
    inlineEditor.formatText(targetInlineRange, { link: null });
    return next();
  }

  const abortController = new AbortController();
  const popup = toggleLinkPopup(
    inlineEditor,
    'create',
    targetInlineRange,
    abortController
  );
  abortController.signal.addEventListener('abort', () => popup.remove());
  return next();
};

export const getTextStyle: Command<never, 'textStyle'> = (ctx, next) => {
  const [result, innerCtx] = getCombinedTextStyle(
    ctx.std.command.chain()
  ).run();
  if (!result) {
    return false;
  }

  return next({ textStyle: innerCtx.textStyle });
};

export const isTextStyleActive: Command<
  never,
  never,
  { key: keyof AffineTextAttributes }
> = (ctx, next) => {
  const key = ctx.key;
  const [result] = getCombinedTextStyle(ctx.std.command.chain())
    .inline((ctx, next) => {
      const { textStyle } = ctx;

      if (textStyle && key in textStyle) {
        return next();
      }

      return false;
    })
    .run();

  if (!result) {
    return false;
  }

  return next();
};
