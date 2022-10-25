import type { Quill } from 'quill';
import { BaseBlockModel, Store, Text } from '@blocksuite/store';

import { ExtendedModel } from './types';
import { almostEqual, assertExists, assertFlavours, noop } from './std';
import { ALLOW_DEFAULT, PREVENT_DEFAULT } from './consts';
import {
  getStartModelBySelection,
  getRichTextByModel,
  getModelsByRange,
  getPreviousBlock,
  getContainerByModel,
  getBlockElementByModel,
} from './query';
import {
  getCurrentRange,
  isCollapsedSelection,
  isMultiBlockRange,
  isNoneSelection,
  isRangeSelection,
  resetNativeSelection,
} from './selection';
import { GroupBlockModel } from '../../group-block';

// XXX: workaround quill lifecycle issue
export function asyncFocusRichText(store: Store, id: string) {
  setTimeout(() => {
    const adapter = store.richTextAdapters.get(id);
    adapter?.quill.focus();
  });
}

export function handleBlockEndEnter(store: Store, model: ExtendedModel) {
  const parent = store.getParent(model);
  const index = parent?.children.indexOf(model);
  if (parent && index !== undefined && index > -1) {
    // make adding text block by enter a standalone operation
    store.captureSync();

    let id = '';
    if (model.flavour === 'list') {
      const blockProps = {
        flavour: model.flavour,
        type: model.type,
      };
      if (model.children.length === 0) {
        id = store.addBlock(blockProps, parent, index + 1);
      } else {
        id = store.addBlock(blockProps, model, 0);
      }
    } else {
      const blockProps = {
        flavour: model.flavour,
        type: 'text',
      };
      id = store.addBlock(blockProps, parent, index + 1);
    }
    id && asyncFocusRichText(store, id);
  }
}

export function handleSoftEnter(
  store: Store,
  model: ExtendedModel,
  index: number
) {
  store.captureSync();
  model.text?.insert('\n', index);
}

export function handleBlockSplit(
  store: Store,
  model: ExtendedModel,
  splitIndex: number
) {
  if (!(model.text instanceof Text)) return;

  const parent = store.getParent(model);
  if (!parent) return;

  const [left, right] = model.text.split(splitIndex);
  store.captureSync();
  store.markTextSplit(model.text, left, right);
  store.updateBlock(model, { text: left });

  let newParent = parent;
  let newBlockIndex = newParent.children.indexOf(model) + 1;
  if (model.flavour === 'list' && model.children.length > 0) {
    newParent = model;
    newBlockIndex = 0;
  }
  const id = store.addBlock(
    { flavour: model.flavour, text: right, type: model.type },
    newParent,
    newBlockIndex
  );
  asyncFocusRichText(store, id);
}

export function handleIndent(
  store: Store,
  model: ExtendedModel,
  offset: number
) {
  const previousSibling = store.getPreviousSibling(model);
  if (previousSibling) {
    store.captureSync();

    const blockProps = {
      id: model.id,
      flavour: model.flavour,
      type: model.type,
      text: model?.text?.clone(), // should clone before `deleteBlock`
      children: model.children,
    };
    store.deleteBlock(model);
    const id = store.addBlock(blockProps, previousSibling);
    // FIXME: after quill onload
    requestAnimationFrame(() => {
      const block = store.getBlockById(id);
      assertExists(block);
      const richText = getRichTextByModel(block);
      richText?.quill.setSelection(offset, 0);
    });
  }
}

export async function handleUnindent(
  store: Store,
  model: ExtendedModel,
  offset: number
) {
  const parent = store.getParent(model);
  if (!parent || parent?.flavour === 'group') return;

  const grandParent = store.getParent(parent);
  if (!grandParent) return;

  const index = grandParent.children.indexOf(parent);
  const blockProps = {
    id: model.id,
    flavour: model.flavour,
    text: model?.text?.clone(), // should clone before `deleteBlock`
    children: model.children,
    type: model.type,
  };

  store.captureSync();
  store.deleteBlock(model);
  const id = store.addBlock(blockProps, grandParent, index + 1);

  // FIXME: after quill onload
  requestAnimationFrame(() => {
    const block = store.getBlockById(id);
    assertExists(block);

    const richText = getRichTextByModel(block);
    richText?.quill.setSelection(offset, 0);
  });
}

