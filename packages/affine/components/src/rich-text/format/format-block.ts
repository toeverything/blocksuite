import type { BlockSelection, Command } from '@blocksuite/block-std';

import { assertExists } from '@blocksuite/global/utils';
import { INLINE_ROOT_ATTR, type InlineRootElement } from '@blocksuite/inline';

import type { AffineTextAttributes } from '../extension/index.js';

import { FORMAT_BLOCK_SUPPORT_FLAVOURS } from './consts.js';

// for block selection
export const formatBlockCommand: Command<
  'currentBlockSelections',
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

  if (blockSelections.length === 0) return;

  const styles = ctx.styles;
  const mode = ctx.mode ?? 'merge';

  const success = ctx.std.command
    .chain()
    .getSelectedBlocks({
      blockSelections,
      filter: el =>
        FORMAT_BLOCK_SUPPORT_FLAVOURS.includes(
          el.model.flavour as BlockSuite.Flavour
        ),
      types: ['block'],
    })
    .inline((ctx, next) => {
      const { selectedBlocks } = ctx;
      assertExists(selectedBlocks);

      const selectedInlineEditors = selectedBlocks.flatMap(el => {
        const inlineRoot = el.querySelector<
          InlineRootElement<AffineTextAttributes>
        >(`[${INLINE_ROOT_ATTR}]`);
        if (inlineRoot) {
          return inlineRoot.inlineEditor;
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
