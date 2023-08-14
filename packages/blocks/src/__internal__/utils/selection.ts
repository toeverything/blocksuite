import { IS_FIREFOX, SCROLL_THRESHOLD } from '@blocksuite/global/config';
import { assertExists, matchFlavours } from '@blocksuite/global/utils';
import type { BaseBlockModel, Page } from '@blocksuite/store';
import { type VirgoLine } from '@blocksuite/virgo';

import type { DocPageBlockComponent } from '../../page-block/doc/doc-page-block.js';
import {
  getBlockElementByModel,
  getDocPage,
  getDocPageByElement,
  getPageBlock,
} from './query.js';
import { Rect } from './rect.js';
import type { SelectionPosition } from './types.js';

declare global {
  interface Document {
    // firefox API
    caretPositionFromPoint(
      x: number,
      y: number
    ): {
      offsetNode: Node;
      offset: number;
    };
  }
}

export function caretRangeFromPoint(
  clientX: number,
  clientY: number
): Range | null {
  if (IS_FIREFOX) {
    const caret = document.caretPositionFromPoint(clientX, clientY);
    // TODO handle caret is covered by popup
    const range = document.createRange();
    range.setStart(caret.offsetNode, caret.offset);
    return range;
  }

  const range = document.caretRangeFromPoint(clientX, clientY);

  if (!range) {
    return null;
  }

  // See https://github.com/toeverything/blocksuite/issues/1382
  const rangeRects = range?.getClientRects();
  if (
    rangeRects &&
    rangeRects.length === 2 &&
    range.startOffset === range.endOffset &&
    clientY < rangeRects[0].y + rangeRects[0].height
  ) {
    const deltaX = (rangeRects[0].x | 0) - (rangeRects[1].x | 0);

    if (deltaX > 0) {
      range.setStart(range.startContainer, range.startOffset - 1);
      range.setEnd(range.endContainer, range.endOffset - 1);
    }
  }
  return range;
}

function setStartRange(editableContainer: Element) {
  const newRange = document.createRange();
  let firstNode = editableContainer.firstChild;
  while (firstNode?.firstChild) {
    firstNode = firstNode.firstChild;
  }
  if (firstNode) {
    newRange.setStart(firstNode, 0);
    newRange.setEnd(firstNode, 0);
  }
  return newRange;
}

function setEndRange(editableContainer: Element) {
  const newRange = document.createRange();
  let lastNode = editableContainer.lastChild;
  while (lastNode?.lastChild) {
    lastNode = lastNode.lastChild;
  }
  if (lastNode) {
    newRange.setStart(lastNode, lastNode.textContent?.length || 0);
    newRange.setEnd(lastNode, lastNode.textContent?.length || 0);
  }
  return newRange;
}

async function setNewTop(y: number, editableContainer: Element, zoom = 1) {
  const scrollContainer = editableContainer.closest('.affine-doc-viewport');
  const { top, bottom } = Rect.fromDOM(editableContainer);
  const { clientHeight } = document.documentElement;
  const lineHeight =
    (Number(
      window.getComputedStyle(editableContainer).lineHeight.replace(/\D+$/, '')
    ) || 16) * zoom;

  const compare = bottom < y;
  switch (compare) {
    case true: {
      let finalBottom = bottom;
      if (bottom < SCROLL_THRESHOLD && scrollContainer) {
        scrollContainer.scrollTop =
          scrollContainer.scrollTop - SCROLL_THRESHOLD + bottom;
        // set scroll may have an animation, wait for over
        requestAnimationFrame(() => {
          finalBottom = editableContainer.getBoundingClientRect().bottom;
        });
      }
      return finalBottom - lineHeight / 2;
    }
    case false: {
      let finalTop = top;
      if (scrollContainer && top > clientHeight - SCROLL_THRESHOLD) {
        scrollContainer.scrollTop =
          scrollContainer.scrollTop + (top + SCROLL_THRESHOLD - clientHeight);
        // set scroll may has a animation, wait for over
        requestAnimationFrame(() => {
          finalTop = editableContainer.getBoundingClientRect().top;
        });
      }
      return finalTop + lineHeight / 2;
    }
  }
}

/**
 * As the title is a text area, this function does not yet have support for `SelectionPosition`.
 */
export function focusTitle(page: Page, index = Infinity, len = 0) {
  // TODO support SelectionPosition
  const pageComponent = getDocPage(page);
  if (!pageComponent) {
    throw new Error("Can't find page component!");
  }
  if (!pageComponent.titleVEditor) {
    throw new Error("Can't find title vEditor!");
  }
  if (index > pageComponent.titleVEditor.yText.length) {
    index = pageComponent.titleVEditor.yText.length;
  }
  pageComponent.titleVEditor.setVRange({ index, length: len });
}

