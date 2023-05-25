import { BLOCK_ID_ATTR, SCROLL_THRESHOLD } from '@blocksuite/global/config';
import {
  assertExists,
  caretRangeFromPoint,
  matchFlavours,
  nonTextBlock,
} from '@blocksuite/global/utils';
import type { PointerEventState } from '@blocksuite/lit';
import type { BaseBlockModel, Page } from '@blocksuite/store';
import { getTextNodesFromElement, type VirgoLine } from '@blocksuite/virgo';

import type { FrameBlockComponent } from '../../frame-block/index.js';
import { DefaultPageBlockComponent } from '../../page-block/default/default-page-block.js';
import type { RichText } from '../rich-text/rich-text.js';
import { asyncFocusRichText } from './common-operations.js';
import {
  type BlockComponentElement,
  getBlockElementByModel,
  getDefaultPage,
  getElementFromEventTarget,
  getModelByElement,
  getModelsByRange,
  getNextBlock,
  getPageBlock,
  getPreviousBlock,
} from './query.js';
import { Rect } from './rect.js';
import type { IPoint, SelectionPosition } from './types.js';

// /[\p{Alphabetic}\p{Mark}\p{Decimal_Number}\p{Connector_Punctuation}\p{Join_Control}]/u
const notStrictCharacterReg = /[^\p{Alpha}\p{M}\p{Nd}\p{Pc}\p{Join_C}]/u;
const notStrictCharacterAndSpaceReg =
  /[^\p{Alpha}\p{M}\p{Nd}\p{Pc}\p{Join_C}\s]/u;

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
  const scrollContainer = editableContainer.closest('.affine-default-viewport');
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
  const pageComponent = getDefaultPage(page);
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
  // TODO optimize how get scroll container
  const { left, right } = Rect.fromDOM(editableContainer);
  editableContainer
    .querySelector<VirgoLine>('v-line')
    ?.scrollIntoView({ block: 'nearest' });
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

export function focusBlockByModel(
  model: BaseBlockModel,
  position: SelectionPosition = 'end',
  zoom = 1
) {
  if (matchFlavours(model, ['affine:frame', 'affine:page'])) {
    throw new Error("Can't focus frame or page!");
  }

  const pageBlock = getPageBlock(model);
  assertExists(pageBlock);
  const isPageBlock = pageBlock instanceof DefaultPageBlockComponent;

  // If focus on a follow block, we should select the block
  if (
    isPageBlock &&
    matchFlavours(model, [
      'affine:embed',
      'affine:divider',
      'affine:code',
      'affine:database',
      'affine:bookmark',
    ])
  ) {
    pageBlock.selection.state.clearSelection();
    const rect = getBlockElementByModel(model)?.getBoundingClientRect();
    rect && pageBlock.slots.selectedRectsUpdated.emit([rect]);
    const element = getBlockElementByModel(model);
    assertExists(element);
    pageBlock.selection.state.selectedBlocks.push(element);
    if (matchFlavours(model, ['affine:database'])) {
      const elements = model.children
        .map(child => getBlockElementByModel(child))
        .filter(
          (element): element is BlockComponentElement => element !== null
        );
      pageBlock.selection.state.selectedBlocks.push(...elements);
    }
    pageBlock.selection.state.type = 'block';
    resetNativeSelection(null);
    (document.activeElement as HTMLTextAreaElement).blur();
    return;
  }
  const element = getBlockElementByModel(model);
  const editableContainer = element?.querySelector('[contenteditable]');
  if (editableContainer) {
    if (isPageBlock) {
      pageBlock.selection.state.clearSelection();
      pageBlock.selection.setFocusedBlock(element as Element);
    }
    focusRichText(editableContainer, position, zoom);
  }
}

