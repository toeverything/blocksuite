import type { TextSelection } from '@blocksuite/block-std';
import { assertExists, matchFlavours } from '@blocksuite/store';

import { LinkMockSelection } from '../../../__internal__/rich-text/link-node/mock-selection.js';
import type { AffineTextAttributes } from '../../../__internal__/rich-text/virgo/types.js';
import {
  getEditorContainer,
  getVirgoByModel,
} from '../../../__internal__/utils/query.js';
import { getCurrentNativeRange } from '../../../__internal__/utils/selection.js';
import { clearMarksOnDiscontinuousInput } from '../../../__internal__/utils/virgo.js';
import { showLinkPopover } from '../../../components/link-popover/index.js';
import type { PageBlockComponent } from '../../types.js';
import { getSelectedContentModels } from '../selection.js';

/**
 * Merge format of multiple blocks. Format will be active only when all blocks have the same format.
 *
 * Used for format quick bar.
 */
function mergeFormat(
  formatArr: AffineTextAttributes[],
  loose: boolean
): AffineTextAttributes {
  if (!formatArr.length) {
    return {};
  }
  if (loose) {
    return formatArr.reduce((acc, cur) => ({ ...acc, ...cur }));
  }
  return formatArr.reduce((acc, cur) => {
    const newFormat: AffineTextAttributes = {};
    for (const key in acc) {
      const typedKey = key as keyof AffineTextAttributes;
      if (acc[typedKey] === cur[typedKey]) {
        // This cast is secure because we have checked that the value of the key is the same.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        newFormat[typedKey] = acc[typedKey] as any;
      }
    }
    return newFormat;
  });
}

/**
 * By default, it is in `strict` mode, which only returns the formats that all the text in the range share.
 * formats with different values, such as different links, are considered different formats.
 *
 * If the `loose` mode is enabled, any format that exists in the range will be returned.
 * formats with different values will only return the last one.
 */
export function getCombinedFormat(
  pageElement: PageBlockComponent,
  textSelection: TextSelection,
  loose = false
): AffineTextAttributes {
  const selectedModel = getSelectedContentModels(pageElement);
  if (selectedModel.length === 0) {
    return {};
  }

  if (selectedModel.length === 1) {
    const vEditor = getVirgoByModel(selectedModel[0]);
    assertExists(vEditor);
    const format = vEditor.getFormat(
      {
        index: textSelection.from.index,
        length: textSelection.from.length,
      },
      loose
    );
    return format;
  }
  const formatArr = [];
  // Start block
  // Skip code block or empty block
  const startModel = selectedModel[0];
  if (
    !matchFlavours(startModel, ['affine:code']) &&
    startModel.text &&
    startModel.text.length
  ) {
    const vEditor = getVirgoByModel(startModel);
    assertExists(vEditor);
    const startFormat = vEditor.getFormat(
      {
        index: textSelection.from.index,
        length: textSelection.from.length,
      },
      loose
    );
    formatArr.push(startFormat);
  }
  // End block
  const endModel = selectedModel[selectedModel.length - 1];
  if (
    !matchFlavours(endModel, ['affine:code']) &&
    endModel.text &&
    endModel.text.length
  ) {
    const vEditor = getVirgoByModel(endModel);
    assertExists(vEditor);
    const endFormat = vEditor.getFormat(
      {
        index: 0,
        length: textSelection.to?.length ?? 0,
      },
      loose
    );
    formatArr.push(endFormat);
  }
  // Between blocks
  selectedModel
    .slice(1, -1)
    .filter(model => !matchFlavours(model, ['affine:code']))
    .filter(model => model.text && model.text.length)
    .forEach(model => {
      const vEditor = getVirgoByModel(model);
      assertExists(vEditor);
      const format = vEditor.getFormat({
        index: 0,
        length: vEditor.yText.length - 1,
      });
      formatArr.push(format);
    }, loose);

  return mergeFormat(formatArr, loose);
}

export function getCurrentCombinedFormat(
  pageElement: PageBlockComponent,
  textSelection: TextSelection,
  loose = false
): AffineTextAttributes {
  return getCombinedFormat(pageElement, textSelection, loose);
}

function formatTextSelection(
  pageElement: PageBlockComponent,
  textSelection: TextSelection,
  key: keyof Omit<AffineTextAttributes, 'link' | 'reference'>
) {
  const selectedModels = getSelectedContentModels(pageElement);

  if (selectedModels.length === 0) {
    throw new Error('No selected models');
  }

  const rangeManager = pageElement.rangeManager;
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
          : true,
    });
    clearMarksOnDiscontinuousInput(vEditor);

    return;
  }
  const format = getCombinedFormat(pageElement, textSelection);

  // edge case 2: same model
  if (textSelection.isInSameBlock()) {
    if (matchFlavours(startModel, ['affine:code'])) return;
    const vEditor = getVirgoByModel(startModel);
    vEditor?.slots.updated.once(() => {
      rangeManager.syncTextSelectionToRange(textSelection);
    });
    startModel.text?.format(from.index, from.length, {
      [key]: format[key] ? null : true,
    });
    return;
  }
  // common case
  // format start model
  if (!matchFlavours(startModel, ['affine:code'])) {
    startModel.text?.format(from.index, from.length, {
      [key]: format[key] ? null : true,
    });
  }
  // format end model
  if (!matchFlavours(endModel, ['affine:code'])) {
    endModel.text?.format(to?.index ?? 0, to?.length ?? 0, {
      [key]: format[key] ? null : true,
    });
  }
  // format between models
  selectedModels
    .slice(1, -1)
    .filter(model => !matchFlavours(model, ['affine:code']))
    .forEach(model => {
      model.text?.format(0, model.text.length, {
        [key]: format[key] ? null : true,
      });
    });

  // Native selection maybe shifted after format
  // We need to restore it manually
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

export function handleFormat(
  pageElement: PageBlockComponent,
  textSelection: TextSelection,
  key: keyof Omit<AffineTextAttributes, 'link' | 'reference'>
) {
  pageElement.page.captureSync();
  formatTextSelection(pageElement, textSelection, key);
}

export function toggleLink(
  pageElement: PageBlockComponent,
  textSelection: TextSelection
) {
  if (textSelection.isCollapsed()) {
    return;
  }

  if (!textSelection.isInSameBlock()) {
    return;
  }

  const selectedModel = getSelectedContentModels(pageElement);
  if (selectedModel.length === 0) {
    return;
  }

  const [model] = selectedModel;
  const page = pageElement.page;
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
    if (linkState.type !== 'confirm') return;

    const link = linkState.link;

    clear();
    page.captureSync();
    vEditor.formatText(vRange, { link });
    vEditor.setVRange(vRange);
  });
}
