import type { TextSelection } from '@blocksuite/block-std';
import { assertExists, matchFlavours } from '@blocksuite/global/utils';
import type { BlockElement } from '@blocksuite/lit';

import { LinkMockSelection } from '../../../../__internal__/rich-text/link-node/mock-selection.js';
import type { AffineTextAttributes } from '../../../../__internal__/rich-text/virgo/types.js';
import {
  getEditorContainer,
  getVirgoByModel,
} from '../../../../__internal__/utils/query.js';
import { getCurrentNativeRange } from '../../../../__internal__/utils/selection.js';
import { clearMarksOnDiscontinuousInput } from '../../../../__internal__/utils/virgo.js';
import { showLinkPopover } from '../../../../components/link-popover/index.js';
import { getSelectedContentModels } from '../../selection.js';

export function formatByTextSelection(
  blockElement: BlockElement,
  textSelection: TextSelection,
  key: keyof Omit<AffineTextAttributes, 'link' | 'reference'>,
  value: string | true | null
) {
  const selectedModels = getSelectedContentModels(blockElement, ['text']);

  if (selectedModels.length === 0) {
    throw new Error('No selected models');
  }

  const rangeManager = blockElement.root.rangeManager;
  assertExists(rangeManager);
  const { from, to } = textSelection;
  const startModel = selectedModels[0];
  const endModel = selectedModels[selectedModels.length - 1];
  // edge case 1: collapsed range
  if (textSelection.isCollapsed()) {
    // Collapsed range

    const vEditor = getVirgoByModel(startModel);
    const delta = vEditor?.getDeltaByRangeIndex(from.index);
    if (!vEditor || !delta) return;
    vEditor.setMarks({
      ...vEditor.marks,
      [key]:
        (vEditor.marks && vEditor.marks[key]) ||
        (delta.attributes && delta.attributes[key])
          ? null
          : value,
    });
    clearMarksOnDiscontinuousInput(vEditor);

    return;
  }

  // edge case 2: same model
  if (textSelection.isInSameBlock()) {
    if (matchFlavours(startModel, ['affine:code'])) return;
    const vEditor = getVirgoByModel(startModel);
    vEditor?.slots.updated.once(() => {
      rangeManager.syncTextSelectionToRange(textSelection);
    });
    startModel.text?.format(from.index, from.length, {
      [key]: value,
    });
    return;
  }
  // common case
  // format start model
  if (!matchFlavours(startModel, ['affine:code'])) {
    startModel.text?.format(from.index, from.length, {
      [key]: value,
    });
  }
  // format end model
  if (!matchFlavours(endModel, ['affine:code'])) {
    endModel.text?.format(to?.index ?? 0, to?.length ?? 0, {
      [key]: value,
    });
  }
  // format between models
  selectedModels
    .slice(1, -1)
    .filter(model => !matchFlavours(model, ['affine:code']))
    .forEach(model => {
      model.text?.format(0, model.text.length, {
        [key]: value,
      });
    });

  const allTextUpdated = selectedModels
    .filter(model => !matchFlavours(model, ['affine:code']))
    .map(
      model =>
        // We can not use `onModelTextUpdated` here because it is asynchronous, which
        // will make updated event emit before we observe it.
        new Promise(resolve => {
          const vEditor = getVirgoByModel(model);
          vEditor?.slots.updated.once(() => {
            resolve(vEditor);
          });
        })
    );

  Promise.all(allTextUpdated).then(() => {
    rangeManager.syncTextSelectionToRange(textSelection);
  });
}

export function toggleLink(
  blockElement: BlockElement,
  textSelection: TextSelection
) {
  if (textSelection.isCollapsed()) {
    return;
  }

  if (!textSelection.isInSameBlock()) {
    return;
  }

  const selectedModel = getSelectedContentModels(blockElement, ['text']);
  if (selectedModel.length === 0) {
    return;
  }

  const [model] = selectedModel;
  const page = blockElement.page;
  const vEditor = getVirgoByModel(model);
  assertExists(vEditor);

  const vRange = textSelection.from;
  const format = vEditor.getFormat(vRange);

  if (format.link) {
    page.captureSync();
    vEditor.formatText(vRange, { link: null });
    vEditor.setVRange(vRange);
    return;
  }

  const createMockSelection = () => {
    const range = getCurrentNativeRange();
    const rects = Array.from(range.getClientRects());
    const container = getEditorContainer(page);
    const containerRect = container.getBoundingClientRect();
    const mockSelection = new LinkMockSelection(
      rects.map(
        rect =>
          new DOMRect(
            rect.left - containerRect.left,
            rect.top - containerRect.top,
            rect.width,
            rect.height
          )
      )
    );
    container.appendChild(mockSelection);

    return () => {
      container.removeChild(mockSelection);
    };
  };

  const clear = createMockSelection();
  showLinkPopover({
    anchorEl: vEditor.rootElement,
    model,
  }).then(linkState => {
    if (linkState.type !== 'confirm') {
      clear();
      return;
    }

    const link = linkState.link;

    clear();
    page.captureSync();
    vEditor.formatText(vRange, { link });
    vEditor.setVRange(vRange);
  });
}
