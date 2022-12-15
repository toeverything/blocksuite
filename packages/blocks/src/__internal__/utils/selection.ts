import type { BaseBlockModel, Page } from '@blocksuite/store';
import type { RichText } from '../rich-text/rich-text';
import { assertExists, caretRangeFromPoint, matchFlavours, sleep } from './std';
import type { SelectedBlock, SelectionInfo, SelectionPosition } from './types';
import {
  getBlockElementByModel,
  getDefaultPageBlock,
  getContainerByModel,
  getPreviousBlock,
  getNextBlock,
  getModelsByRange,
  getCurrentRange,
  getQuillIndexByNativeSelection,
  getModelByElement,
} from './query';
import { Rect } from './rect';
import type { SelectionEvent } from './gesture';

const SCROLL_THRESHOLD = 100;

// /[\p{Alphabetic}\p{Mark}\p{Decimal_Number}\p{Connector_Punctuation}\p{Join_Control}]/u
const notStrictCharacterReg = /[^\p{Alpha}\p{M}\p{Nd}\p{Pc}\p{Join_C}]/u;
const notStrictCharacterAndSpaceReg =
  /[^\p{Alpha}\p{M}\p{Nd}\p{Pc}\p{Join_C}\s]/u;

function forwardSelect(newRange: Range, range: Range) {
  if (!(newRange.endContainer.nodeType === Node.TEXT_NODE)) {
    const lastTextNode = getLastTextNode(newRange.endContainer);
    if (lastTextNode) {
      newRange = document.createRange();
      newRange.setStart(lastTextNode, lastTextNode.textContent?.length || 0);
      newRange.setEnd(lastTextNode, lastTextNode.textContent?.length || 0);
    }
  }
  range.setEnd(newRange.endContainer, newRange.endOffset);
}

function backwardSelect(newRange: Range, range: Range) {
  if (!(newRange.startContainer.nodeType === Node.TEXT_NODE)) {
    const firstTextNode = getFirstTextNode(newRange.startContainer);
    if (firstTextNode) {
      newRange = document.createRange();
      newRange.setStart(firstTextNode, 0);
      newRange.setEnd(firstTextNode, 0);
    }
  }
  range.setStart(newRange.endContainer, newRange.endOffset);
}

function fixCurrentRangeToText(
  x: number,
  y: number,
  range: Range,
  isForward: boolean
) {
  const endContainer = isForward ? range.endContainer : range.startContainer;
  let newRange: Range | null = range;
  if (endContainer.nodeType !== Node.TEXT_NODE) {
    const texts = Array.from(
      (range.commonAncestorContainer as HTMLElement).querySelectorAll(
        '.ql-editor'
      )
    );
    if (texts.length) {
      const text = isForward
        ? texts.reverse().find(t => {
            const rect = t.getBoundingClientRect();
            return y >= rect.top; // handle both drag downward, and rightward
          })
        : texts.find(t => {
            const rect = t.getBoundingClientRect();
            return y <= rect.bottom; // handle both drag upwards and leftward
          });
      if (!text) {
        throw new Error('Failed to focus text node!');
      }
      const rect = text.getBoundingClientRect();
      const newY = isForward ? rect.bottom - 6 : rect.top + 6;
      newRange = caretRangeFromPoint(x, newY);
      if (isForward && newRange) {
        forwardSelect(newRange, range);
      } else if (!isForward && newRange) {
        backwardSelect(newRange, range);
      }
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

async function setNewTop(y: number, editableContainer: Element) {
  const scrollContainer = editableContainer.closest('.affine-editor-container');
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
        await sleep();
        finalBottom = editableContainer.getBoundingClientRect().bottom;
      }
      return finalBottom - lineHeight / 2;
    }
    case false: {
      let finalTop = top;
      if (scrollContainer && top > clientHeight - SCROLL_THRESHOLD) {
        scrollContainer.scrollTop =
          scrollContainer.scrollTop + (top + SCROLL_THRESHOLD - clientHeight);
        // set scroll may has a animation, wait for over
        await sleep();
        finalTop = editableContainer.getBoundingClientRect().top;
      }
      return finalTop + lineHeight / 2;
    }
  }
}

