import { Store, Text, BaseBlockModel } from '@blocksuite/store';
import { GroupBlockModel } from '../../group-block';
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

function deleteModels(store: Store, models: BaseBlockModel[]) {
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
  const isLastRichTextFullSelected: boolean = lastRichText.model.text?.length === endTextIndex;
  if (!isLastRichTextFullSelected) {
    lastRichText.model.text?.delete(0, endTextIndex);
    firstRichText.model.text?.join(lastRichText.model.text as Text);
  }

  // delete models in between
  for (let i = 1; i <= models.length - 1; i++) {
    store.deleteBlock(models[i]);
  }

  firstRichText.quill.setSelection(firstTextIndex, 0);
}

export function updateTextType(flavour: string, type: string, store: Store) {
  const range = window.getSelection()?.getRangeAt(0);
  assertExists(range);
  const modelsInRange = getModelsByRange(range);
  store.captureSync();
  modelsInRange.forEach(model => {
    assertFlavours(model, ['affine:paragraph', 'affine:list']);
    if (model.flavour === flavour) {
      store.updateBlock(model, { type });
    } else {
      transformBlock(store, model, flavour, type);
    }
  });
}
export function transformBlock(
  store: Store,
  model: BaseBlockModel,
  flavour: string,
  type: string
) {
  const parent = store.getParent(model);
  assertExists(parent);
  const blockProps = {
    flavour,
    type,
    text: model?.text?.clone(), // should clone before `deleteBlock`
    children: model.children,
  };
  const index = parent.children.indexOf(model);
  store.deleteBlock(model);
  const id = store.addBlock(blockProps, parent, index);
  asyncFocusRichText(store, id);
}

export function batchUpdateTextType(
  flavour: string,
  store: Store,
  models: ExtendedModel[],
  type: string
) {
  store.captureSync();
  for (const model of models) {
    assertFlavours(model, ['affine:paragraph', 'affine:list']);
    if (model.flavour === flavour) {
      store.updateBlock(model, { type });
    } else {
      transformBlock(store, model, 'affine:paragraph', type);
    }
  }
}

export function handleBackspace(store: Store, e: KeyboardEvent) {
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
      deleteModels(store, intersectedModels);
    }
  }
}

function formatModelsByRange(
  models: BaseBlockModel[],
  store: Store,
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

  store.captureSync();
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

export function handleFormat(store: Store, e: KeyboardEvent, key: string) {
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
      store.captureSync();

      const { index, length } = range;
      const format = quill.getFormat(range);
      models[0].text?.format(index, length, { [key]: !format[key] });
      quill.setSelection(index + length, 0);
      if (key === 'code' || key === 'link') {
        quill.format(key, false);
      }
    } else {
      formatModelsByRange(models, store, key);
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
  store: Store,
  models: ExtendedModel[]
) {
  store.captureSync();
  assertExists(models[0].text);

  models[0].text.delete(0, models[0].text.length);
  for (let i = 1; i < models.length; i++) {
    store.deleteBlock(models[i]);
  }
}

export function tryUpdateGroupSize(store: Store, zoom: number) {
  requestAnimationFrame(() => {
    if (!store.root) return;
    const groups = store.root.children as GroupBlockModel[];
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
        store.updateBlock(model, {
          xywh: JSON.stringify([x, y, newModelWidth, newModelHeight]),
        });
      }
    });
  });
}
