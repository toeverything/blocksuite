import type { Quill } from 'quill';
import { BaseBlockModel, Store, Text } from '@blocksuite/store';

import { ExtendedModel } from './types';
import { assertExists, noop } from './std';
import { ALLOW_DEFAULT, PREVENT_DEFAULT } from './consts';
import {
  getStartModelBySelection,
  getRichTextByModel,
  getModelsByRange,
  getDOMRectByLine,
} from './query';
import {
  focusRichTextStart,
  getCurrentRange,
  isCollapsedSelection,
  isMultiBlockRange,
  isNoneSelection,
  isRangeSelection,
} from './selection';
import type { RichText } from '../rich-text/rich-text';

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

    const blockProps = {
      flavour: model.flavour,
      type: !['bulleted', 'numbered', 'todo'].includes(model.type)
        ? 'text'
        : model.type,
    };
    const id = store.addBlock(blockProps, parent, index + 1);
    asyncFocusRichText(store, id);
  }
}

export function handleSoftEnter(
  store: Store,
  model: ExtendedModel,
  index: number
) {
  store.captureSync();
  store.transact(() => model.text?.insert('\n', index));
}

export function handleBlockSplit(
  store: Store,
  model: ExtendedModel,
  splitIndex: number
) {
  if (!(model.text instanceof Text)) return;

  const parent = store.getParent(model);
  if (!parent) return;

  const newBlockIndex = parent.children.indexOf(model) + 1;

  const [left, right] = model.text.split(splitIndex);
  store.captureSync();

  store.markTextSplit(model.text, left, right);
  store.updateBlock(model, { text: left });
  const id = store.addBlock(
    { flavour: model.flavour, text: right },
    parent,
    newBlockIndex
  );

  asyncFocusRichText(store, id);
}

export function handleIndent(store: Store, model: ExtendedModel) {
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
    store.addBlock(blockProps, previousSibling);
  }
}

export function handleUnindent(store: Store, model: ExtendedModel) {
  const parent = store.getParent(model);
  if (!parent || parent?.flavour === 'group') return;

  const grandParent = store.getParent(parent);
  if (!grandParent) return;

  const index = grandParent.children.indexOf(parent);
  store.captureSync();

  const blockProps = {
    id: model.id,
    flavour: model.flavour,
    text: model?.text?.clone(), // should clone before `deleteBlock`
    children: model.children,
  };
  store.deleteBlock(model);
  store.addBlock(blockProps, grandParent, index + 1);
}

export function isCollapsedAtBlockStart(quill: Quill) {
  return (
    quill.getSelection(true)?.index === 0 && quill.getSelection()?.length === 0
  );
}

function binarySearch(
  quill: Quill,
  target: DOMRect,
  key: 'left' | 'right',
  start: number,
  end: number
): number {
  if (start === end) return start;

  const mid = Math.floor((start + end) / 2);
  if (target[key] < quill.getBounds(mid)[key]) {
    return binarySearch(quill, target, key, start, mid);
  }
  if (target[key] > quill.getBounds(mid)[key]) {
    return binarySearch(quill, target, key, mid + 1, end);
  }
  return mid;
}

function partialDeleteRichTextByRange(
  richText: RichText,
  range: Range,
  lineType: 'first' | 'last'
) {
  const { quill } = richText;
  const length = quill.getLength();
  const rangeRects = range.getClientRects();
  const target = getDOMRectByLine(rangeRects, lineType);

  const key = lineType === 'first' ? 'left' : 'right';
  const index = binarySearch(quill, target, key, 0, length - 1);
  // quill length = model text length + 1
  const modelIndex = index - 1;
  const text = richText.model.text;
  assertExists(text);

  if (lineType === 'first') {
    text.delete(modelIndex, text.length - modelIndex);
  } else if (lineType === 'last') {
    text.delete(0, modelIndex);
  }
}

