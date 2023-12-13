import type { Command, TextSelection } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { INLINE_ROOT_ATTR, type InlineRootElement } from '@blocksuite/inline';

import type { AffineTextAttributes } from '../../../_common/components/rich-text/inline/types.js';
import { FORMAT_TEXT_SUPPORT_FLAVOURS } from '../../../_common/configs/text-format/consts.js';
import { clearMarksOnDiscontinuousInput } from '../../../_common/utils/inline-editor.js';
import type { Flavour } from '../../../models.js';

// for text selection
export const formatTextCommand: Command<
  'currentTextSelection' | 'host',
  never,
  {
    textSelection?: TextSelection;
    styles: AffineTextAttributes;
    mode?: 'replace' | 'merge';
  }
> = (ctx, next) => {
  const { host, styles, mode = 'merge' } = ctx;
  assertExists(
    host,
    '`host` is required, you need to use `withHost` command before adding this command to the pipeline.'
  );

  const textSelection = ctx.textSelection ?? ctx.currentTextSelection;
  assertExists(
    textSelection,
    '`textSelection` is required, you need to pass it in args or use `getTextSelection` command before adding this command to the pipeline.'
  );

  const success = host.std.command
    .pipe()
    .withHost()
    .getSelectedBlocks({
      textSelection,
      filter: el =>
        FORMAT_TEXT_SUPPORT_FLAVOURS.includes(el.model.flavour as Flavour),
      types: ['text'],
    })
    .inline((ctx, next) => {
      const { selectedBlocks } = ctx;
      assertExists(selectedBlocks);

      const selectedInlineEditors = selectedBlocks.flatMap(el => {
        const inlineRoot = el.querySelector<
          InlineRootElement<AffineTextAttributes>
        >(`[${INLINE_ROOT_ATTR}]`);
        if (inlineRoot && inlineRoot.inlineEditor.getInlineRange()) {
          return inlineRoot.inlineEditor;
        }
        return [];
      });

      selectedInlineEditors.forEach(inlineEditor => {
        const inlineRange = inlineEditor.getInlineRange();
        if (!inlineRange) return;

        if (inlineRange.length === 0) {
          const delta = inlineEditor.getDeltaByRangeIndex(inlineRange.index);
          if (!delta) return;

          inlineEditor.setMarks({
            ...inlineEditor.marks,
            ...Object.fromEntries(
              Object.entries(styles).map(([key, value]) => {
                if (typeof value === 'boolean') {
                  return [
                    key,
                    (inlineEditor.marks &&
                      inlineEditor.marks[key as keyof AffineTextAttributes]) ||
                    (delta.attributes &&
                      delta.attributes[key as keyof AffineTextAttributes])
                      ? null
                      : value,
                  ];
                }
                return [key, value];
              })
            ),
          });
          clearMarksOnDiscontinuousInput(inlineEditor);
        } else {
          inlineEditor.formatText(inlineRange, styles, {
            mode,
          });
        }
      });

      Promise.all(selectedBlocks.map(el => el.updateComplete)).then(() => {
        host.rangeManager?.syncTextSelectionToRange(textSelection);
      });

      next();
    })
    .run();

  if (success) next();
};

declare global {
  namespace BlockSuite {
    interface Commands {
      formatText: typeof formatTextCommand;
    }
  }
}
