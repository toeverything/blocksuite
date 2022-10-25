import { Store } from '@blocksuite/store';
import type { Quill } from 'quill';
import { ExtendedModel } from './types';

// XXX: workaround quill lifecycle issue
export function asyncFocusRichText(store: Store, id: string) {
  setTimeout(() => {
    const adapter = store.richTextAdapters.get(id);
    adapter?.quill.focus();
  });
}

export function isCollapsedAtBlockStart(quill: Quill) {
  return (
    quill.getSelection(true)?.index === 0 && quill.getSelection()?.length === 0
  );
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