export function isCollapsedAtBlockStart(quill: Quill) {
  return (
    quill.getSelection(true)?.index === 0 && quill.getSelection()?.length === 0
  );
}

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
  lastRichText.model.text?.delete(0, endTextIndex);
  firstRichText.model.text?.join(lastRichText.model.text as Text);

  // delete models in between
  for (let i = 1; i <= models.length - 1; i++) {
    store.deleteBlock(models[i]);
  }

  firstRichText.quill.setSelection(firstTextIndex, 0);
}

export function updateTextType(type: string, store: Store) {
  const range = window.getSelection()?.getRangeAt(0);
  assertExists(range);

  const modelsInRange = getModelsByRange(range);
  modelsInRange.forEach(model => {
    assertFlavours(model, ['paragraph', 'list']);
    store.updateBlock(model, { type });
  });
}

export function batchUpdateTextType(
  store: Store,
  models: ExtendedModel[],
  type: string
) {
  store.captureSync();
  for (const model of models) {
    assertFlavours(model, ['paragraph', 'list']);
    store.updateBlock(model, { type });
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

export function getQuillIndexByNativeSelection(
  ele: Node | null | undefined,
  nodeOffset: number,
  isStart: boolean
) {
  if (
    ele instanceof Element &&
    ele.classList.contains('affine-default-page-block-title-container')
  ) {
    return (
      (isStart
        ? ele.querySelector('input')?.selectionStart
        : ele.querySelector('input')?.selectionEnd) || 0
    );
  }

  let offset = 0;
  let lastNode = ele;
  let selfAdded = false;
  while (
    ele &&
    // @ts-ignore
    (!lastNode?.getAttributeNode ||
      // @ts-ignore
      !lastNode.getAttributeNode('contenteditable'))
  ) {
    if (ele instanceof Element && ele.hasAttribute('data-block-id')) {
      offset = 0;
      break;
    }
    if (!selfAdded) {
      selfAdded = true;
      offset += nodeOffset;
    } else {
      offset += textWithoutNode(ele as Node, lastNode as Node).length;
    }
    lastNode = ele;
    ele = ele?.parentNode;
  }
  return offset;
}

function textWithoutNode(parentNode: Node, currentNode: Node) {
  let text = '';
  for (let i = 0; i < parentNode.childNodes.length; i++) {
    const node = parentNode.childNodes[i];

    if (node !== currentNode || !currentNode.contains(node)) {
      // @ts-ignore
      text += node.textContent || node.innerText || '';
    } else {
      return text;
    }
  }
  return text;
}

export function handleFormat(store: Store, e: KeyboardEvent, key: string) {
  // workaround page title
  if (e.target instanceof HTMLInputElement) return;
  if (isNoneSelection()) {
    e.preventDefault();
    return;
  }

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

export function handleLineStartBackspace(store: Store, model: ExtendedModel) {
  // When deleting at line start of a paragraph block,
  // firstly switch it to normal text, then delete this empty block.
  if (model.flavour === 'paragraph') {
    if (model.type !== 'text') {
      store.captureSync();
      store.updateBlock(model, { type: 'text' });
    } else {
      const parent = store.getParent(model);
      if (!parent || parent?.flavour === 'group') {
        const container = getContainerByModel(model);
        const previousSibling = getPreviousBlock(container, model.id);
        if (previousSibling) {
          store.captureSync();
          previousSibling.text?.join(model.text as Text);
          store.deleteBlock(model);
          asyncFocusRichText(store, previousSibling.id);
        }
      } else {
        const grandParent = store.getParent(parent);
        if (!grandParent) return;
        const index = grandParent.children.indexOf(parent);
        const blockProps = {
          id: model.id,
          flavour: model.flavour,
          text: model?.text?.clone(), // should clone before `deleteBlock`
          children: model.children,
          type: model.type,
        };

        store.captureSync();
        store.deleteBlock(model);
        store.addBlock(blockProps, grandParent, index + 1);
      }
    }
  }
  // When deleting at line start of a list block,
  // switch it to normal paragraph block.
  else if (model.flavour === 'list') {
    const parent = store.getParent(model);
    if (!parent) return;

    const index = parent.children.indexOf(model);
    store.captureSync();

    const blockProps = {
      flavour: 'paragraph',
      type: 'text',
      text: model?.text?.clone(),
      children: model.children,
    };
    store.deleteBlock(model);
    const id = store.addBlock(blockProps, parent, index);
    asyncFocusRichText(store, id);
  }
}

export function tryMatchSpaceHotkey(
  store: Store,
  model: ExtendedModel,
  quill: Quill,
  prefix: string,
  range: { index: number; length: number }
) {
  const [, offset] = quill.getLine(range.index);
  if (offset > prefix.length) {
    return ALLOW_DEFAULT;
  }
  let isConverted = false;
  switch (prefix.trim()) {
    case '[]':
    case '[ ]':
      isConverted = convertToList(store, model, 'todo', prefix, {
        checked: false,
      });
      break;
    case '[x]':
      isConverted = convertToList(store, model, 'todo', prefix, {
        checked: true,
      });
      break;
    case '-':
    case '*':
      isConverted = convertToList(store, model, 'bulleted', prefix);
      break;
    case '#':
      isConverted = convertToParagraph(store, model, 'h1', prefix);
      break;
    case '##':
      isConverted = convertToParagraph(store, model, 'h2', prefix);
      break;
    case '###':
      isConverted = convertToParagraph(store, model, 'h3', prefix);
      break;
    case '####':
      isConverted = convertToParagraph(store, model, 'h4', prefix);
      break;
    case '#####':
      isConverted = convertToParagraph(store, model, 'h5', prefix);
      break;
    case '######':
      isConverted = convertToParagraph(store, model, 'h6', prefix);
      break;
    case '>':
      isConverted = convertToParagraph(store, model, 'quote', prefix);
      break;
    default:
      isConverted = convertToList(store, model, 'numbered', prefix);
  }

  return isConverted ? PREVENT_DEFAULT : ALLOW_DEFAULT;
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

export function convertToList(
  store: Store,
  model: ExtendedModel,
  listType: 'bulleted' | 'numbered' | 'todo',
  prefix: string,
  otherProperties?: Record<string, unknown>
): boolean {
  if (model.flavour === 'list' && model['type'] === listType) {
    return false;
  }
  if (model.flavour === 'paragraph') {
    const parent = store.getParent(model);
    if (!parent) return false;

    const index = parent.children.indexOf(model);
    model.text?.insert(' ', prefix.length);
    store.captureSync();

    model.text?.delete(0, prefix.length + 1);
    const blockProps = {
      flavour: 'list',
      type: listType,
      text: model?.text?.clone(),
      children: model.children,
      ...otherProperties,
    };
    store.deleteBlock(model);

    const id = store.addBlock(blockProps, parent, index);
    asyncFocusRichText(store, id);
  } else if (model.flavour === 'list' && model['type'] !== listType) {
    model.text?.insert(' ', prefix.length);
    store.captureSync();

    model.text?.delete(0, prefix.length + 1);
    store.updateBlock(model, { type: listType });
  }
  return true;
}

export function convertToParagraph(
  store: Store,
  model: ExtendedModel,
  type: 'paragraph' | 'quote' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6',
  prefix: string
): boolean {
  if (model.flavour === 'paragraph' && model['type'] === type) {
    return false;
  }
  if (model.flavour !== 'paragraph') {
    const parent = store.getParent(model);
    if (!parent) return false;

    const index = parent.children.indexOf(model);
    model.text?.insert(' ', prefix.length);
    store.captureSync();

    model.text?.delete(0, prefix.length + 1);
    const blockProps = {
      flavour: 'paragraph',
      type: type,
      text: model?.text?.clone(),
      children: model.children,
    };
    store.deleteBlock(model);

    const id = store.addBlock(blockProps, parent, index);
    asyncFocusRichText(store, id);
  } else if (model.flavour === 'paragraph' && model['type'] !== type) {
    model.text?.insert(' ', prefix.length);
    store.captureSync();

    model.text?.delete(0, prefix.length + 1);
    store.updateBlock(model, { type: type });
  }
  return true;
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
