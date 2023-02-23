import { getServiceOrRegister } from '@blocksuite/blocks';
import { assertExists, assertFlavours } from '@blocksuite/global/utils';
import { BaseBlockModel, Page, Text } from '@blocksuite/store';
import type { TextAttributes } from '@blocksuite/virgo';

import {
  almostEqual,
  ExtendedModel,
  TopLevelBlockModel,
} from '../../__internal__/index.js';
import { asyncFocusRichText } from '../../__internal__/utils/common-operations.js';
import {
  getBlockElementByModel,
  getModelByElement,
  getModelsByRange,
  getParentBlockById,
  getQuillIndexByNativeSelection,
  getRichTextByModel,
} from '../../__internal__/utils/query.js';
import {
  getCurrentRange,
  updateBlockRange,
} from '../../__internal__/utils/selection.js';
import {
  hasNativeSelection,
  isCollapsedNativeSelection,
  isMultiBlockRange,
  isRangeNativeSelection,
  resetNativeSelection,
  restoreSelection,
  saveBlockRange,
} from '../../__internal__/utils/selection.js';
import type { BlockSchema, ParagraphBlockModel } from '../../models.js';
import type { DefaultSelectionManager } from '../default/selection-manager.js';
import { DEFAULT_SPACING } from '../edgeless/utils.js';

export function deleteModelsByRange(page: Page, range = getCurrentRange()) {
  const models = getModelsByRange(range);

  const first = models[0];
  const firstRichText = getRichTextByModel(first);
  const last = models[models.length - 1];
  const lastRichText = getRichTextByModel(last);
  assertExists(firstRichText);
  assertExists(lastRichText);

  const firstTextIndex = getQuillIndexByNativeSelection(
    range.startContainer,
    range.startOffset,
    true
  );
  const endTextIndex = getQuillIndexByNativeSelection(
    range.endContainer,
    range.endOffset,
    false
  );

  // Only select one block
  if (models.length === 1) {
    firstRichText.model.text?.delete(
      firstTextIndex,
      endTextIndex - firstTextIndex
    );
    return;
  }

  const isFirstRichTextNotEmpty =
    firstRichText.model.text &&
    firstRichText.model.text.length !== firstTextIndex;
  // See https://github.com/toeverything/blocksuite/issues/283
  if (isFirstRichTextNotEmpty) {
    firstRichText.model.text?.delete(
      firstTextIndex,
      firstRichText.model.text.length - firstTextIndex
    );
  }
  const isLastRichTextFullSelected: boolean =
    lastRichText.model.text?.length === endTextIndex;
  if (!isLastRichTextFullSelected) {
    lastRichText.model.text?.delete(0, endTextIndex);
    firstRichText.model.text?.join(lastRichText.model.text as Text);
  }

  // delete models in between
  for (let i = 1; i <= models.length - 1; i++) {
    page.deleteBlock(models[i]);
  }

  firstRichText.quill.setSelection(firstTextIndex, 0);
}

function mergeToCodeBlocks(page: Page, models: BaseBlockModel[]) {
  const parent = page.getParent(models[0]);
  assertExists(parent);
  const index = parent.children.indexOf(models[0]);
  const text = models
    .map(model => {
      if (model.text instanceof Text) {
        return model.text.toString();
      }
      return null;
    })
    .filter(Boolean)
    .join('\n');
  models.map(model => page.deleteBlock(model));

  const id = page.addBlockByFlavour(
    'affine:code',
    { text: new Text(text) },
    parent,
    index
  );
  return id;
}

export async function updateSelectedTextType(
  flavour: keyof BlockSchema,
  type?: string
) {
  const range = getCurrentRange();
  const modelsInRange = getModelsByRange(range);
  updateBlockType(modelsInRange, flavour, type);
}

export async function updateBlockType(
  models: BaseBlockModel[],
  flavour: keyof BlockSchema,
  type?: string
) {
  if (!models.length) {
    return;
  }
  const page = models[0].page;
  const hasSamePage = models.every(model => model.page === page);
  if (!hasSamePage) {
    // page check
    console.error(
      'Not all models have the same page instanceof, the result for update text type may not be correct',
      models
    );
  }
  page.captureSync();
  const savedBlockRange = saveBlockRange();
  if (flavour === 'affine:code') {
    const id = mergeToCodeBlocks(page, models);
    const model = page.getBlockById(id);
    if (!model) {
      throw new Error('Failed to get model after merge code block!');
    }
    requestAnimationFrame(() =>
      restoreSelection({
        startModel: model,
        endModel: model,
        startOffset: 0,
        endOffset: 0,
        betweenModels: [],
      })
    );
    return;
  }
  // The lastNewId will not be null since we have checked models.length > 0
  let lastNewId: string | null = null;
  models.forEach(model => {
    assertFlavours(model, ['affine:paragraph', 'affine:list', 'affine:code']);
    if (model.flavour === flavour) {
      page.updateBlock(model, { type });
    } else {
      const newId = transformBlock(model, flavour, type);
      const newModel = page.getBlockById(newId);
      if (!newModel) {
        throw new Error('Failed to get new model after transform block!');
      }
      updateBlockRange(savedBlockRange, model, newModel);
      lastNewId = newId;
    }
  });
  models.forEach(async model => {
    if (model.flavour === 'affine:paragraph' && type) {
      const service = await getServiceOrRegister(model.flavour);
      service.updateTypeEffect(model as ParagraphBlockModel, type);
    }
  });

  // Focus last new block
  if (lastNewId) await asyncFocusRichText(page, lastNewId);
  restoreSelection(savedBlockRange);
}

