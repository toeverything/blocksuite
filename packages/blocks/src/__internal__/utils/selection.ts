import type { BaseBlockModel, Page } from '@blocksuite/store';
import type { RichText } from '../rich-text/rich-text.js';
import type { IPoint, SelectionEvent } from './gesture.js';
import {
  getBlockElementByModel,
  getContainerByModel,
  getCurrentRange,
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
import type {
  DomSelectionType,
  SelectedBlock,
  SelectionInfo,
  SelectionPosition,
} from './types.js';
import { BLOCK_ID_ATTR, SCROLL_THRESHOLD } from '@blocksuite/global/config';
import {
  assertExists,
  caretRangeFromPoint,
  matchFlavours,
  nonTextBlock,
} from '@blocksuite/global/utils';
import { asyncFocusRichText } from './common-operations.js';

// /[\p{Alphabetic}\p{Mark}\p{Decimal_Number}\p{Connector_Punctuation}\p{Join_Control}]/u
const notStrictCharacterReg = /[^\p{Alpha}\p{M}\p{Nd}\p{Pc}\p{Join_C}]/u;
const notStrictCharacterAndSpaceReg =
  /[^\p{Alpha}\p{M}\p{Nd}\p{Pc}\p{Join_C}\s]/u;

// Find the first block or last block inside the frame,
// so that we can select the full text of the block when moving outside of the frame.
function findFrameBoundaryText(
  clientY: number,
  isBackward: boolean,
  container: HTMLElement
) {
  let textBlock: HTMLElement | null = null;

  if (isBackward) {
    const elem = container
      .querySelector('.ql-editor')
      ?.closest(`[${BLOCK_ID_ATTR}]`) as HTMLElement;
    if (elem) {
      const rect = elem.getBoundingClientRect();
      // handle dragging backward
      if (clientY <= rect.top) {
        textBlock = elem;
      }
    }
  } else {
    const textBlocks = container.querySelectorAll('.ql-editor');
    if (textBlocks.length) {
      const elem = textBlocks[textBlocks.length - 1].closest(
        `[${BLOCK_ID_ATTR}]`
      ) as HTMLElement;
      if (elem) {
        const rect = elem.getBoundingClientRect();
        // handle dragging forward
        if (clientY >= rect.bottom) {
          textBlock = elem;
        }
      }
    }
  }

  const text = textBlock?.querySelector('.ql-editor');
  assertExists(text);
  return text;
}

function computeCrossFrameRange(
  clientX: number,
  clientY: number,
  offset: IPoint,
  startRange: Range,
  currentRange: Range,
  isBackward: boolean,
  container: HTMLElement
) {
  const text = findFrameBoundaryText(clientY, isBackward, container);
  const rect = text.getBoundingClientRect();

  // Pick a position inside the text rect
  const newY = isBackward
    ? rect.bottom - offset.y - 6
    : rect.top - offset.y + 6;
  const newRange = caretRangeFromPoint(clientX, newY);

  if (!newRange || !text.firstChild) return currentRange;

  // Select the full text of the first block,
  // when dragging backward outside of the first block in frame
  if (isBackward && text.firstChild.firstChild) {
    newRange.setStartBefore(text.firstChild.firstChild);
    newRange.setEnd(startRange.startContainer, startRange.startOffset);
  }
  // Select the full text of the last block,
  // when dragging forward outside of the last block in frame
  else if (!isBackward && text.firstChild.lastChild) {
    newRange.setStart(startRange.startContainer, startRange.startOffset);
    // should update `endOffset`
    if (text.firstChild.firstChild === text.firstChild.lastChild) {
      newRange.setEnd(
        text.firstChild.firstChild,
        text.firstChild.firstChild.textContent?.length || 0
      );
    } else {
      newRange.setEndAfter(text.firstChild.lastChild);
    }
  }
  return newRange;
}

export function setStartRange(editableContainer: Element) {
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

export function setEndRange(editableContainer: Element) {
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
      resetNativeSelection(range);
      break;
    }
  }
  resetNativeSelection(range);
}

