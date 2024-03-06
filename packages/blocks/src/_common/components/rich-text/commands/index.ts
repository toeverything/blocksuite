import type { Command } from '@blocksuite/block-std';
import { INLINE_ROOT_ATTR, type InlineRootElement } from '@blocksuite/inline';

import type { AffineTextAttributes } from '../../../inline/presets/affine-inline-specs.js';
import { toggleLinkPopup } from '../../../inline/presets/nodes/link-node/link-popup/toggle-link-popup.js';
import { getTextStyleCommand } from './utils.js';

export const toggleBold: Command = getTextStyleCommand('bold');
export const toggleItalic: Command = getTextStyleCommand('italic');
export const toggleUnderline: Command = getTextStyleCommand('underline');
export const toggleStrike: Command = getTextStyleCommand('strike');
export const toggleCode: Command = getTextStyleCommand('code');

export const toggleLink: Command = (_ctx, next) => {
  const selection = document.getSelection();
  if (!selection || selection.rangeCount === 0) return false;

  const range = selection.getRangeAt(0);
  const inlineRoot = range.commonAncestorContainer.parentElement?.closest<
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

export const registerTextStyleCommands = (std: BlockSuite.Std) => {
  std.command
    .add('toggleBold', toggleBold)
    .add('toggleItalic', toggleItalic)
    .add('toggleUnderline', toggleUnderline)
    .add('toggleStrike', toggleStrike)
    .add('toggleCode', toggleCode)
    .add('toggleLink', toggleLink);
};

declare global {
  namespace BlockSuite {
    interface Commands {
      toggleBold: typeof toggleBold;
      toggleItalic: typeof toggleItalic;
      toggleUnderline: typeof toggleUnderline;
      toggleStrike: typeof toggleStrike;
      toggleCode: typeof toggleCode;
      toggleLink: typeof toggleLink;
    }
  }
}
