import type { BaseBlockModel, Store } from '@blocksuite/store';
import { SelectPosition } from './types';
import { Point, Rect } from './rect';

// XXX: workaround quill lifecycle issue
function asyncFocusRichText(store: Store, id: string) {
  setTimeout(() => store.richTextAdapters.get(id)?.quill.focus());
}

export function handleBlockEndEnter(store: Store, model: BaseBlockModel) {
  const parent = store.getParent(model);
  const index = parent?.children.indexOf(model);
  if (parent && index !== undefined && index > -1) {
    // make adding text block by enter a standalone operation
    store.captureSync();

    const blockProps = {
      flavour: model.flavour,
    };
    const id = store.addBlock(blockProps, parent, index + 1);
    asyncFocusRichText(store, id);
  }
}

export function handleIndent(store: Store, model: BaseBlockModel) {
  const previousSibling = store.getPreviousSibling(model);
  if (previousSibling) {
    store.captureSync();

    const blockProps = {
      id: model.id,
      flavour: model.flavour,
      text: model?.text?.clone(), // should clone before `deleteBlock`
    };
    store.deleteBlock(model);
    store.addBlock(blockProps, previousSibling);
  }
}

export function handleUnindent(store: Store, model: BaseBlockModel) {
  const parent = store.getParent(model);
  if (!parent) return;

  const grandParent = store.getParent(parent);
  if (!grandParent) return;

  const index = grandParent.children.indexOf(parent);
  store.captureSync();

  const blockProps = {
    id: model.id,
    flavour: model.flavour,
    text: model?.text?.clone(), // should clone before `deleteBlock`
  };
  store.deleteBlock(model);
  store.addBlock(blockProps, grandParent, index + 1);
}

export function commonTextActiveHandler(
  position: SelectPosition,
  editableContainer: Element
) {
  if (position instanceof Point) {
    const { x, y } = position;
    let newTop = 0;
    const containerRect = Rect.fromDom(editableContainer);
    const lineHeight =
      Number(
        window
          .getComputedStyle(editableContainer)
          .lineHeight.replace(/\D+$/, '')
      ) || 16;
    if (containerRect.bottom <= y) {
      newTop = containerRect.bottom - lineHeight / 2;
    }
    if (containerRect.top >= y) {
      newTop = containerRect.top + lineHeight / 2;
    }
    const range = document.caretRangeFromPoint(x, newTop);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    range && selection?.addRange(range);
  }
}