// Focus previous block in page mode.
export function focusPreviousBlock(
  model: BaseBlockModel,
  position: SelectionPosition = 'start',
  zoom = 1
) {
  const pageBlock = getPageBlock(model);
  assertExists(pageBlock);

  let nextPosition = position;
  if (pageBlock instanceof DefaultPageBlockComponent) {
    if (nextPosition) {
      pageBlock.lastSelectionPosition = nextPosition;
    } else if (pageBlock.lastSelectionPosition) {
      nextPosition = pageBlock.lastSelectionPosition;
    }
  }

  const preNodeModel = getPreviousBlock(model);
  if (preNodeModel && nextPosition) {
    focusBlockByModel(preNodeModel, nextPosition, zoom);
  }
}

// Focus next block in page mode.
export function focusNextBlock(
  model: BaseBlockModel,
  position: SelectionPosition = 'start',
  zoom = 1
) {
  const pageBlock = getPageBlock(model);
  assertExists(pageBlock);

  let nextPosition = position;
  if (pageBlock instanceof DefaultPageBlockComponent) {
    if (nextPosition) {
      pageBlock.lastSelectionPosition = nextPosition;
    } else if (pageBlock.lastSelectionPosition) {
      nextPosition = pageBlock.lastSelectionPosition;
    }
  }

  const nextNodeModel = getNextBlock(model);
  if (nextNodeModel) {
    focusBlockByModel(nextNodeModel, nextPosition, zoom);
  }
}

export function resetNativeSelection(range: Range | null) {
  const selection = window.getSelection();
  assertExists(selection);
  selection.removeAllRanges();
  range && selection.addRange(range);
}

export function clearSelection(page: Page) {
  if (!page.root) return;
  getPageBlock(page.root)?.selection.clear();
}

/**
 * @deprecated Use {@link focusBlockByModel} instead.
 */
export function focusRichTextByOffset(richTextParent: HTMLElement, x: number) {
  const richText = richTextParent.querySelector('rich-text');
  assertExists(richText);
  const bbox = richText.getBoundingClientRect();
  const y = bbox.y + bbox.height / 2;
  const range = caretRangeFromPoint(x, y);
  if (range?.startContainer instanceof Node) {
    resetNativeSelection(range);
  }
}

/**
 * @deprecated Use {@link focusBlockByModel} instead.
 */