export async function focusRichText(
  position: SelectionPosition,
  editableContainer: Element
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

function focusRichTextByModel(
  position: SelectionPosition,
  model: BaseBlockModel
) {
  const defaultPageBlock = getDefaultPageBlock(model);
  if (matchFlavours(model, ['affine:embed', 'affine:divider'])) {
    defaultPageBlock.selection.state.clear();
    const rect = getBlockElementByModel(model)?.getBoundingClientRect();
    rect && defaultPageBlock.signals.updateSelectedRects.emit([rect]);
    const embedElement = getBlockElementByModel(model);
    assertExists(embedElement);
    defaultPageBlock.selection.state.selectedBlocks.push(embedElement);
    defaultPageBlock.selection.state.type = 'block';
    window.getSelection()?.removeAllRanges();
    (document.activeElement as HTMLInputElement).blur();
  } else {
    const element = getBlockElementByModel(model);
    const editableContainer = element?.querySelector('[contenteditable]');
    defaultPageBlock.selection.state.clear();
    if (editableContainer) {
      focusRichText(position, editableContainer);
    }
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

export function resetNativeSelection(range: Range | null) {
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
export function isMultiBlockRange(range: Range) {
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
export function isMultiLineRange(range: Range) {
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

  let type = 'None';
  let selectedBlocks: SelectedBlock[] = [];
  let selectedModels: BaseBlockModel[] = [];
  const pageBlock = getDefaultPageBlock(page.root);
  const { state } = pageBlock.selection;
  const nativeSelection = window.getSelection();
  if (state.type === 'block') {
    type = 'Block';
    const { selectedBlocks } = state;
    selectedModels = selectedBlocks.map(block => getModelByElement(block));
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
  resetNativeSelection(currentRange);
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

export function handleNativeRangeClick(page: Page, e: SelectionEvent) {
  const range = caretRangeFromPoint(e.raw.clientX, e.raw.clientY);
  const startContainer = range?.startContainer;
  // if not left click
  if (e.button) {
    return;
  }
  // click on rich text
  if (startContainer instanceof Node) {
    resetNativeSelection(range);
  }

  if (!(startContainer instanceof HTMLElement)) return;

  if (
    isBlankAreaBetweenBlocks(startContainer) ||
    isBlankAreaBeforeFirstBlock(startContainer)
  ) {
    focusRichTextByOffset(startContainer, e.raw.clientX);
  } else if (isBlankAreaAfterLastBlock(startContainer)) {
    const { root } = page;
    const lastChild = root?.lastChild();
    assertExists(lastChild);
    if (matchFlavours(lastChild, ['affine:paragraph', 'affine:list'])) {
      const block = getBlockElementByModel(lastChild);
      if (!block) return;
      focusRichTextByOffset(block, e.raw.clientX);
    }
  }
}

export function handleNativeRangeDblClick(page: Page, e: SelectionEvent) {
  const selection = window.getSelection();
  if (selection && selection.isCollapsed && selection.anchorNode) {
    const editableContainer =
      selection.anchorNode.parentElement?.closest('[contenteditable]');
    if (editableContainer) {
      expandRangesByCharacter(selection, editableContainer);
    }
  }
}

function expandRangesByCharacter(
  selection: Selection,
  editableContainer: Node
) {
  const leafNodes = leftFirstSearchLeafNodes(editableContainer);
  if (!leafNodes.length) {
    return;
  }
  const [newRange, currentChar, currentNodeIndex] = getNewRangeForDblClick(
    leafNodes,
    selection
  );
  // try select range by segmenter
  trySelectBySegmenter(
    selection,
    newRange,
    currentChar,
    leafNodes,
    currentNodeIndex
  );
  resetNativeSelection(newRange);
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

export function getSplicedTitle(title: HTMLInputElement) {
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

export function restoreSelection(range: Range) {
  const selection = window.getSelection();
  assertExists(selection);
  selection.removeAllRanges();
  selection.addRange(range);
}
