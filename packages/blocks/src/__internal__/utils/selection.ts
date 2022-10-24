import type { BaseBlockModel, Store } from '@blocksuite/store';
import { RichText } from '../rich-text/rich-text';
import { PREVENT_DEFAULT, ALLOW_DEFAULT } from './consts';
import {
  assertExists,
  caretRangeFromPoint,
  fixCurrentRangeToText,
  matchFlavours,
} from './std';
import {
  ExtendedModel,
  SelectedBlock,
  SelectionInfo,
  SelectionPosition,
} from './types';
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
import type { SelectionEvent } from './gesture';

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
    const newRange = document.createRange();
    let firstNode = editableContainer.firstChild;
    while (firstNode?.firstChild) {
      firstNode = firstNode.firstChild;
    }
    if (firstNode) {
      newRange.setStart(firstNode, 0);
      newRange.setEnd(firstNode, 0);
    }
    range = newRange;
  }
  if (position === 'end') {
    const newRange = document.createRange();
    let lastNode = editableContainer.lastChild;
    while (lastNode?.lastChild) {
      lastNode = lastNode.lastChild;
    }
    if (lastNode) {
      newRange.setStart(lastNode, lastNode.textContent?.length || 0);
      newRange.setEnd(lastNode, lastNode.textContent?.length || 0);
    }
    range = newRange;
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
      const nextBlock = getNextBlock(model.id);
      if (!nextBlock) {
        return ALLOW_DEFAULT;
      }
      rect && focusNextBlock(model, new Point(rect.left, rect.top));
      return PREVENT_DEFAULT;
    }
    // TODO resolve compatible problem
    const newRange = caretRangeFromPoint(left, bottom + height / 2);
    if (!newRange || !textContainer.contains(newRange.startContainer)) {
      const nextBlock = getNextBlock(model.id);
      if (!nextBlock) {
        return ALLOW_DEFAULT;
      }
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

function getSelectedBlock(models: BaseBlockModel[]): SelectedBlock[] {
  const result = [];
  const parentMap = new Map<string, SelectedBlock>();
  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    const parent = model.store.getParent(model);
    const block = { id: model.id, children: [] };
    if (!parent || !parentMap.has(parent.id)) {
      result.push(block);
    } else {
      parentMap.get(parent.id)?.children.push(block);
    }
    parentMap.set(model.id, block);
  }
  return result;
}

function getLastSelectBlock(blocks: SelectedBlock[]): SelectedBlock | null {
  if (blocks.length === 0) {
    return null;
  }
  const last = blocks[blocks.length - 1];
  if (last.children.length === 0) {
    return last;
  }
  return getLastSelectBlock(last.children);
}

export function getSelectInfo(store: Store): SelectionInfo {
  if (!store.root) {
    return {
      type: 'None',
      selectedBlocks: [],
    };
  }

  let type = 'None';
  let selectedBlocks: SelectedBlock[] = [];
  let selectedModels: BaseBlockModel[] = [];
  const page = getDefaultPageBlock(store.root);
  const { state } = page.selection;
  const nativeSelection = window.getSelection();
  if (state.type === 'block') {
    type = 'Block';
    const { selectedRichTexts } = state;
    selectedModels = selectedRichTexts.map(richText => richText.model);
  } else if (nativeSelection && nativeSelection.type !== 'None') {
    type = nativeSelection.type;
    selectedModels = getModelsByRange(getCurrentRange());
  }

  if (type !== 'None') {
    selectedBlocks = getSelectedBlock(selectedModels);
    if (type !== 'Block' && nativeSelection && selectedBlocks.length > 0) {
      const range = nativeSelection.getRangeAt(0);
      const firstIndex = getQuillIndexByNativeSelection(
        range.startContainer,
        range.startOffset as number,
        true
      );
      const endIndex = getQuillIndexByNativeSelection(
        range.endContainer,
        range.endOffset as number,
        false
      );
      selectedBlocks[0].startPos = firstIndex;
      const lastBlock = getLastSelectBlock(selectedBlocks);
      if (lastBlock) {
        lastBlock.endPos = endIndex;
      }
    }
  }
  return {
    type: type,
    selectedBlocks,
  };
}

export function handleNativeRangeDragMove(
  startRange: Range | null,
  e: SelectionEvent
) {
  let isForward = true;
  assertExists(startRange);
  const { startContainer, startOffset, endContainer, endOffset } = startRange;
  let currentRange = caretRangeFromPoint(e.raw.clientX, e.raw.clientY);
  if (currentRange?.comparePoint(endContainer, endOffset) === 1) {
    isForward = false;
    currentRange?.setEnd(endContainer, endOffset);
  } else {
    currentRange?.setStart(startContainer, startOffset);
  }
  if (currentRange) {
    currentRange = fixCurrentRangeToText(
      e.raw.clientX,
      e.raw.clientY,
      currentRange,
      isForward
    );
  }
  resetNativeSeletion(currentRange);
}

function isBlankAreaBetweenBlocks(startContainer: Node) {
  if (!(startContainer instanceof HTMLElement)) return false;
  return startContainer.className.includes('affine-paragraph-block-container');
}

function isBlankAreaAfterLastBlock(startContainer: HTMLElement) {
  return startContainer.tagName === 'GROUP-BLOCK';
}

function isBlankAreaBeforeFirstBlock(startContainer: HTMLElement) {
  if (!(startContainer instanceof HTMLElement)) return false;
  return startContainer.className.includes('affine-group-block-container');
}

export function isBlankArea(e: SelectionEvent) {
  const { cursor } = window.getComputedStyle(e.raw.target as Element);
  return cursor !== 'text';
}

export function handleNativeRangeClick(store: Store, e: SelectionEvent) {
  const range = caretRangeFromPoint(e.raw.clientX, e.raw.clientY);
  const startContainer = range?.startContainer;

  // click on rich text
  if (startContainer instanceof Node) {
    resetNativeSeletion(range);
  }

  if (!(startContainer instanceof HTMLElement)) return;

  if (
    isBlankAreaBetweenBlocks(startContainer) ||
    isBlankAreaBeforeFirstBlock(startContainer)
  ) {
    focusRichTextByOffset(startContainer, e.raw.clientX);
  } else if (isBlankAreaAfterLastBlock(startContainer)) {
    const { root } = store;
    const lastChild = root?.lastChild();
    assertExists(lastChild);
    if (matchFlavours(lastChild, ['paragraph', 'list'])) {
      const block = getBlockElementByModel(lastChild);
      focusRichTextByOffset(block, e.raw.clientX);
    }
  }
}

export function getSplicedTitle(title: HTMLInputElement) {
  const text = [...title.value];
  assertExists(title.selectionStart);
  assertExists(title.selectionEnd);
  text.splice(title.selectionStart, title.selectionEnd - title.selectionStart);
  return text.join('');
}