export function focusRichTextStart(richText: RichText) {
  const start = richText.querySelector('p')?.childNodes[0] as ChildNode;
  const range = document.createRange();
  range.setStart(start, 0);
  resetNativeSelection(range);
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

export function isCollapsedNativeSelection() {
  const selection = window.getSelection();
  if (!selection) return false;
  return selection.isCollapsed;
}

export function isRangeNativeSelection() {
  const selection = window.getSelection();
  if (!selection) return false;
  return !selection.isCollapsed;
}

/**
 * Determine if the range contains multiple block.
 *
 * Please check the difference between {@link isMultiLineRange} before use this function
 */
export function isMultiBlockRange(range = getCurrentNativeRange()) {
  return getModelsByRange(range).length > 1;
}

/**
 * Determine if the range contains multiple lines.
 *
 * Note that this function is very similar to {@link isMultiBlockRange},
 * but they are slightly different.
 *
 * Consider the following scenarios:
 * One block contains multiple lines,
 * if you select multiple lines of text under this block,
 * this function will return true,
 * but {@link isMultiBlockRange} will return false.
 */
export function isMultiLineRange(range = getCurrentNativeRange()) {
  // Get the selection height
  const { height } = range.getBoundingClientRect();

  const oneLineRange = document.createRange();
  oneLineRange.setStart(range.startContainer, range.startOffset);
  // Get the base line height
  const { height: oneLineHeight } = oneLineRange.getBoundingClientRect();
  return height > oneLineHeight;
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

function handleInFrameDragMove(
  startContainer: Node,
  startOffset: number,
  endContainer: Node,
  endOffset: number,
  currentRange: Range,
  isBackward: boolean
) {
  if (isBackward) {
    currentRange.setEnd(endContainer, endOffset);
  } else {
    currentRange.setStart(startContainer, startOffset);
  }
  resetNativeSelection(currentRange);
}

export function handleNativeRangeDragMove(
  startRange: Range | null,
  e: PointerEventState
) {
  const isEdgelessMode = !!document.querySelector('affine-edgeless-page');
  const { clientX: x, clientY: y, target } = e.raw;

  // Range from current mouse position
  let currentRange = caretRangeFromPoint(x, y);
  if (!currentRange) return;

  assertExists(startRange);
  const { startContainer, startOffset, endContainer, endOffset } = startRange;
  const _startContainer = (
    startContainer.nodeType === Node.TEXT_NODE
      ? startContainer.parentElement
      : startContainer
  ) as HTMLElement;
  const startFrame = _startContainer.closest('affine-frame');
  if (!startFrame) return;

  let currentFrame: FrameBlockComponent | null | undefined = null;
  let shouldUpdateCurrentRange = false;

  if (isEdgelessMode) {
    currentFrame = startFrame;
    shouldUpdateCurrentRange = true;
  } else {
    const el = document.elementFromPoint(x, y);
    if (el?.classList.contains('virgo-editor')) {
      return;
    }
    currentFrame = el?.closest('affine-frame');
    const currentEditor = el?.closest('.virgo-editor');
    // if we are not pointing at an editor, we should update the current range
    // if we are not even pointing at a frame, we should find one and update the current range
    shouldUpdateCurrentRange = !currentFrame || !currentEditor;
    currentFrame ??= getClosestFrame(y);
  }
  if (!currentFrame) return;

  if (shouldUpdateCurrentRange) {
    let closestEditor: Element | null = null;
    // In some cases, the target element may be HTMLDocument.
    if (target && 'closest' in target) {
      closestEditor = (target as HTMLElement).closest('.virgo-editor');
    }
    if (!closestEditor) {
      closestEditor = getClosestEditor(y, currentFrame);
    }
    if (!closestEditor) return;

    const newPoint = normalizePointIntoContainer({ x, y }, closestEditor);
    currentRange = caretRangeFromPoint(newPoint.x, newPoint.y);
    if (!currentRange) return;
    if (currentRange.endContainer.nodeType !== Node.TEXT_NODE) return;
    if (!currentFrame.contains(currentRange.endContainer)) return;
  }

  // Forward: ↓ →, Backward: ← ↑
  const isBackward = currentRange.comparePoint(endContainer, endOffset) === 1;
  handleInFrameDragMove(
    startContainer,
    startOffset,
    endContainer,
    endOffset,
    currentRange,
    isBackward
  );
}

/**
 * This function is used to normalize the point into the reasonable range of the container.
 *
 * It will set the point to the top-left or bottom-right corner
 * when the point is out of the horizontal range of container.
 */
function normalizePointIntoContainer(point: IPoint, container: Element) {
  const { top, left, right, bottom } = container.getBoundingClientRect();
  const newPoint = { ...point };
  const { x, y } = point;

  // need this offset to avoid the point is out of the container
  if (y < top) {
    newPoint.y = top + 4;
    newPoint.x = left + 4;
  } else if (y > bottom) {
    newPoint.y = bottom - 4;
    newPoint.x = right - 4;
  } else {
    if (x < left) {
      newPoint.x = left;
    } else if (x > right) {
      newPoint.x = right;
    }
  }

  return newPoint;
}

export function isBlankArea(e: PointerEventState) {
  const { cursor } = window.getComputedStyle(e.raw.target as Element);
  return cursor !== 'text';
}

// Retarget selection back to the nearest block
// when user clicks on the edge of page (page mode) or frame (edgeless mode).
// See https://github.com/toeverything/blocksuite/pull/878
function retargetClick(
  page: Page,
  e: PointerEventState,
  container?: HTMLElement
) {
  const targetElement = getElementFromEventTarget(e.raw.target);
  const block = targetElement?.closest(`[${BLOCK_ID_ATTR}]`) as {
    model?: BaseBlockModel;
    pageModel?: BaseBlockModel;
  } | null;
  const parentModel = block?.model || block?.pageModel;
  if (!parentModel) return;

  const shouldRetarget = matchFlavours(parentModel, [
    'affine:frame',
    'affine:page',
  ]);
  if (!shouldRetarget) return;

  const { clientX, clientY } = e.raw;

  const horizontalElement = getClosestEditor(clientY, container);
  if (horizontalElement?.closest('affine-database')) return;
  if (!horizontalElement) return;

  const model = getModelByElement(horizontalElement);
  const rect = horizontalElement.getBoundingClientRect();
  if (matchFlavours(model, nonTextBlock) && clientY > rect.bottom) {
    const parent = page.getParent(model);
    assertExists(parent);
    const id = page.addBlock('affine:paragraph', {}, parent.id);
    asyncFocusRichText(page, id);
    return;
  }

  if (clientX < rect.left) {
    const range = setStartRange(horizontalElement);
    resetNativeSelection(range);
  } else {
    const range = setEndRange(horizontalElement);
    resetNativeSelection(range);
  }
}

export function handleNativeRangeClick(
  page: Page,
  e: PointerEventState,
  container?: HTMLElement
) {
  // if not left click
  if (e.button) return;

  handleNativeRangeAtPoint(e.raw.clientX, e.raw.clientY);

  retargetClick(page, e, container);
}

export function handleNativeRangeAtPoint(x: number, y: number) {
  const range = caretRangeFromPoint(x, y);
  const startContainer = range?.startContainer;
  // click on rich text
  if (startContainer instanceof Node) {
    resetNativeSelection(range);
  }
}

export function handleNativeRangeDblClick() {
  const selection = window.getSelection();
  if (selection && selection.isCollapsed && selection.anchorNode) {
    const editableContainer =
      selection.anchorNode.parentElement?.closest('[contenteditable]');
    if (editableContainer) {
      return expandRangeByCharacter(selection, editableContainer);
    }
    return null;
  }
  return null;
}

function expandRangeByCharacter(selection: Selection, editableContainer: Node) {
  const leafNodes = leftFirstSearchLeafNodes(editableContainer);
  if (!leafNodes.length) {
    return null;
  }
  const [newRange, currentChar, currentNodeIndex] = getNewRangeForDblClick(
    leafNodes,
    selection
  );
  // try select range by segmenter
  const extendRange = trySelectBySegmenter(
    selection,
    newRange,
    currentChar,
    leafNodes,
    currentNodeIndex
  );

  // don't mutate selection if it's not changed
  if (extendRange) {
    resetNativeSelection(extendRange);
  }

  return extendRange;
}

function getNewStartAndEndForDblClick(
  currentNodeIndex: number,
  leafNodes: Text[],
  selection: Selection,
  checkReg: RegExp
) {
  let newStartNode = leafNodes[0];
  let newStartOffset = 0;
  let newEndNode = leafNodes[leafNodes.length - 1];
  let newEndOffset = newEndNode.textContent?.length || 0;
  // get startNode and startOffset
  for (let i = currentNodeIndex; i >= 0; i--) {
    const node = leafNodes[i];
    if (node instanceof Text) {
      const text = node.textContent?.slice(
        0,
        i === currentNodeIndex ? selection.anchorOffset : undefined
      );
      if (text) {
        const reverseText = Array.from(text).reverse().join('');
        const index = reverseText.search(checkReg);
        if (index !== -1) {
          newStartNode = node;
          newStartOffset = reverseText.length - index;
          break;
        }
      }
    }
  }
  // get endNode and endOffset
  for (let j = currentNodeIndex; j < leafNodes.length; j++) {
    const node = leafNodes[j];
    if (node instanceof Text) {
      const text = node.textContent?.slice(
        j === currentNodeIndex ? selection.anchorOffset : undefined
      );
      if (text) {
        const index = text.search(checkReg);
        if (index !== -1) {
          newEndNode = node;
          newEndOffset =
            j === currentNodeIndex ? selection.anchorOffset + index : index;
          break;
        }
      }
    }
  }
  return [newStartNode, newStartOffset, newEndNode, newEndOffset] as const;
}

function getNewRangeForDblClick(leafNodes: Text[], selection: Selection) {
  let startNode = leafNodes[0];
  let startOffset = 0;
  let endNode = leafNodes[leafNodes.length - 1];
  let endOffset = endNode.textContent?.length || 0;
  // if anchorNode is Element, it always has only one child
  const currentTextNode =
    selection.anchorNode instanceof Element
      ? selection.anchorNode.firstChild
      : selection.anchorNode;
  const currentChar =
    currentTextNode?.textContent?.[selection.anchorOffset] || '';
  const currentNodeIndex = leafNodes.findIndex(
    node => node === currentTextNode
  );
  // if current char is not character or blank, select this char
  if (
    currentChar &&
    notStrictCharacterAndSpaceReg.test(currentChar) &&
    currentTextNode
  ) {
    startNode = currentTextNode as Text;
    endNode = currentTextNode as Text;
    startOffset = selection.anchorOffset;
    endOffset = selection.anchorOffset + 1;
  } else {
    // expand selection to blank
    let checkReg = notStrictCharacterReg;
    // space only spend one char
    if (/\s/.test(currentChar)) {
      checkReg = /\S/;
    }
    // English character only expand English
    if (/\w/.test(currentChar)) {
      checkReg = /\W/;
    }
    const [newStartNode, newStartOffset, newEndNode, newEndOffset] =
      getNewStartAndEndForDblClick(
        currentNodeIndex,
        leafNodes,
        selection,
        checkReg
      );
    startNode = newStartNode;
    startOffset = newStartOffset;
    endNode = newEndNode;
    endOffset = newEndOffset;
  }
  const newRange = document.createRange();
  newRange.setStart(startNode, startOffset);
  newRange.setEnd(endNode, endOffset);
  return [newRange, currentChar, currentNodeIndex] as const;
}

function trySelectBySegmenter(
  selection: Selection,
  newRange: Range,
  currentChar: string,
  leafNodes: Array<Node>,
  currentNodeIndex: number
) {
  if (
    Intl.Segmenter &&
    !notStrictCharacterAndSpaceReg.test(currentChar) &&
    !/\w/.test(currentChar)
  ) {
    const [currentCharIndex, wordText] = getCurrentCharIndex(
      newRange,
      leafNodes,
      selection,
      currentChar
    );
    if (currentCharIndex === -1 || currentNodeIndex === -1) return null;

    // length for expand left
    let leftLength = currentCharIndex;
    // length for expand right
    let rightLength = wordText.length - currentCharIndex;
    // get and set new start node and offset
    for (let i = currentNodeIndex; i >= 0; i--) {
      const leafNode = leafNodes[i];
      const allTextLength =
        i === currentNodeIndex
          ? selection.anchorOffset
          : leafNode.textContent?.length || 0;
      if (leftLength <= allTextLength) {
        newRange.setStart(leafNode, allTextLength - leftLength);
        break;
      } else {
        leftLength = leftLength - allTextLength;
      }
    }
    // get and set new end node and offset
    for (let i = currentNodeIndex; i < leafNodes.length; i++) {
      const leafNode = leafNodes[i];
      const textLength = leafNode.textContent?.length || 0;
      const allTextLength =
        i === currentNodeIndex
          ? textLength - selection.anchorOffset
          : textLength;
      if (rightLength <= allTextLength) {
        newRange.setEnd(leafNode, textLength - allTextLength + rightLength);
        break;
      } else {
        rightLength = rightLength - allTextLength;
      }
    }
  }
  return newRange;
}

function getCurrentCharIndex(
  newRange: Range,
  leafNodes: Array<Node>,
  selection: Selection,
  currentChar: string
) {
  const rangeString = newRange.toString();
  // check all languages words
  const segmenter = new Intl.Segmenter([], { granularity: 'word' });
  const wordsIterator = segmenter.segment(rangeString)[Symbol.iterator]();
  const words = Array.from(wordsIterator);

  if (words.length === 0) {
    return [-1, ''] as const;
  }

  let absoluteOffset = 0;
  let started = false;
  // get absolute offset of current cursor
  for (let i = 0; i < leafNodes.length; i++) {
    const leafNode = leafNodes[i];
    if (started || leafNode === newRange.startContainer) {
      started = true;
      if (leafNode !== selection.anchorNode) {
        absoluteOffset = absoluteOffset + (leafNode.textContent?.length || 0);
      } else {
        absoluteOffset =
          absoluteOffset + selection.anchorOffset - newRange.startOffset;
        break;
      }
    }
  }
  let wordText = words[words.length - 1].segment;
  // get word text of current cursor
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (absoluteOffset === word.index) {
      wordText = word.segment;
      break;
    }
    if (absoluteOffset < word.index) {
      wordText = words[i - 1].segment;
      break;
    }
  }
  const currentCharIndex = wordText.indexOf(currentChar);
  return [currentCharIndex, wordText] as const;
}

/**
 * left first search all leaf text nodes
 * @example
 *  <div><p>he<em>ll</em>o</p><p>world</p></div>
 *  => [he, ll, o, world]
 **/
export function leftFirstSearchLeafNodes(node: Node, leafNodes: Node[] = []) {
  if (node.nodeType === Node.TEXT_NODE) {
    leafNodes.push(node);
  } else {
    const children = node.childNodes;
    for (let i = 0; i < children.length; i++) {
      leftFirstSearchLeafNodes(children[i], leafNodes);
    }
  }
  return leafNodes as Text[];
}

export function getLastTextNode(node: Node) {
  return leftFirstSearchLeafNodes(node).pop();
}

export function getFirstTextNode(node: Node) {
  return leftFirstSearchLeafNodes(node)[0];
}

export function getSplicedTitle(title: HTMLTextAreaElement) {
  const text = [...title.value];
  assertExists(title.selectionStart);
  assertExists(title.selectionEnd);
  text.splice(title.selectionStart, title.selectionEnd - title.selectionStart);
  return text.join('');
}

export function isEmbed(e: PointerEventState) {
  if ((e.raw.target as HTMLElement).classList.contains('resize')) {
    return true;
  }
  return false;
}

export function isDatabase(e: PointerEventState) {
  const target = e.raw.target;
  if (!(target instanceof HTMLElement)) {
    // When user click on the list indicator,
    // the target is not an `HTMLElement`, instead `SVGElement`.
    return false;
  }
  if (
    // target.className.startsWith('affine-database') ||
    // // prevent select column from triggering block selection
    // target.tagName.startsWith('AFFINE-DATABASE')
    target.closest('affine-database-table')
  ) {
    return true;
  }
  return false;
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

/**
 * Get the closest editor element in the horizontal position
 */
export function getClosestEditor(clientY: number, container = document.body) {
  return getHorizontalClosestElement(clientY, '.virgo-editor', container);
}

/**
 * Get the closest frame element in the horizontal position
 */
export function getClosestFrame(clientY: number) {
  return getHorizontalClosestElement(clientY, 'affine-frame');
}

/**
 * Handle native range with triple click.
 */
export function handleNativeRangeTripleClick(e: PointerEventState) {
  const {
    raw: { clientX, clientY },
  } = e;
  const editor = document
    .elementFromPoint(clientX, clientY)
    ?.closest('.virgo-editor');

  if (!editor) return null;

  const textNodes = getTextNodesFromElement(editor);
  const first = textNodes[0];
  const last = textNodes[textNodes.length - 1];
  const range = new Range();
  range.setStart(first, 0);
  range.setEnd(last, Number(last.textContent?.length));
  resetNativeSelection(range);
  return range;
}
