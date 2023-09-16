import type { Command } from '@blocksuite/block-std';
import type { BlockSuiteRoot } from '@blocksuite/lit';
import { VIRGO_ROOT_ATTR, type VirgoRootElement } from '@blocksuite/virgo';

import { clearMarksOnDiscontinuousInput } from '../../../__internal__/utils/virgo.js';
import { FORMAT_TEXT_SUPPORT_FLAVOURS } from '../../../common/format/config.js';
import type { AffineTextAttributes } from '../../../components/rich-text/virgo/types.js';
import type { Flavour } from '../../../models.js';
import { getSelectedContentBlockElements } from '../../utils/selection.js';

// for text selection
export const formatTextCommand: Command<
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

  const textSelection = root.selection.find('text');
  if (!textSelection) return;

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

  await Promise.all(selectedElements.map(el => el.updateComplete));

  root.rangeManager?.syncTextSelectionToRange(textSelection);

  await next();
};

declare global {
  namespace BlockSuite {
    interface Commands {
      formatText: typeof formatTextCommand;
    }
  }
}
