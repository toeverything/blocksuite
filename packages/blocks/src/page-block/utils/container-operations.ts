import type { Space, Text, BaseBlockModel } from '@blocksuite/store';
import type { GroupBlockModel } from '../../group-block';
import {
  assertExists,
  assertFlavours,
  ExtendedModel,
  noop,
  almostEqual,
  isCollapsedAtBlockStart,
} from '../../__internal__';
import { asyncFocusRichText } from '../../__internal__/utils/common-operations';
import {
  getStartModelBySelection,
  getRichTextByModel,
  getModelsByRange,
  getBlockElementByModel,
  getQuillIndexByNativeSelection,
  getCurrentRange,
} from '../../__internal__/utils/query';
import {
  isCollapsedSelection,
  isMultiBlockRange,
  isNoneSelection,
  isRangeSelection,
  resetNativeSelection,
} from '../../__internal__/utils/selection';

function deleteModels(space: Space, models: BaseBlockModel[]) {
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
    space.deleteBlock(models[i]);
  }

  firstRichText.quill.setSelection(firstTextIndex, 0);
}

export function updateTextType(flavour: string, type: string, space: Space) {
  const range = window.getSelection()?.getRangeAt(0);
  assertExists(range);
  const modelsInRange = getModelsByRange(range);
  space.captureSync();
  modelsInRange.forEach(model => {
    assertFlavours(model, ['affine:paragraph', 'affine:list']);
    if (model.flavour === flavour) {
      space.updateBlock(model, { type });
    } else {
      transformBlock(space, model, flavour, type);
    }
  });
}
export function transformBlock(
  space: Space,
  model: BaseBlockModel,
  flavour: string,
  type: string
) {
  const parent = space.getParent(model);
  assertExists(parent);
  const blockProps = {
    flavour,
    type,
    text: model?.text?.clone(), // should clone before `deleteBlock`
    children: model.children,
  };
  const index = parent.children.indexOf(model);
  space.deleteBlock(model);
  const id = space.addBlock(blockProps, parent, index);
  asyncFocusRichText(space, id);
}

export function batchUpdateTextType(
  flavour: string,
  space: Space,
  models: ExtendedModel[],
  type: string
) {
  space.captureSync();
  for (const model of models) {
    assertFlavours(model, ['affine:paragraph', 'affine:list']);
    if (model.flavour === flavour) {
      space.updateBlock(model, { type });
    } else {
      transformBlock(space, model, 'affine:paragraph', type);
    }
  }
}

export function handleBackspace(space: Space, e: KeyboardEvent) {
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
      deleteModels(space, intersectedModels);
    }
  }
}

function formatModelsByRange(
  models: BaseBlockModel[],
  space: Space,
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
    selection.anchorOffset as number,
    true
  );
  const endIndex = getQuillIndexByNativeSelection(
    selection.focusNode,
    selection.focusOffset as number,
    false
  );
  const formatArr = [];
  const firstFormat = firstRichText.quill.getFormat(
    firstIndex,
    firstRichText.quill.getLength() - firstIndex - 1
  );
  const lastFormat = lastRichText.quill.getFormat(0, endIndex);

  formatArr.push(firstFormat, lastFormat);
  for (let i = 1; i < models.length - 1; i++) {
    const richText = getRichTextByModel(models[i]);
    assertExists(richText);
    const format = richText.quill.getFormat(0, richText.quill.getLength() - 1);
    formatArr.push(format);
  }
  const allFormat = formatArr.every(item => item[key]);

  space.captureSync();
  firstRichText.model.text?.format(
    firstIndex,
    firstRichText.quill.getLength() - firstIndex - 1,
    { [key]: !allFormat }
  );
  lastRichText.model.text?.format(0, endIndex, { [key]: !allFormat });

  for (let i = 1; i < models.length - 1; i++) {
    const richText = getRichTextByModel(models[i]);
    assertExists(richText);
    richText.model.text?.format(0, richText.quill.getLength() - 1, {
      [key]: !allFormat,
    });
  }
  lastRichText.quill.setSelection(endIndex, 0);
  if (key === 'code' || key === 'link') {
    lastRichText.quill.format(key, false);
  }
}

export function handleFormat(space: Space, e: KeyboardEvent, key: string) {
  // workaround page title
  e.preventDefault();
  if (e.target instanceof HTMLInputElement) return;
  if (isNoneSelection()) return;

  if (isRangeSelection()) {
    const models = getModelsByRange(getCurrentRange());
    if (models.length === 1) {
      const richText = getRichTextByModel(models[0]);
      assertExists(richText);
      const { quill } = richText;
      const range = quill.getSelection();
      assertExists(range);
      space.captureSync();

      const { index, length } = range;
      const format = quill.getFormat(range);
      models[0].text?.format(index, length, { [key]: !format[key] });
      quill.setSelection(index + length, 0);
      if (key === 'code' || key === 'link') {
        quill.format(key, false);
      }
    } else {
      formatModelsByRange(models, space, key);
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

  resetNativeSelection(range);
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

export function handleBlockSelectionBatchDelete(
  space: Space,
  models: ExtendedModel[]
) {
  space.captureSync();
  assertExists(models[0].text);

  models[0].text.delete(0, models[0].text.length);
  for (let i = 1; i < models.length; i++) {
    space.deleteBlock(models[i]);
  }
}

export function tryUpdateGroupSize(space: Space, zoom: number) {
  requestAnimationFrame(() => {
    if (!space.root) return;
    const groups = space.root.children as GroupBlockModel[];
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
        space.updateBlock(model, {
          xywh: JSON.stringify([x, y, newModelWidth, newModelHeight]),
        });
      }
    });
  });
}
