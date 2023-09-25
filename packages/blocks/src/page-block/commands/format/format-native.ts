import type { Command } from '@blocksuite/block-std';
import type { BlockElement, BlockSuiteRoot } from '@blocksuite/lit';
import { VIRGO_ROOT_ATTR, type VirgoRootElement } from '@blocksuite/virgo';

import { BLOCK_ID_ATTR } from '../../../__internal__/consts.js';
import { FORMAT_NATIVE_SUPPORT_FLAVOURS } from '../../../common/format/constant.js';
import type { AffineTextAttributes } from '../../../components/rich-text/virgo/types.js';
import type { Flavour } from '../../../models.js';

// for native range
export const formatNativeCommand: Command<
  never,
  never,
  {
    root: BlockSuiteRoot;
    styles: AffineTextAttributes;
    mode?: 'replace' | 'merge';
  }
> = async (ctx, next) => {
  const root = ctx.root;
  const styles = ctx.styles;
  const mode = ctx.mode ?? 'merge';

  const selectedVEditors = Array.from<VirgoRootElement>(
    root.querySelectorAll(`[${VIRGO_ROOT_ATTR}]`)
  )
    .filter(el => {
      const selection = document.getSelection();
      if (!selection || selection.rangeCount === 0) return false;
      const range = selection.getRangeAt(0);

      return range.intersectsNode(el);
    })
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

  await Promise.all(selectedVEditors.map(e => e.waitForUpdate()));
  next();
};

declare global {
  namespace BlockSuite {
    interface Commands {
      formatNative: typeof formatNativeCommand;
    }
  }
}
