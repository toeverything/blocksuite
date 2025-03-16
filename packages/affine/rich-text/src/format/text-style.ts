import {
  getBlockSelectionsCommand,
  getTextSelectionCommand,
} from '@blocksuite/affine-shared/commands';
import type { AffineTextAttributes } from '@blocksuite/affine-shared/types';
import type { Command } from '@blocksuite/block-std';
import { INLINE_ROOT_ATTR, type InlineRootElement } from '@blocksuite/inline';

import { toggleLinkPopup } from '../inline/index.js';
import { formatBlockCommand } from './format-block.js';
import { formatNativeCommand } from './format-native.js';
import { formatTextCommand } from './format-text.js';
import { getCombinedTextStyle } from './utils.js';

export const toggleTextStyleCommand: Command<{
  key: Extract<
    keyof AffineTextAttributes,
    'bold' | 'italic' | 'underline' | 'strike' | 'code'
  >;
}> = (ctx, next) => {
  const { std, key } = ctx;
  const [active] = std.command.chain().pipe(isTextStyleActive, { key }).run();

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
      chain.pipe(getTextSelectionCommand).pipe(formatTextCommand, payload),
      chain.pipe(getBlockSelectionsCommand).pipe(formatBlockCommand, payload),
      chain.pipe(formatNativeCommand, payload),
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
    const [success] = ctx.std.command
      .chain()
      .pipe(toggleTextStyleCommand, { key })
      .run();
    if (success) next();
    return false;
  };
};

export const toggleBold = toggleTextStyleCommandWrapper('bold');
export const toggleItalic = toggleTextStyleCommandWrapper('italic');
export const toggleUnderline = toggleTextStyleCommandWrapper('underline');
export const toggleStrike = toggleTextStyleCommandWrapper('strike');
export const toggleCode = toggleTextStyleCommandWrapper('code');

export const toggleLink: Command = (ctx, next) => {
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
    ctx.std,
    'create',
    inlineEditor,
    targetInlineRange,
    abortController
  );
  abortController.signal.addEventListener('abort', () => popup.remove());
  return next();
};

export const getTextStyle: Command<{}, { textStyle: AffineTextAttributes }> = (
  ctx,
  next
) => {
  const [result, innerCtx] = getCombinedTextStyle(
    ctx.std.command.chain()
  ).run();
  if (!result) {
    return false;
  }

  return next({ textStyle: innerCtx.textStyle });
};

export const isTextStyleActive: Command<{ key: keyof AffineTextAttributes }> = (
  ctx,
  next
) => {
  const key = ctx.key;
  const [result] = getCombinedTextStyle(ctx.std.command.chain())
    .pipe((ctx, next) => {
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
