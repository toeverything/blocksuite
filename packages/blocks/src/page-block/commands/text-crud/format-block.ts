import type { BlockSelection, Command } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { VIRGO_ROOT_ATTR, type VirgoRootElement } from '@blocksuite/virgo';

import type { AffineTextAttributes } from '../../../_common/components/rich-text/virgo/types.js';
import { FORMAT_BLOCK_SUPPORT_FLAVOURS } from '../../../_common/configs/text-format/consts.js';
import type { Flavour } from '../../../models.js';

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
  assertExists(
    blockSelections,
    '`blockSelections` is required, you need to pass it in args or use `getBlockSelections` command before adding this command to the pipeline.'
  );

  const root = ctx.root;
  assertExists(
    root,
    '`root` is required, you need to use `withRoot` command before adding this command to the pipeline.'
  );

  if (blockSelections.length === 0) return;

  const styles = ctx.styles;
  const mode = ctx.mode ?? 'merge';

  const success = root.std.command
    .pipe()
    .withRoot()
    .getSelectedBlocks({
      blockSelections,
      filter: el =>
        FORMAT_BLOCK_SUPPORT_FLAVOURS.includes(el.model.flavour as Flavour),
      types: ['block'],
    })
    .inline((ctx, next) => {
      const { selectedBlocks } = ctx;
      assertExists(selectedBlocks);

      const selectedVEditors = selectedBlocks.flatMap(el => {
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

      next();
    })
    .run();

  if (success) next();
};

declare global {
  namespace BlockSuite {
    interface Commands {
      formatBlock: typeof formatBlockCommand;
    }
  }
}