export function focusBlockByModel(
  model: BaseBlockModel,
  position: SelectionPosition = 'end'
) {
  const defaultPageBlock = getDefaultPageBlock(model);
  if (
    matchFlavours(model, [
      'affine:embed',
      'affine:divider',
      'affine:code',
      'affine:database',
    ])
  ) {
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
  defaultPageBlock.selection.state.clear();
  if (editableContainer) {
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
  const container = getContainerByModel(model);

  let nextPosition = position;
  if (nextPosition) {
    page.lastSelectionPosition = nextPosition;
  } else if (page.lastSelectionPosition) {
    nextPosition = page.lastSelectionPosition;
  }

  const preNodeModel = getPreviousBlock(container, model.id);
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
  const nextNodeModel = getNextBlock(model.id);

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

function getSelectedBlock(models: BaseBlockModel[]): SelectedBlock[] {
  const result = [];
  const parentMap = new Map<string, SelectedBlock>();
  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    const parent = model.page.getParent(model);
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

export function getSelectInfo(page: Page): SelectionInfo {
  if (!page.root) {
    return {
      type: 'None',
      selectedBlocks: [],
    };
  }

  let type: SelectionInfo['type'] = 'None';
  let selectedBlocks: SelectedBlock[] = [];
  let selectedModels: BaseBlockModel[] = [];
  const pageBlock = getDefaultPageBlock(page.root);
  // FIXME: missing selection in edgeless mode
  const state = pageBlock.selection?.state;
  const nativeSelection = window.getSelection();
  if (state?.type === 'block') {
    type = 'Block';
    const { selectedBlocks } = state;
    selectedModels = selectedBlocks.map(block => getModelByElement(block));
  } else if (nativeSelection && nativeSelection.type !== 'None') {
    type = nativeSelection.type as DomSelectionType;
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
    type,
    selectedBlocks,
  };
}

// Forward: ↓ → leave `affine-frame`
// Backward: ← ↑ leave `.affine-default-page-block-title-container`
function handleCrossFrameDragMove(
  e: SelectionEvent,
  container: HTMLElement,
  startRange: Range,
  currentRange: Range,
  isBackward: boolean
) {
  let isFrame = container.tagName === 'AFFINE-FRAME';

  if (isBackward) {
    // Reassign container when moving to title,
    // if you want to select a title you can rewrite this piece of logic
    if (
      container.classList.contains('affine-default-page-block-title-container')
    ) {
      isFrame = true;
      container = container
        .closest('.affine-default-page-block-container')
        ?.querySelector('affine-frame') as HTMLElement;
      assertExists(container);
    } else if (container.classList.contains('affine-frame-block-container')) {
      // In edgeless mode, there is no header.
      isFrame = true;
      container = container.parentElement as HTMLElement;
      assertExists(container);
    }
  }

  if (isFrame) {
    const newRange = computeCrossFrameRange(
      e.raw.clientX,
      e.raw.clientY,
      e.containerOffset,
      startRange,
      currentRange,
      isBackward,
      container
    );
    resetNativeSelection(newRange);
  } else {
    // ignore other elements, e.g., `.affine-frame-block-container`, `.affine-list-block__prefix`
    return;
  }
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
  // Range from current mouse position
  const currentRange = caretRangeFromPoint(e.raw.clientX, e.raw.clientY);
  if (!currentRange) return;

  assertExists(startRange);
  const { startContainer, startOffset, endContainer, endOffset } = startRange;
  const container = currentRange.commonAncestorContainer as HTMLElement;
  // Forward: ↓ →, Backward: ← ↑
  const isBackward = currentRange.comparePoint(endContainer, endOffset) === 1;

  // Handle native range state on cross-block dragging,
  // see https://github.com/toeverything/blocksuite/pull/845
  if (container.nodeType === Node.TEXT_NODE) {
    handleInFrameDragMove(
      startContainer,
      startOffset,
      endContainer,
      endOffset,
      currentRange,
      isBackward
    );
  } else {
    handleCrossFrameDragMove(
      e,
      container,
      startRange,
      currentRange,
      isBackward
    );
  }
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

/**
 * Save the current block selection. Can be restored with {@link restoreSelection}.
 *
 * See also {@link restoreSelection}
 *
 * Note: If only one block is selected, this function will return the same block twice still.
 * Note: If select multiple blocks, blocks in the middle will be skipped, only the first and last block will be returned.
 */
export const saveBlockSelection = (
  selection = window.getSelection()
): [SelectedBlock, SelectedBlock] => {
  assertExists(selection);
  const models = getModelsByRange(getCurrentRange(selection));
  const startPos = getQuillIndexByNativeSelection(
    selection.anchorNode,
    selection.anchorOffset,
    true
  );
  const endPos = getQuillIndexByNativeSelection(
    selection.focusNode,
    selection.focusOffset,
    false
  );

  return [
    { id: models[0].id, startPos, children: [] },
    { id: models[models.length - 1].id, endPos, children: [] },
  ];
};

/**
 * Restore the block selection.
 * See also {@link resetNativeSelection}
 */
export function restoreSelection(selectedBlocks: SelectedBlock[]) {
  const startBlock = selectedBlocks[0];
  const [startNode, startOffset] = getTextNodeBySelectedBlock(startBlock);

  const endBlock = selectedBlocks[selectedBlocks.length - 1];
  const [endNode, endOffset] = getTextNodeBySelectedBlock(endBlock);
  if (!startNode || !endNode) {
    console.warn(
      'restoreSelection: startNode or endNode is null',
      startNode,
      endNode
    );
    return;
  }

  const range = getCurrentRange();
  range.setStart(startNode, startOffset);
  range.setEnd(endNode, endOffset);
  resetNativeSelection(range);
  return range;
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