function transformBlock(model: BaseBlockModel, flavour: string, type?: string) {
  const page = model.page;
  const parent = page.getParent(model);
  assertExists(parent);
  const blockProps = {
    flavour,
    type,
    text: model?.text?.clone(), // should clone before `deleteBlock`
    children: model.children,
  };
  const index = parent.children.indexOf(model);
  page.deleteBlock(model);
  const id = page.addBlock(blockProps, parent, index);
  return id;
}

/**
 * Do nothing when selection is collapsed or not multi block selected
 */
export function handleMultiBlockBackspace(page: Page, e: KeyboardEvent) {
  if (!hasNativeSelection()) return;
  if (isCollapsedNativeSelection()) return;
  if (!isMultiBlockRange()) return;

  e.preventDefault();
  deleteModelsByRange(page);
}

export const getFormat = (
  models = getModelsByRange(getCurrentRange())
): TextAttributes => {
  if (!models.length) {
    return {};
  }
  if (models.length === 1) {
    const richText = getRichTextByModel(models[0]);
    assertExists(richText);
    const { quill } = richText;
    const range = quill.getSelection();
    assertExists(range);
    const format = quill.getFormat(range);
    return format;
  }
  const selection = window.getSelection();
  const first = models[0];
  const last = models[models.length - 1];
  const firstRichText = getRichTextByModel(first);
  const lastRichText = getRichTextByModel(last);
  assertExists(firstRichText);
  assertExists(lastRichText);
  assertExists(selection);

  const firstIndex = getQuillIndexByNativeSelection(
    selection.anchorNode,
    selection.anchorOffset,
    true
  );
  const endIndex = getQuillIndexByNativeSelection(
    selection.focusNode,
    selection.focusOffset,
    false
  );
  const firstFormat = firstRichText.quill.getFormat(
    firstIndex,
    firstRichText.quill.getLength() - firstIndex - 1
  );
  const lastFormat = lastRichText.quill.getFormat(0, endIndex);

  const formatArr = [];
  !(models[0].flavour === 'affine:code') && formatArr.push(firstFormat);
  !(models[models.length - 1].flavour === 'affine:code') &&
    formatArr.push(lastFormat);
  for (let i = 1; i < models.length - 1; i++) {
    const richText = getRichTextByModel(models[i]);
    assertExists(richText);
    const content = richText.quill.getText();
    if (!content || content === '\n') {
      // empty line should not be included
      continue;
    }
    if (models[i].flavour === 'affine:code') {
      continue;
    }
    const format = richText.quill.getFormat(0, richText.quill.getLength() - 1);
    formatArr.push(format);
  }
  // const allFormat = formatArr.every(item => item[key]);
  const allFormat = formatArr.reduce((acc, cur) => {
    const newFormat: Record<string, unknown> = {};
    for (const key in acc) {
      if (acc[key] === cur[key]) {
        newFormat[key] = acc[key];
      }
    }
    return newFormat;
  });
  return allFormat;
};

function formatModelsByRange(
  models: BaseBlockModel[],
  page: Page,
  key: keyof TextAttributes
) {
  const selection = window.getSelection();
  const selectedBlocks = saveBlockRange();
  const first = models[0];
  const last = models[models.length - 1];
  const firstRichText = getRichTextByModel(first);
  const lastRichText = getRichTextByModel(last);
  assertExists(firstRichText);
  assertExists(lastRichText);
  assertExists(selection);

  const firstIndex = getQuillIndexByNativeSelection(
    selection.anchorNode,
    selection.anchorOffset,
    true
  );
  const endIndex = getQuillIndexByNativeSelection(
    selection.focusNode,
    selection.focusOffset,
    false
  );
  const isFormatActive = getFormat()[key];
  page.captureSync();
  firstRichText.model.text?.format(
    firstIndex,
    firstRichText.quill.getLength() - firstIndex - 1,
    { [key]: !isFormatActive }
  );
  lastRichText.model.text?.format(0, endIndex, { [key]: !isFormatActive });

  for (let i = 1; i < models.length - 1; i++) {
    const richText = getRichTextByModel(models[i]);
    assertExists(richText);
    richText.model.text?.format(0, richText.quill.getLength() - 1, {
      [key]: !isFormatActive,
    });
  }
  restoreSelection(selectedBlocks);
}