function deleteModelsByRange(
  store: Store,
  models: BaseBlockModel[],
  range: Range
) {
  const first = models[0];
  const last = models[models.length - 1];
  const firstRichText = getRichTextByModel(first);
  const lastRichText = getRichTextByModel(last);
  assertExists(firstRichText);
  assertExists(lastRichText);

  store.transact(() => {
    partialDeleteRichTextByRange(firstRichText, range, 'first');
    partialDeleteRichTextByRange(lastRichText, range, 'last');
  });

  // delete models in between
  for (let i = 1; i < models.length - 1; i++) {
    store.deleteBlock(models[i]);
  }

  focusRichTextStart(lastRichText);
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
      deleteModelsByRange(store, intersectedModels, range);
    }
  }
}

function formatModelsByRange(models: BaseBlockModel[], range: Range) {
  const first = models[0];
  const last = models[models.length - 1];
  const firstRichText = getRichTextByModel(first);
  const lastRichText = getRichTextByModel(last);
  assertExists(firstRichText);
  assertExists(lastRichText);
  const selection = window.getSelection();
  const firstIndex = getQuillIndexByNativeSelection(
    selection?.anchorNode,
    selection?.anchorOffset as number
  );
  const endIndex = getQuillIndexByNativeSelection(
    selection?.focusNode,
    selection?.focusOffset as number
  );
  const firstQuill = firstRichText.quill;
  firstRichText.model.text?.format(
    firstIndex,
    firstQuill.getLength() - firstIndex - 1,
    { code: true }
  );
  lastRichText.model.text?.format(0, endIndex, { code: true });
  for (let i = 1; i < models.length - 1; i++) {
    let richText = getRichTextByModel(models[i]);
    assertExists(richText);
    richText.model.text?.format(0, richText.quill.getLength() - 1, {
      code: true,
    });
  }
}

function getQuillIndexByNativeSelection(
  ele: Node | null | undefined,
  nodeOffset: number
) {
  let offset = 0;
  let lastNode = ele;
  let selfAdded = false;
  // @ts-ignore
  while (!lastNode?.getAttributeNode || !lastNode.getAttributeNode('contenteditable')
  ) {
    if (!selfAdded) {
      selfAdded = true;
      offset += nodeOffset;
    } else {
      offset += textWithoutNode(ele, lastNode).length;
    }
    lastNode = ele;
    ele = ele?.parentNode;
  }
  return offset;
}

function textWithoutNode(parentNode: any, currentNode: any) {
  let text = '';
  for (let i = 0; i < parentNode.childNodes.length; i++) {
    const node = parentNode.childNodes[i];

    if (node !== currentNode || !currentNode.contains(node)) {
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
  if (isNoneSelection()) return;

  if (isRangeSelection()) {
    const startModel = getStartModelBySelection();
    const richText = getRichTextByModel(startModel);
    if (richText) {
      const { quill } = richText;
      const range = quill.getSelection();
      assertExists(range);

      store.captureSync();
      store.transact(() => {
        const { index, length } = range;
        const format = quill.getFormat(range);
        startModel.text?.format(index, length, { [key]: !format[key] });
      });
    }
  }
}

export function handleLineStartBackspace(store: Store, model: ExtendedModel) {
  // When deleting at line start of a paragraph block,
  // firstly switch it to normal text, then delete this empty block.
  if (model.flavour === 'paragraph') {
    if (model.type !== 'text') {
      store.captureSync();
      store.updateBlock(model, { type: 'text' });
    } else {
      const previousSibling = store.getPreviousSibling(model);
      if (previousSibling) {
        store.captureSync();
        store.transact(() => {
          previousSibling.text?.join(model.text as Text);
        });
        store.deleteBlock(model);
        asyncFocusRichText(store, previousSibling.id);
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

// TODO deep delete
export function batchDelete(store: Store, models: ExtendedModel[]) {
  store.captureSync();
  for (const model of models) {
    store.deleteBlock(model);
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
    store.transact(() => {
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
    });
  } else if (model.flavour === 'list' && model['type'] !== listType) {
    model.text?.insert(' ', prefix.length);
    store.captureSync();
    store.transact(() => {
      model.text?.delete(0, prefix.length + 1);
      store.updateBlock(model, { type: listType });
    });
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
    store.transact(() => {
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
    });
  } else if (model.flavour === 'paragraph' && model['type'] !== type) {
    model.text?.insert(' ', prefix.length);
    store.captureSync();
    store.transact(() => {
      model.text?.delete(0, prefix.length + 1);
      store.updateBlock(model, { type: type });
    });
  }
  return true;
}
