import type { BlockSelection, Command } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { VIRGO_ROOT_ATTR, type VirgoRootElement } from '@blocksuite/virgo';

import type { AffineTextAttributes } from '../../../_common/components/rich-text/virgo/types.js';
import { FORMAT_BLOCK_SUPPORT_FLAVOURS } from '../../../common/format/constant.js';
import type { Flavour } from '../../../models.js';
import { getSelectedContentBlockElements } from '../../utils/selection.js';

// for block selection
export const formatBlockCommand: Command<
  'currentBlockSelections' | 'root',
  never,
  {
    blockSelections?: BlockSelection[];
    styles: AffineTextAttributes;
    mode?: 'replace' | 'merge';
  }
> = (ctx, next) => {
  const blockSelections = ctx.blockSelections ?? ctx.currentBlockSelections;
  if (!blockSelections) return;
  const root = ctx.root;
  assertExists(root);

  if (blockSelections.length === 0) return;

  const styles = ctx.styles;
  const mode = ctx.mode ?? 'merge';

  const selectedElements = getSelectedContentBlockElements(root, [
    'block',
  ]).filter(el =>
    FORMAT_BLOCK_SUPPORT_FLAVOURS.includes(el.model.flavour as Flavour)
  );
  if (selectedElements.length === 0) return;

  const selectedVEditors = selectedElements.flatMap(el => {
    const vRoot = el.querySelector<VirgoRootElement<AffineTextAttributes>>(
      `[${VIRGO_ROOT_ATTR}]`
    );
    if (vRoot) {
      return vRoot.virgoEditor;
    }
    return [];
  });

  selectedVEditors.forEach(vEditor => {
    vEditor.formatText(
      {
        index: 0,
        length: vEditor.yTextLength,
      },
      styles,
      {
        mode,
      }
    );
  });

  Promise.all(selectedElements.map(el => el.updateComplete)).then(() => {
    next();
  });
};

declare global {
  namespace BlockSuite {
    interface Commands {
      formatBlock: typeof formatBlockCommand;
    }
  }
}