export async function focusRichText(
  editableContainer: Element,
  position: SelectionPosition = 'end',
  zoom = 1
) {
  const isDocPage = !!getDocPageByElement(editableContainer);
  if (isDocPage) {
    editableContainer
      .querySelector<VirgoLine>('v-line')
      ?.scrollIntoView({ block: 'nearest' });
  }

  // TODO optimize how get scroll container
  const { left, right } = Rect.fromDOM(editableContainer);

  let range: Range | null = null;
  switch (position) {
    case 'start':
      range = setStartRange(editableContainer);
      break;
    case 'end':
      range = setEndRange(editableContainer);
      break;
    default: {
      const { x, y } = position;
      let newLeft = x;
      const newTop = await setNewTop(y, editableContainer, zoom);
      if (x <= left) {
        newLeft = left + 1;
      }
      if (x >= right) {
        newLeft = right - 1;
      }
      range = caretRangeFromPoint(newLeft, newTop);
      break;
    }
  }
  resetNativeSelection(range);
}

/**
 * @deprecated Use `selectionManager.set` instead.
 */
export function focusBlockByModel(
  model: BaseBlockModel,
  position: SelectionPosition = 'end',
  zoom = 1
) {
  if (matchFlavours(model, ['affine:note', 'affine:page'])) {
    throw new Error("Can't focus note or page!");
  }

  const pageBlock = getPageBlock(model) as DocPageBlockComponent;
  assertExists(pageBlock);

  const element = getBlockElementByModel(model);
  assertExists(element);
  const editableContainer = element?.querySelector('[contenteditable]');
  if (editableContainer) {
    focusRichText(editableContainer, position, zoom);
  }
}

export function resetNativeSelection(range: Range | null) {
  const selection = window.getSelection();
  assertExists(selection);
  selection.removeAllRanges();
  range && selection.addRange(range);
}

/**
 * Return true if has native selection in the document.
 *
 * @example
 * ```ts
 * const isNativeSelection = hasNativeSelection();
 * if (isNativeSelection) {
 *   // do something
 * }
 * ```
 */
export function hasNativeSelection() {
  const selection = window.getSelection();
  if (!selection) return false;

  // The `selection.rangeCount` attribute must return 0
  // if this is empty or either focus or anchor is not in the document tree,
  // and must return 1 otherwise.
  return !!selection.rangeCount;
}

export function getCurrentNativeRange(selection = window.getSelection()) {
  // When called on an <iframe> that is not displayed (e.g., where display: none is set) Firefox will return null
  // See https://developer.mozilla.org/en-US/docs/Web/API/Window/getSelection for more details
  if (!selection) {
    throw new Error('Failed to get current range, selection is null');
  }
  // Before the user has clicked a freshly loaded page, the rangeCount is 0.
  // The rangeCount will usually be 1.
  // But scripting can be used to make the selection contain more than one range.
  // See https://developer.mozilla.org/en-US/docs/Web/API/Selection/rangeCount for more details.
  if (selection.rangeCount === 0) {
    throw new Error('Failed to get current range, rangeCount is 0');
  }
  if (selection.rangeCount > 1) {
    console.warn('getCurrentRange may be wrong, rangeCount > 1');
  }
  return selection.getRangeAt(0);
}

export function handleNativeRangeAtPoint(x: number, y: number) {
  const range = caretRangeFromPoint(x, y);
  const startContainer = range?.startContainer;
  // click on rich text
  if (startContainer instanceof Node) {
    resetNativeSelection(range);
  }
}

/**
 * Get the closest element in the horizontal position
 */
export function getHorizontalClosestElement<
  K extends keyof HTMLElementTagNameMap
>(
  clientY: number,
  selectors: K,
  container?: Element
): HTMLElementTagNameMap[K] | null;
export function getHorizontalClosestElement<
  K extends keyof SVGElementTagNameMap
>(
  clientY: number,
  selectors: K,
  container?: Element
): SVGElementTagNameMap[K] | null;
export function getHorizontalClosestElement<E extends Element = Element>(
  clientY: number,
  selectors: string,
  container?: Element
): E | null;
export function getHorizontalClosestElement(
  clientY: number,
  selector: string,
  container: Element = document.body
) {
  // sort for binary search (In fact, it is generally orderly, just in case)
  const elements = Array.from(container.querySelectorAll(selector)).sort(
    (a, b) =>
      // getBoundingClientRect here actually run so fast because of the browser cache
      a.getBoundingClientRect().top > b.getBoundingClientRect().top ? 1 : -1
  );
  // short circuit
  const len = elements.length;
  if (len === 0) return null;
  if (len === 1) return elements[0];

  if (clientY < elements[0].getBoundingClientRect().top) return elements[0];
  if (clientY > elements[len - 1].getBoundingClientRect().bottom)
    return elements[len - 1];

  // binary search
  let left = 0;
  let right = len - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const minElement = elements[mid];
    if (
      clientY <= minElement.getBoundingClientRect().bottom &&
      (mid === 0 || clientY > elements[mid - 1].getBoundingClientRect().bottom)
    ) {
      return elements[mid];
    }
    if (minElement.getBoundingClientRect().top > clientY) {
      right = mid - 1;
    } else {
      left = mid + 1;
    }
  }

  return null;
}
