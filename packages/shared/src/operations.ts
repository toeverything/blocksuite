import type { BaseBlockModel, Store } from '@blocksuite/store';
import { BlockHost, SelectionPosition } from './types';
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

// We should determine if the cursor is at the edge of the block, since a cursor at edge may have two cursor points
// but only one bounding rect.
// If a cursor is at the edge of a block, its previous cursor rect will not equal to the next one.
function isAtLineEdge(range: Range) {
  if (range.startOffset > 0) {
    const prevRange = range.cloneRange();
    prevRange.setStart(range.startContainer, range.startOffset - 1);
    prevRange.setEnd(range.startContainer, range.startOffset - 1);
    const nextRange = range.cloneRange();
    nextRange.setStart(range.endContainer, range.endOffset + 1);
    nextRange.setEnd(range.endContainer, range.endOffset + 1);
    return (
      prevRange.getBoundingClientRect().top !==
      nextRange.getBoundingClientRect().top
    );
  }
  return false;
}

export function handleKeyUp(
  model: BaseBlockModel,
  selectionManager: BlockHost['selection'],
  editableContainer: Element
) {
  const selection = window.getSelection();
  if (selection) {
    const range = selection.getRangeAt(0);
    const { height, left, top } = range.getBoundingClientRect();
    // if cursor is on the first line and has no text, height is 0
    if (height === 0 && top === 0) {
      const rect = range.startContainer.parentElement?.getBoundingClientRect();
      rect &&
        selectionManager.activePreviousBlock(
          model.id,
          new Point(rect.left, rect.top)
        );
      return false;
    }
    // TODO resolve compatible problem
    const newRange = document.caretRangeFromPoint(left, top - height / 2);
    if (
      (!newRange || !editableContainer.contains(newRange.startContainer)) &&
      !isAtLineEdge(range)
    ) {
      selectionManager.activePreviousBlock(model.id, new Point(left, top));
      return false;
    }
  }
  return true;
}

export function handleKeyDown(
  model: BaseBlockModel,
  selectionManager: BlockHost['selection'],
  textContainer: HTMLElement
) {
  const selection = window.getSelection();
  if (selection) {
    const range = selection.getRangeAt(0);
    const { bottom, left, height } = range.getBoundingClientRect();
    // if cursor is on the last line and has no text, height is 0
    if (height === 0 && bottom === 0) {
      const rect = range.startContainer.parentElement?.getBoundingClientRect();
      rect &&
        selectionManager.activeNextBlock(
          model.id,
          new Point(rect.left, rect.top)
        );
      return false;
    }
    // TODO resolve compatible problem
    const newRange = document.caretRangeFromPoint(left, bottom + height / 2);
    if (
      (!newRange || !textContainer.contains(newRange.startContainer)) &&
      !isAtLineEdge(range)
    ) {
      selectionManager.activeNextBlock(model.id, new Point(left, bottom));
      return false;
    }
  }
  return true;
}

export function commonTextActiveHandler(
  position: SelectionPosition,
  editableContainer: Element
) {
  const { top, left, bottom, right } = Rect.fromDom(editableContainer);
  const lineHeight =
    Number(
      window.getComputedStyle(editableContainer).lineHeight.replace(/\D+$/, '')
    ) || 16;
  let range: Range | null = null;
  if (position instanceof Point) {
    const { x, y } = position;
    let newTop = y;
    let newLeft = x;
    if (bottom <= y) {
      newTop = bottom - lineHeight / 2;
    }
    if (top >= y) {
      newTop = top + lineHeight / 2;
    }
    if (x < left) {
      newLeft = left + 1;
    }
    if (x > right) {
      newLeft = right - 1;
    }
    range = document.caretRangeFromPoint(newLeft, newTop);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    range && selection?.addRange(range);
  }
  if (position === 'start') {
    range = document.caretRangeFromPoint(left, top + lineHeight / 2);
  }
  if (position === 'end') {
    range = document.caretRangeFromPoint(right - 1, bottom - lineHeight / 2);
  }
  const selection = window.getSelection();
  selection?.removeAllRanges();
  range && selection?.addRange(range);
}
