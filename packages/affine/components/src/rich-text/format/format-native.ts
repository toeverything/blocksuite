import type { Command } from '@blocksuite/block-std';
import type { BlockComponent } from '@blocksuite/block-std';

import { BLOCK_ID_ATTR } from '@blocksuite/affine-shared/consts';
import { INLINE_ROOT_ATTR, type InlineRootElement } from '@blocksuite/inline';

import type { AffineTextAttributes } from '../inline/index.js';

import { FORMAT_NATIVE_SUPPORT_FLAVOURS } from './consts.js';

// for native range
export const formatNativeCommand: Command<
  never,
  never,
  {
    range?: Range;
    styles: AffineTextAttributes;
    mode?: 'replace' | 'merge';
  }
> = (ctx, next) => {
  const { styles, mode = 'merge' } = ctx;

  let range = ctx.range;
  if (!range) {
    const selection = document.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    range = selection.getRangeAt(0);
  }
  if (!range) return;

  const selectedInlineEditors = Array.from<InlineRootElement>(
    ctx.std.host.querySelectorAll(`[${INLINE_ROOT_ATTR}]`)
  )
    .filter(el => range?.intersectsNode(el))
    .filter(el => {
      const block = el.closest<BlockComponent>(`[${BLOCK_ID_ATTR}]`);
      if (block) {
        return FORMAT_NATIVE_SUPPORT_FLAVOURS.includes(
          block.model.flavour as BlockSuite.Flavour
        );
      }
      return false;
    })
    .map(el => el.inlineEditor);

  selectedInlineEditors.forEach(inlineEditor => {
    const inlineRange = inlineEditor.getInlineRange();
    if (!inlineRange) return;

    inlineEditor.formatText(inlineRange, styles, {
      mode,
    });
  });

  next();
};

declare global {
  namespace BlockSuite {
    interface Commands {
      formatNative: typeof formatNativeCommand;
    }
  }
}
