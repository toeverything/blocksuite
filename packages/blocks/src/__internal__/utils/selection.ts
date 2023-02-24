import type { FrameBlockComponent } from '@blocksuite/blocks';
import { BLOCK_ID_ATTR, SCROLL_THRESHOLD } from '@blocksuite/global/config';
import {
  assertExists,
  caretRangeFromPoint,
  matchFlavours,
  nonTextBlock,
} from '@blocksuite/global/utils';
import type { BaseBlockModel, Page } from '@blocksuite/store';

import type { RichText } from '../rich-text/rich-text.js';
import { asyncFocusRichText } from './common-operations.js';
import type { IPoint, SelectionEvent } from './gesture.js';
import {
  getBlockElementByModel,
  getDefaultPageBlock,
  getElementFromEventTarget,
  getModelByElement,
  getModelsByRange,
  getNextBlock,
  getPreviousBlock,
  getQuillIndexByNativeSelection,
  getTextNodeBySelectedBlock,
} from './query.js';
import { Rect } from './rect.js';
import type { BlockRange, SelectionPosition } from './types.js';

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

async function setNewTop(y: number, editableContainer: Element) {
  const scrollContainer = editableContainer.closest('.affine-default-viewport');
  const { top, bottom } = Rect.fromDom(editableContainer);
  const { clientHeight } = document.documentElement;
  const lineHeight =
    Number(
      window.getComputedStyle(editableContainer).lineHeight.replace(/\D+$/, '')
    ) || 16;
  const compare = bottom < y;
  switch (compare) {
    case true: {
      let finalBottom = bottom;
      if (bottom < SCROLL_THRESHOLD && scrollContainer) {
        scrollContainer.scrollTop =
          scrollContainer.scrollTop - SCROLL_THRESHOLD + bottom;
        // set scroll may has a animation, wait for over
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
export function focusTitle(index = Infinity) {
  const titleElement = document.querySelector(
    '.affine-default-page-block-title'
  ) as HTMLTextAreaElement | null;
  if (!titleElement) {
    throw new Error("Can't find title element");
  }
  if (index > titleElement.value.length) {
    index = titleElement.value.length;
  }
  titleElement.setSelectionRange(index, index);
  titleElement.focus();
}

export async function focusRichText(
  editableContainer: Element,
  position: SelectionPosition = 'end'
) {
  // TODO optimize how get scroll container
  const { left, right } = Rect.fromDom(editableContainer);
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
      const newTop = await setNewTop(y, editableContainer);
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
  position: SelectionPosition = 'end'
) {
  if (matchFlavours(model, ['affine:frame', 'affine:page'])) {
    throw new Error("Can't focus frame or page!");
  }
  const defaultPageBlock = getDefaultPageBlock(model);
  // If focus on a follow block, we should select the block
  if (
    matchFlavours(model, [
      'affine:embed',
      'affine:divider',
      'affine:code',
      'affine:database',
    ])
  ) {
    if (!defaultPageBlock.selection) {
      // TODO fix this
      // In the edgeless mode
      return;
    }
    defaultPageBlock.selection.state.clear();
    const rect = getBlockElementByModel(model)?.getBoundingClientRect();
    rect && defaultPageBlock.signals.updateSelectedRects.emit([rect]);
    const element = getBlockElementByModel(model);
    assertExists(element);
    defaultPageBlock.selection.state.selectedBlocks.push(element);
    if (matchFlavours(model, ['affine:database'])) {
      const elements = model.children
        .map(child => getBlockElementByModel(child))
        .filter((element): element is HTMLElement => element !== null);
      defaultPageBlock.selection.state.selectedBlocks.push(...elements);
    }
    defaultPageBlock.selection.state.type = 'block';
    resetNativeSelection(null);
    (document.activeElement as HTMLTextAreaElement).blur();
    return;
  }

  const element = getBlockElementByModel(model);
  const editableContainer = element?.querySelector('[contenteditable]');
  defaultPageBlock.selection && defaultPageBlock.selection.state.clear();
  if (editableContainer) {
    defaultPageBlock.selection &&
      defaultPageBlock.selection.setFocusedBlockIndexByElement(
        element as Element
      );
    focusRichText(editableContainer, position);
  }
}

export function focusPreviousBlock(
  model: BaseBlockModel,
  position?: SelectionPosition
) {
  const page = getDefaultPageBlock(model);

  let nextPosition = position;
  if (nextPosition) {
    page.lastSelectionPosition = nextPosition;
  } else if (page.lastSelectionPosition) {
    nextPosition = page.lastSelectionPosition;
  }

  const preNodeModel = getPreviousBlock(model);
  if (preNodeModel && nextPosition) {
    focusBlockByModel(preNodeModel, nextPosition);
  }
}

export function focusNextBlock(
  model: BaseBlockModel,
  position: SelectionPosition = 'start'
) {
  const page = getDefaultPageBlock(model);
  let nextPosition = position;
  if (nextPosition) {
    page.lastSelectionPosition = nextPosition;
  } else if (page.lastSelectionPosition) {
    nextPosition = page.lastSelectionPosition;
  }
  const nextNodeModel = getNextBlock(model);

  if (nextNodeModel) {
    focusBlockByModel(nextNodeModel, nextPosition);
  }
}

export function resetNativeSelection(range: Range | null) {
  const selection = window.getSelection();
  assertExists(selection);
  selection.removeAllRanges();
  range && selection.addRange(range);
}

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
export function isMultiBlockRange(range = getCurrentRange()) {
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
export function isMultiLineRange(range = getCurrentRange()) {
  // Get the selection height
  const { height } = range.getBoundingClientRect();

  const oneLineRange = document.createRange();
  oneLineRange.setStart(range.startContainer, range.startOffset);
  // Get the base line height
  const { height: oneLineHeight } = oneLineRange.getBoundingClientRect();
  return height > oneLineHeight;
}

export function getCurrentRange(selection = window.getSelection()) {
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

export function getCurrentBlockRange(page: Page): BlockRange | null {
  // check exist block selection
  if (page.root) {
    const pageBlock = getDefaultPageBlock(page.root);
    if (pageBlock.selection) {
      const selectedBlock = pageBlock.selection.state.selectedBlocks;
      const models = selectedBlock.map(element => getModelByElement(element));
      // .filter(model => model.text);
      if (models.length) {
        return {
          type: 'Block',
          startModel: models[0],
          startOffset: 0,
          endModel: models[models.length - 1],
          endOffset: models[models.length - 1].text?.length ?? 0,
          betweenModels: models.slice(1, models.length - 1),
        };
      }
    }
  }
  // check exist native selection
  if (hasNativeSelection()) {
    const range = getCurrentRange();
    // TODO check range is in page
    return nativeRangeToBlockRange(range);
  }
  return null;
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
  e: SelectionEvent
) {
  const isEdgelessMode = !!document.querySelector('affine-edgeless-page');

  // Range from current mouse position
  let currentRange = caretRangeFromPoint(e.raw.clientX, e.raw.clientY);
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

  const { clientX: x, clientY: y } = e.raw;

  let currentFrame: FrameBlockComponent | null | undefined = null;
  let shouldUpdateCurrentRange = false;

  if (isEdgelessMode) {
    currentFrame = startFrame;
    shouldUpdateCurrentRange = true;
  } else {
    const el = document.elementFromPoint(x, y);
    if (el?.classList.contains('quill-container')) {
      return;
    }
    currentFrame = el?.closest('affine-frame');
    const currentEditor = el?.closest('.ql-editor');
    // if we are not pointing at an editor, we should update the current range
    // if we are not even pointing at a frame, we should find one and update the current range
    shouldUpdateCurrentRange = !currentFrame || !currentEditor;
    currentFrame ??= getClosestFrame(y);
  }
  if (!currentFrame) return;

  if (shouldUpdateCurrentRange) {
    const closestEditor = getClosestEditor(y, currentFrame);
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

export function isBlankArea(e: SelectionEvent) {
  const { cursor } = window.getComputedStyle(e.raw.target as Element);
  return cursor !== 'text';
}

// Retarget selection back to the nearest block
// when user clicks on the edge of page (page mode) or frame (edgeless mode).
// See https://github.com/toeverything/blocksuite/pull/878
function handleClickRetargeting(page: Page, e: SelectionEvent) {
  const targetEl = getElementFromEventTarget(e.raw.target);
  const block = targetEl?.closest(`[${BLOCK_ID_ATTR}]`) as {
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

  const horizontalElement = getClosestEditor(clientY);
  if (!horizontalElement) return;

  const model = getModelByElement(horizontalElement);
  const rect = horizontalElement.getBoundingClientRect();
  if (matchFlavours(model, nonTextBlock) && clientY > rect.bottom) {
    const parent = page.getParent(model);
    assertExists(parent);
    const id = page.addBlockByFlavour('affine:paragraph', {}, parent.id);
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

export function handleNativeRangeClick(page: Page, e: SelectionEvent) {
  // if not left click
  if (e.button) return;

  const range = caretRangeFromPoint(e.raw.clientX, e.raw.clientY);
  const startContainer = range?.startContainer;
  // click on rich text
  if (startContainer instanceof Node) {
    resetNativeSelection(range);
  }

  handleClickRetargeting(page, e);
}

export function handleNativeRangeDblClick(page: Page, e: SelectionEvent) {
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
    if (currentCharIndex === -1) return null;

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

export function isEmbed(e: SelectionEvent) {
  if ((e.raw.target as HTMLElement).classList.contains('resize')) {
    return true;
  }
  return false;
}

export function isDatabase(e: SelectionEvent) {
  if ((e.raw.target as HTMLElement).className.startsWith('affine-database')) {
    return true;
  }
  return false;
}

export function blockRangeToNativeRange(blockRange: BlockRange) {
  const [startNode, startOffset] = getTextNodeBySelectedBlock(
    blockRange.startModel,
    blockRange.startOffset
  );
  if (!startNode) {
    throw new Error(
      'Failed to convert block range to native range. Start node is null.'
    );
  }
  const [endNode, endOffset] = getTextNodeBySelectedBlock(
    blockRange.endModel,
    blockRange.endOffset
  );
  if (!startNode) {
    throw new Error(
      'Failed to convert block range to native range. End node is null.'
    );
  }
  const range = new Range();
  range.setStart(startNode, startOffset);
  range.setEnd(endNode, endOffset);
  return range;
}

export function nativeRangeToBlockRange(range: Range): BlockRange {
  const models = getModelsByRange(range);
  const startOffset = getQuillIndexByNativeSelection(
    range.startContainer,
    range.startOffset
  );
  const endOffset = getQuillIndexByNativeSelection(
    range.endContainer,
    range.endOffset
  );
  return {
    type: 'Native',
    startModel: models[0],
    startOffset,
    endModel: models[models.length - 1],
    endOffset,
    betweenModels: models.slice(1, -1),
  };
}

/**
 * Sometimes, the block in the block range is updated, we need to update the block range manually.
 *
 * Note: it will mutate the `blockRange` object.
 */
export function updateBlockRange(
  blockRange: BlockRange,
  oldModel: BaseBlockModel,
  newModel: BaseBlockModel
) {
  if (blockRange.startModel === oldModel) {
    blockRange.startModel = newModel;
  }
  if (blockRange.endModel === oldModel) {
    blockRange.endModel = newModel;
  }
  blockRange.betweenModels = blockRange.betweenModels.map(model =>
    model === oldModel ? newModel : model
  );
  return blockRange;
}

/**
 * Restore the block selection.
 * See also {@link resetNativeSelection}
 */
export function restoreSelection(blockRange: BlockRange) {
  if (blockRange.type === 'Native') {
    const range = blockRangeToNativeRange(blockRange);
    resetNativeSelection(range);

    // Try clean block selection
    const defaultPageBlock = getDefaultPageBlock(blockRange.startModel);
    if (!defaultPageBlock.selection) {
      // In the edgeless mode
      return;
    }
    defaultPageBlock.selection.clear();
    return;
  }
  const defaultPageBlock = getDefaultPageBlock(blockRange.startModel);
  if (!defaultPageBlock.selection) {
    // In the edgeless mode
    return;
  }
  const models =
    blockRange.startModel === blockRange.endModel
      ? [blockRange.startModel]
      : [
          blockRange.startModel,
          ...blockRange.betweenModels,
          blockRange.endModel,
        ];
  defaultPageBlock.selection.clear();
  // get fresh elements
  defaultPageBlock.selection.state.type = 'block';
  defaultPageBlock.selection.state.selectedBlocks = models
    .map(model => getBlockElementByModel(model))
    .filter(Boolean) as Element[];
  defaultPageBlock.selection.refreshSelectedBlocksRects();
  // Try clean native selection
  resetNativeSelection(null);
  (document.activeElement as HTMLTextAreaElement).blur();
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
  return getHorizontalClosestElement(clientY, '.ql-editor', container);
}

/**
 * Get the closest frame element in the horizontal position
 */
export function getClosestFrame(clientY: number) {
  return getHorizontalClosestElement(clientY, 'affine-frame');
}
