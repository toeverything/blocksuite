import type { Page, Text, BaseBlockModel } from '@blocksuite/store';
import type { GroupBlockModel } from '../../group-block';
import {
  assertExists,
  assertFlavours,
  ExtendedModel,
  noop,
  almostEqual,
  isCollapsedAtBlockStart,
  matchFlavours,
} from '../../__internal__';
import { asyncFocusRichText } from '../../__internal__/utils/common-operations';
import {
  getStartModelBySelection,
  getRichTextByModel,
  getModelsByRange,
  getBlockElementByModel,
  getQuillIndexByNativeSelection,
  getCurrentRange,
  getParentBlockById,
  getModelByElement,
} from '../../__internal__/utils/query';
import {
  isCollapsedSelection,
  isMultiBlockRange,
  isNoneSelection,
  isRangeSelection,
  resetNativeSelection,
} from '../../__internal__/utils/selection';

function deleteModels(page: Page, models: BaseBlockModel[]) {
  const selection = window.getSelection();
  const first = models[0];
  const last = models[models.length - 1];
  const firstRichText = getRichTextByModel(first);
  const lastRichText = getRichTextByModel(last);
  assertExists(firstRichText);
  assertExists(lastRichText);
  assertExists(selection);

  const firstTextIndex = getQuillIndexByNativeSelection(
    selection.anchorNode,
    selection.anchorOffset as number,
    true
  );
  const endTextIndex = getQuillIndexByNativeSelection(
    selection.focusNode,
    selection.focusOffset as number,
    false
  );

  firstRichText.model.text?.delete(
    firstTextIndex,
    firstRichText.model.text.length - firstTextIndex
  );
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

export function updateTextType(flavour: string, type: string, page: Page) {
  const range = window.getSelection()?.getRangeAt(0);
  assertExists(range);
  const modelsInRange = getModelsByRange(range);
  page.captureSync();
  modelsInRange.forEach(model => {
    assertFlavours(model, ['affine:paragraph', 'affine:list']);
    if (model.flavour === flavour) {
      page.updateBlock(model, { type });
    } else {
      transformBlock(page, model, flavour, type);
    }
  });
}

export function transformBlock(
  page: Page,
  model: BaseBlockModel,
  flavour: string,
  type: string
) {
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
  asyncFocusRichText(page, id);
}

export function batchUpdateTextType(
  flavour: string,
  page: Page,
  models: ExtendedModel[],
  type: string
) {
  page.captureSync();
  for (const model of models) {
    assertFlavours(model, ['affine:paragraph', 'affine:list']);
    if (model.flavour === flavour) {
      page.updateBlock(model, { type });
    } else {
      transformBlock(page, model, 'affine:paragraph', type);
    }
  }
}

export function handleBackspace(page: Page, e: KeyboardEvent) {
  // workaround page title
  if (e.target instanceof HTMLInputElement) return;
  if (isNoneSelection()) return;

  if (isCollapsedSelection()) {
    const startModel = getStartModelBySelection();
    const richText = getRichTextByModel(startModel);

    if (richText) {
      const { quill } = richText;
      if (isCollapsedAtBlockStart(quill)) {
        // use quill handler
        noop();
      }
    }
  } else if (isRangeSelection()) {
    const range = getCurrentRange();
    if (isMultiBlockRange(range)) {
      e.preventDefault();
      const intersectedModels = getModelsByRange(range);
      deleteModels(page, intersectedModels);
    }
  }
}

export const getFormat = () => {
  const models = getModelsByRange(getCurrentRange());
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
  formatArr.push(firstFormat, lastFormat);
  for (let i = 1; i < models.length - 1; i++) {
    const richText = getRichTextByModel(models[i]);
    assertExists(richText);
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
  key: string
) {
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
  lastRichText.quill.setSelection(endIndex, 0);
  if (key === 'code' || key === 'link') {
    lastRichText.quill.format(key, false);
  }
}

export function handleFormat(page: Page, key: string) {
  if (isNoneSelection()) return;

  if (isRangeSelection()) {
    const models = getModelsByRange(getCurrentRange());
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

export function handleSelectAll() {
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

export function tryUpdateGroupSize(page: Page, zoom: number) {
  requestAnimationFrame(() => {
    if (!page.root) return;
    const groups = page.root.children as GroupBlockModel[];
    groups.forEach(model => {
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
      const newModelWidth = bound.width / zoom;
      const newModelHeight = bound.height / zoom;

      if (!almostEqual(newModelWidth, w) || !almostEqual(newModelHeight, h)) {
        page.updateBlock(model, {
          xywh: JSON.stringify([x, y, newModelWidth, newModelHeight]),
        });
      }
    });
  });
}
