import type { BlockSelection, Command } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { type InlineRootElement, VIRGO_ROOT_ATTR } from '@blocksuite/virgo';

import type { AffineTextAttributes } from '../../../_common/components/rich-text/inline/types.js';
import { FORMAT_BLOCK_SUPPORT_FLAVOURS } from '../../../_common/configs/text-format/consts.js';
import type { Flavour } from '../../../models.js';

// for block selection
export const formatBlockCommand: Command<
  'currentBlockSelections' | 'host',
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

  const host = ctx.host;
  assertExists(
    host,
    '`host` is required, you need to use `withHost` command before adding this command to the pipeline.'
  );

  if (blockSelections.length === 0) return;

  const styles = ctx.styles;
  const mode = ctx.mode ?? 'merge';

  const success = host.std.command
    .pipe()
    .withHost()
    .getSelectedBlocks({
      blockSelections,
      filter: el =>
        FORMAT_BLOCK_SUPPORT_FLAVOURS.includes(el.model.flavour as Flavour),
      types: ['block'],
    })
    .inline((ctx, next) => {
      const { selectedBlocks } = ctx;
      assertExists(selectedBlocks);

      const selectedInlineEditors = selectedBlocks.flatMap(el => {
        const vRoot = el.querySelector<InlineRootElement<AffineTextAttributes>>(
          `[${VIRGO_ROOT_ATTR}]`
        );
        if (vRoot) {
          return vRoot.inlineEditor;
        }
        return [];
      });

      selectedInlineEditors.forEach(inlineEditor => {
        inlineEditor.formatText(
          {
            index: 0,
            length: inlineEditor.yTextLength,
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
