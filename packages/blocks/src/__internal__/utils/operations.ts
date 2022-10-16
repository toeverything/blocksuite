import type { Quill } from 'quill';
import { Store, Text } from '@blocksuite/store';

import { Detail, ExtendedModel } from './types';
import { ALLOW_DEFAULT, PREVENT_DEFAULT } from './consts';
import {
  getStartModelBySelection,
  isCollapsedSelection,
  getRichTextByModel,
  isRangeSelection,
  assertExists,
} from './query';
import { getCurrentRange, isMultiBlockRange } from './selection';

export function createEvent<T extends keyof WindowEventMap>(
  type: T,
  detail: Detail<T>
) {
  return new CustomEvent<Detail<T>>(type, { detail });
}

export function noop() {
  return;
}

// XXX: workaround quill lifecycle issue
export function asyncFocusRichText(store: Store, id: string) {
  setTimeout(() => store.richTextAdapters.get(id)?.quill.focus());
}

export function handleBlockEndEnter(store: Store, model: ExtendedModel) {
  const parent = store.getParent(model);
  const index = parent?.children.indexOf(model);
  if (parent && index !== undefined && index > -1) {
    // make adding text block by enter a standalone operation
    store.captureSync();

    const blockProps = {
      flavour: model.flavour,
      type: model.type,
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

export function handleBackspace(store: Store, e: KeyboardEvent) {
  // workaround page title
  if (e.target instanceof HTMLInputElement) return;

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
    }
  }
}

export function handleFormat(store: Store, e: KeyboardEvent, key: string) {
  // workaround page title
  if (e.target instanceof HTMLInputElement) return;

  if (isRangeSelection()) {
    const startModel = getStartModelBySelection();
    const richText = getRichTextByModel(startModel);

    if (richText) {
      const { quill } = richText;
      store.captureSync();
      store.transact(() => {
        const range = quill?.getSelection();
        assertExists(range);

        const { index, length } = range;
        const format = quill?.getFormat(range);
        startModel?.text?.format(index, length, { [key]: !format[key] });
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

  switch (prefix.trim()) {
    case '[]':
    case '[ ]':
      store.transact(() => model.text?.clear());
      convertToList(store, model, 'todo', { checked: false });
      break;
    case '[x]':
      store.transact(() => model.text?.clear());
      convertToList(store, model, 'todo', { checked: true });
      break;
    case '-':
    case '*':
      store.transact(() => model.text?.clear());
      convertToList(store, model, 'bulleted');
      break;
    case '#':
      store.transact(() => model.text?.clear());
      convertToParagraph(store, model, 'h1');
      break;
    case '##':
      store.transact(() => model.text?.clear());
      convertToParagraph(store, model, 'h2');
      break;
    case '###':
      store.transact(() => model.text?.clear());
      convertToParagraph(store, model, 'h3');
      break;
    case '####':
      store.transact(() => model.text?.clear());
      convertToParagraph(store, model, 'h4');
      break;
    case '#####':
      store.transact(() => model.text?.clear());
      convertToParagraph(store, model, 'h5');
      break;
    case '######':
      store.transact(() => model.text?.clear());
      convertToParagraph(store, model, 'h6');
      break;
    case '>':
      store.transact(() => model.text?.clear());
      convertToParagraph(store, model, 'quote');
      break;
    default:
      store.transact(() => model.text?.clear());
      convertToList(store, model, 'numbered');
  }

  return PREVENT_DEFAULT;
}

export function convertToList(
  store: Store,
  model: ExtendedModel,
  listType: 'bulleted' | 'numbered' | 'todo',
  otherProperties?: Record<string, unknown>
) {
  if (model.flavour === 'paragraph') {
    const parent = store.getParent(model);
    if (!parent) return;

    const index = parent.children.indexOf(model);
    store.captureSync();

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
    store.captureSync();
    store.updateBlock(model, { type: listType });
  }
}

export function convertToParagraph(
  store: Store,
  model: ExtendedModel,
  type: 'paragraph' | 'quote' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
) {
  if (model.flavour !== 'paragraph') {
    const parent = store.getParent(model);
    if (!parent) return;

    const index = parent.children.indexOf(model);
    store.captureSync();

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
    store.captureSync();
    store.updateBlock(model, { type: type });
  }
}
