import type { Command } from '@blocksuite/block-std';
import type { BlockSuiteRoot } from '@blocksuite/lit';
import { VIRGO_ROOT_ATTR, type VirgoRootElement } from '@blocksuite/virgo';

import { FORMAT_BLOCK_SUPPORT_FLAVOURS } from '../../../common/format/config.js';
import type { AffineTextAttributes } from '../../../components/rich-text/virgo/types.js';
import type { Flavour } from '../../../models.js';
import { getSelectedContentBlockElements } from '../../utils/selection.js';

// for block selection
export const formatBlockCommand: Command<
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

  const blockSelections = root.selection.filter('block');
  if (blockSelections.length === 0) return;

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

  await Promise.all(selectedElements.map(el => el.updateComplete));
  await next();
};

declare global {
  namespace BlockSuite {
    interface Commands {
      formatBlock: typeof formatBlockCommand;
    }
  }
}
