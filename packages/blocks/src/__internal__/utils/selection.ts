import { BaseBlockModel } from '@blocksuite/store';
import { RichText } from '../rich-text/rich-text';
import { PREVENT_DEFAULT, ALLOW_DEFAULT } from './consts';
import { assertExists, caretRangeFromPoint } from './std';
import { ExtendedModel, SelectedBlock, SelectionPosition } from './types';
import {
  getBlockElementByModel,
  getDefaultPageBlock,
  getContainerByModel,
  getPreviousBlock,
  getNextBlock,
  getModelsByRange,
} from './query';
import { Point, Rect } from './rect';
import { getQuillIndexByNativeSelection } from './operations';

export function focusRichText(
  position: SelectionPosition,
  editableContainer: Element
) {
  let { top, left, bottom, right } = Rect.fromDom(editableContainer);
  const [oldTop, oldBottom] = [top, bottom];
  const { clientHeight } = document.documentElement;
  // TODO: improve the logic
  if (top + 20 > clientHeight || bottom < 20) {
    editableContainer.scrollIntoView();
    const newRect = Rect.fromDom(editableContainer);
    top = newRect.top;
    left = newRect.left;
    bottom = newRect.bottom;
    right = newRect.right;
  }
  const lineHeight =
    Number(
      window.getComputedStyle(editableContainer).lineHeight.replace(/\D+$/, '')
    ) || 16;
  let range: Range | null = null;
  if (position instanceof Point) {
    const { x, y } = position;
    let newTop = y;
    let newLeft = x;
    if (oldBottom <= y) {
      newTop = bottom - lineHeight / 2;
    }
    if (oldTop >= y) {
      newTop = top + lineHeight / 2;
    }
    if (x < left) {
      newLeft = left + 1;
    }
    if (x > right) {
      newLeft = right - 1;
    }
    range = caretRangeFromPoint(newLeft, newTop);
    resetNativeSeletion(range);
  }
  if (position === 'start') {
    range = caretRangeFromPoint(left, top + lineHeight / 2);
  }
  if (position === 'end') {
    range = caretRangeFromPoint(right - 1, bottom - lineHeight / 2);
  }
  resetNativeSeletion(range);
}

function focusRichTextByModel(
  position: SelectionPosition,
  model: BaseBlockModel
) {
  const element = getBlockElementByModel(model);
  const editableContainer = element.querySelector('[contenteditable]');
  if (editableContainer) {
    focusRichText(position, editableContainer);
  }
}

export function focusPreviousBlock(
  model: BaseBlockModel,
  position?: SelectionPosition
) {
  const page = getDefaultPageBlock(model);
  const container = getContainerByModel(model);

  let nextPosition = position;
  if (nextPosition) {
    page.lastSelectionPosition = nextPosition;
  } else if (page.lastSelectionPosition) {
    nextPosition = page.lastSelectionPosition;
  }

  const preNodeModel = getPreviousBlock(container, model.id);
  if (preNodeModel && nextPosition) {
    focusRichTextByModel(nextPosition, preNodeModel);
  }
}

export function focusNextBlock(
  model: BaseBlockModel,
  position: SelectionPosition = 'start'
) {
  const page = getDefaultPageBlock(model);
  // const container = getContainerByModel(model);

  let nextPosition = position;
  if (nextPosition) {
    page.lastSelectionPosition = nextPosition;
  } else if (page.lastSelectionPosition) {
    nextPosition = page.lastSelectionPosition;
  }
  const nextNodeModel = getNextBlock(model.id);
  if (nextNodeModel) {
    focusRichTextByModel(nextPosition, nextNodeModel);
  }
}