export function handleFormat(page: Page, key: keyof TextAttributes) {
  if (!hasNativeSelection()) return;

  if (isRangeNativeSelection()) {
    const models = getModelsByRange(getCurrentRange()).filter(model => {
      return !(model.flavour === 'affine:code');
    });
    if (models.length === 1) {
      const richText = getRichTextByModel(models[0]);
      assertExists(richText);
      const { quill } = richText;
      const range = quill.getSelection();
      assertExists(range);
      page.captureSync();

      const { index, length } = range;
      const format = quill.getFormat(range);
      models[0].text?.format(index, length, { [key]: !format[key] });
    } else {
      formatModelsByRange(models, page, key);
    }
  }
}

/**
 * @deprecated
 */
export function handleNativeSelectAll() {
  const blocks = document.querySelectorAll('.ql-editor');
  const firstRichText = blocks[0];
  const lastRichText = blocks[blocks.length - 1];
  const range = document.createRange();
  assertExists(firstRichText);
  assertExists(lastRichText);
  assertExists(range);

  const lastNode = findLastNode(lastRichText);
  const firstNode = findFirstNode(firstRichText);
  range.setStart(firstNode, 0);
  // @ts-ignore
  range.setEnd(lastNode, lastNode.length);

  const nearestCommonAncestor = findNearestCommonAncestor(
    firstRichText,
    lastRichText,
    document.querySelector('body') as Node
  );
  initQuickBarEventHandlersAfterSelectAll(nearestCommonAncestor);
  resetNativeSelection(range);
}

export function handleSelectAll(selection: DefaultSelectionManager) {
  const currentSelection = window.getSelection();
  if (
    selection.state.selectedBlocks.length === 0 &&
    currentSelection?.focusNode?.nodeName === '#text'
  ) {
    const currentRange = getCurrentRange();
    const rangeRect = currentRange.getBoundingClientRect();
    selection.selectBlocksByRect(rangeRect);
  } else {
    const LARGE_BOUND = 999999;
    const rect = new DOMRect(0, 0, LARGE_BOUND, LARGE_BOUND);
    selection.state.focusedBlockIndex = -1; // SELECT_ALL
    selection.selectBlocksByRect(rect);
  }

  resetNativeSelection(null);
}

// TODO should show format bar after select all
function initQuickBarEventHandlersAfterSelectAll(nearestCommonAncestor: Node) {
  nearestCommonAncestor.addEventListener(
    'mousemove',
    e => {
      e.stopPropagation();
      // SelectedBlockType 总是 text, DragDirection 总是 never
      console.log(nearestCommonAncestor);
    },
    { once: true }
  );
}

function findLastNode(ele: Element | Node): Node {
  if (ele.lastChild) {
    return findLastNode(ele.lastChild);
  }
  return ele;
}

function findFirstNode(ele: Element | Node): Node {
  if (ele.firstChild) {
    return findFirstNode(ele.firstChild);
  }
  return ele;
}

function findNearestCommonAncestor(
  node1: Node,
  node2: Node,
  root: Node = document.querySelector('body') as Node
): Node {
  const ancestors: Node[][] = new Array(2).fill(0).map(() => []);
  [node1, node2].forEach((node, index) => {
    while (node !== root && node.parentElement) {
      node = node.parentElement;
      ancestors[index].push(node);
    }
  });

  for (let i = 0; i < ancestors[0].length; i++) {
    for (let j = 0; j < ancestors[1].length; j++) {
      if (ancestors[0][i] === ancestors[1][j]) {
        return ancestors[0][i];
      }
    }
  }
  return root;
}

export function handleBlockSelectionBatchDelete(
  page: Page,
  models: ExtendedModel[]
) {
  page.captureSync();
  const parent = getParentBlockById(models[0].id);

  assertExists(parent);
  const parentModel = getModelByElement(parent);
  const index = parentModel?.children.indexOf(models[0]);
  for (let i = 0; i < models.length; i++) {
    page.deleteBlock(models[i]);
  }
  const id = page.addBlock(
    { flavour: 'affine:paragraph', page, type: 'text' },
    parentModel,
    index
  );
  id && asyncFocusRichText(page, id);
}

export function tryUpdateFrameSize(page: Page, zoom: number) {
  requestAnimationFrame(() => {
    if (!page.root) return;
    const frames = page.root.children as TopLevelBlockModel[];
    let offset = 0;
    frames.forEach(model => {
      // DO NOT resize shape block
      // FIXME: we don't have shape block for now.
      // if (matchFlavours(model, ['affine:shape'])) return;
      const blockElement = getBlockElementByModel(model);
      if (!blockElement) return;
      const bound = blockElement.getBoundingClientRect();
      if (!bound) return;

      const [x, y, w, h] = JSON.parse(model.xywh) as [
        number,
        number,
        number,
        number
      ];
      const newModelHeight = bound.height / zoom;
      if (!almostEqual(newModelHeight, h)) {
        const newX = x + (offset === 0 ? 0 : offset + DEFAULT_SPACING);
        page.updateBlock(model, {
          xywh: JSON.stringify([newX, y, w, Math.round(newModelHeight)]),
        });
        offset = newX + w;
      }
    });
  });
}
