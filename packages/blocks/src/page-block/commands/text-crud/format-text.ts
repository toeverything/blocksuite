import type { Command, TextSelection } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { VIRGO_ROOT_ATTR, type VirgoRootElement } from '@blocksuite/virgo';

import type { AffineTextAttributes } from '../../../_common/components/rich-text/virgo/types.js';
import { FORMAT_TEXT_SUPPORT_FLAVOURS } from '../../../_common/configs/text-format/consts.js';
import { clearMarksOnDiscontinuousInput } from '../../../_common/utils/virgo.js';
import type { Flavour } from '../../../models.js';
import { getSelectedContentBlockElements } from '../../utils/selection.js';

// for text selection
export const formatTextCommand: Command<
  'currentTextSelection' | 'root',
  never,
  {
    textSelection?: TextSelection;
    styles: AffineTextAttributes;
    mode?: 'replace' | 'merge';
  }
> = (ctx, next) => {
  const { root, styles, mode = 'merge' } = ctx;
  assertExists(
    root,
    '`root` is required, you need to use `withRoot` command before adding this command to the pipeline.'
  );

  const textSelection = ctx.textSelection ?? ctx.currentTextSelection;
  assertExists(
    textSelection,
    '`textSelection` is required, you need to pass it in args or use `getTextSelection` command before adding this command to the pipeline.'
  );

  const selectedElements = getSelectedContentBlockElements(root, [
    'text',
  ]).filter(el =>
    FORMAT_TEXT_SUPPORT_FLAVOURS.includes(el.model.flavour as Flavour)
  );

  const selectedVEditors = selectedElements.flatMap(el => {
    const vRoot = el.querySelector<VirgoRootElement<AffineTextAttributes>>(
      `[${VIRGO_ROOT_ATTR}]`
    );
    if (vRoot && vRoot.virgoEditor.getVRange()) {
      return vRoot.virgoEditor;
    }
    return [];
  });

  selectedVEditors.forEach(vEditor => {
    const vRange = vEditor.getVRange();
    if (!vRange) return;

    if (vRange.length === 0) {
      const delta = vEditor.getDeltaByRangeIndex(vRange.index);
      if (!delta) return;

      vEditor.setMarks({
        ...vEditor.marks,
        ...Object.fromEntries(
          Object.entries(styles).map(([key, value]) => {
            if (typeof value === 'boolean') {
              return [
                key,
                (vEditor.marks &&
                  vEditor.marks[key as keyof AffineTextAttributes]) ||
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
      clearMarksOnDiscontinuousInput(vEditor);
    } else {
      vEditor.formatText(vRange, styles, {
        mode,
      });
    }
  });

  Promise.all(selectedElements.map(el => el.updateComplete)).then(() => {
    root.rangeManager?.syncTextSelectionToRange(textSelection);
  });

  next();
};

declare global {
  namespace BlockSuite {
    interface Commands {
      formatText: typeof formatTextCommand;
    }
  }
}