// We should determine if the cursor is at the edge of the block, since a cursor at edge may have two cursor points
// but only one bounding rect.
// If a cursor is at the edge of a block, its previous cursor rect will not equal to the next one.
function isAtLineEdge(range: Range) {
  if (
    range.startOffset > 0 &&
    Number(range.startContainer.textContent?.length) - range.startOffset > 0
  ) {
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

export function handleKeyUp(model: ExtendedModel, editableContainer: Element) {
  const selection = window.getSelection();
  if (selection) {
    const range = selection.getRangeAt(0);
    const { height, left, top } = range.getBoundingClientRect();
    // if cursor is on the first line and has no text, height is 0
    if (height === 0 && top === 0) {
      const rect = range.startContainer.parentElement?.getBoundingClientRect();
      rect && focusPreviousBlock(model, new Point(rect.left, rect.top));
      return PREVENT_DEFAULT;
    }
    // TODO resolve compatible problem
    const newRange = caretRangeFromPoint(left, top - height / 2);
    if (
      (!newRange || !editableContainer.contains(newRange.startContainer)) &&
      !isAtLineEdge(range)
    ) {
      focusPreviousBlock(model, new Point(left, top));
      return PREVENT_DEFAULT;
    }
  }
  return ALLOW_DEFAULT;
}

export function handleKeyDown(
  model: ExtendedModel,
  textContainer: HTMLElement
) {
  const selection = window.getSelection();
  if (selection) {
    const range = selection.getRangeAt(0);
    const { bottom, left, height } = range.getBoundingClientRect();
    // if cursor is on the last line and has no text, height is 0
    if (height === 0 && bottom === 0) {
      const rect = range.startContainer.parentElement?.getBoundingClientRect();
      rect && focusNextBlock(model, new Point(rect.left, rect.top));
      return PREVENT_DEFAULT;
    }
    // TODO resolve compatible problem
    const newRange = caretRangeFromPoint(left, bottom + height / 2);
    if (!newRange || !textContainer.contains(newRange.startContainer)) {
      focusNextBlock(model, new Point(left, bottom));
      return PREVENT_DEFAULT;
    }
    // if cursor is at the edge of a block, it may out of the textContainer after keydown
    if (isAtLineEdge(range)) {
      const {
        height,
        left,
        bottom: nextBottom,
      } = newRange.getBoundingClientRect();
      const nextRange = caretRangeFromPoint(left, nextBottom + height / 2);
      if (!nextRange || !textContainer.contains(nextRange.startContainer)) {
        focusNextBlock(
          model,
          new Point(
            newRange.startContainer.parentElement?.offsetLeft || left,
            bottom
          )
        );
        return PREVENT_DEFAULT;
      }
    }
  }
  return ALLOW_DEFAULT;
}

export function resetNativeSeletion(range: Range | null) {
  const selection = window.getSelection();
  selection?.removeAllRanges();
  range && selection?.addRange(range);
}

export function focusRichTextByOffset(richTextParent: HTMLElement, x: number) {
  const richText = richTextParent.querySelector('rich-text');
  assertExists(richText);
  const bbox = richText.getBoundingClientRect();
  const y = bbox.y + bbox.height / 2;
  const range = caretRangeFromPoint(x, y);
  if (range?.startContainer instanceof Node) {
    resetNativeSeletion(range);
  }
}

export function focusRichTextStart(richText: RichText) {
  const start = richText.querySelector('p')?.childNodes[0] as ChildNode;
  const range = document.createRange();
  range.setStart(start, 0);
  resetNativeSeletion(range);
}

export function getCurrentRange() {
  const selection = window.getSelection() as Selection;
  return selection.getRangeAt(0);
}

export function isNoneSelection() {
  const selection = window.getSelection();
  if (!selection) return true;
  return selection.type === 'None';
}

export function isCollapsedSelection() {
  const selection = window.getSelection();
  if (!selection) return false;
  return selection.isCollapsed;
}

export function isRangeSelection() {
  const selection = window.getSelection();
  if (!selection) return false;
  return !selection.isCollapsed;
}

export function isMultiBlockRange(range: Range) {
  return range.commonAncestorContainer.nodeType !== Node.TEXT_NODE;
}

export function getSelectInfo() {
  const selection = window.getSelection();
  let selectedBlocks: SelectedBlock[] = [];
  if (selection && selection.type !== 'None') {
    const range = selection.getRangeAt(0);
    const models = getModelsByRange(getCurrentRange());
    selectedBlocks = models.map(model => _getSelectedBlock(model));
    if (selectedBlocks.length > 0) {
      const firstIndex = getQuillIndexByNativeSelection(
        range.startContainer,
        range.startOffset as number
      );
      const endIndex = getQuillIndexByNativeSelection(
        range.endContainer,
        range.endOffset as number
      );
      selectedBlocks[0].startPos = firstIndex;
      selectedBlocks[selectedBlocks.length - 1].endPos = endIndex;
    }
  }
  return {
    type: selection?.type || 'None',
    selectedBlocks,
  };
}

function _getSelectedBlock(model: BaseBlockModel): SelectedBlock {
  const block = {
    id: model.id,
    children: model.children.map(child => _getSelectedBlock(child)),
  };
  return block;
}
