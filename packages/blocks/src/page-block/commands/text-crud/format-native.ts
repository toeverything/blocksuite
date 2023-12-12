import type { Command } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { BlockElement } from '@blocksuite/lit';
import { VIRGO_ROOT_ATTR, type VirgoRootElement } from '@blocksuite/virgo';

import type { AffineTextAttributes } from '../../../_common/components/rich-text/virgo/types.js';
import { FORMAT_NATIVE_SUPPORT_FLAVOURS } from '../../../_common/configs/text-format/consts.js';
import { BLOCK_ID_ATTR } from '../../../_common/consts.js';
import type { Flavour } from '../../../models.js';

// for native range
export const formatNativeCommand: Command<
  'host',
  never,
  {
    range?: Range;
    styles: AffineTextAttributes;
    mode?: 'replace' | 'merge';
  }
> = (ctx, next) => {
  const { host, styles, mode = 'merge' } = ctx;
  assertExists(
    host,
    '`host` is required, you need to use `withHost` command before adding this command to the pipeline.'
  );

  let range = ctx.range;
  if (!range) {
    const selection = document.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    range = selection.getRangeAt(0);
  }
  if (!range) return;

  const selectedInlineEditors = Array.from<VirgoRootElement>(
    host.querySelectorAll(`[${VIRGO_ROOT_ATTR}]`)
  )
    .filter(el => range?.intersectsNode(el))
    .filter(el => {
      const blockElement = el.closest<BlockElement>(`[${BLOCK_ID_ATTR}]`);
      if (blockElement) {
        return FORMAT_NATIVE_SUPPORT_FLAVOURS.includes(
          blockElement.model.flavour as Flavour
        );
      }
      return false;
    })
    .map(el => el.inlineEditor);

  selectedInlineEditors.forEach(inlineEditor => {
    const vRange = inlineEditor.getVRange();
    if (!vRange) return;

    inlineEditor.formatText(vRange, styles, {
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
