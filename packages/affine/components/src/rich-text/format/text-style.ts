import type { AffineTextAttributes } from '@blocksuite/affine-shared/types';
import type { Command } from '@blocksuite/block-std';

import { INLINE_ROOT_ATTR, type InlineRootElement } from '@blocksuite/inline';

import { toggleLinkPopup } from '../inline/index.js';
import { getCombinedTextStyle } from './utils.js';

export const toggleTextStyleCommand: Command<
  never,
  never,
  {
    key: Extract<
      keyof AffineTextAttributes,
      'bold' | 'italic' | 'underline' | 'strike' | 'code'
    >;
  }
> = (ctx, next) => {
  const { std, key } = ctx;
  const [active] = std.command.chain().isTextStyleActive({ key }).run();

  const payload: {
    styles: AffineTextAttributes;
    mode?: 'replace' | 'merge';
  } = {
    styles: {
      [key]: active ? null : true,
    },
  };

  const [result] = std.command
    .chain()
    .try(chain => [
      chain.getTextSelection().formatText(payload),
      chain.getBlockSelections().formatBlock(payload),
      chain.formatNative(payload),
    ])
    .run();

  if (result) {
    return next();
  }

  return false;
};

const toggleTextStyleCommandWrapper = (
  key: Extract<
    keyof AffineTextAttributes,
    'bold' | 'italic' | 'underline' | 'strike' | 'code'
  >
): Command => {
  return (ctx, next) => {
    const { success } = ctx.std.command.exec('toggleTextStyle', { key });
    if (success) next();
    return false;
  };
};

export const toggleBold = toggleTextStyleCommandWrapper('bold');
export const toggleItalic = toggleTextStyleCommandWrapper('italic');
export const toggleUnderline = toggleTextStyleCommandWrapper('underline');
export const toggleStrike = toggleTextStyleCommandWrapper('strike');
export const toggleCode = toggleTextStyleCommandWrapper('code');

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
