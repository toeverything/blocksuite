import type { Command } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { BlockElement } from '@blocksuite/lit';
import { VIRGO_ROOT_ATTR, type VirgoRootElement } from '@blocksuite/virgo';

import { FORMAT_NATIVE_SUPPORT_FLAVOURS } from '../../../_common/common/format/constant.js';
import type { AffineTextAttributes } from '../../../_common/components/rich-text/virgo/types.js';
import { BLOCK_ID_ATTR } from '../../../_legacy/consts.js';
import type { Flavour } from '../../../models.js';

// for native range
export const formatNativeCommand: Command<
  'root',
  never,
  {
    range?: Range;
    styles: AffineTextAttributes;
    mode?: 'replace' | 'merge';
  }
> = (ctx, next) => {
  const { root, styles, mode = 'merge' } = ctx;
  assertExists(root);

  let range = ctx.range;
  if (!range) {
    const selection = document.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    range = selection.getRangeAt(0);
  }
  if (!range) return;

  const selectedVEditors = Array.from<VirgoRootElement>(
    root.querySelectorAll(`[${VIRGO_ROOT_ATTR}]`)
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
    .map(el => el.virgoEditor);

  selectedVEditors.forEach(vEditor => {
    const vRange = vEditor.getVRange();
    if (!vRange) return;

    vEditor.formatText(vRange, styles, {
      mode,
    });
  });

  Promise.all(selectedVEditors.map(e => e.waitForUpdate())).then(() => {
    next();
  });
};

declare global {
  namespace BlockSuite {
    interface Commands {
      formatNative: typeof formatNativeCommand;
    }
  }
}
