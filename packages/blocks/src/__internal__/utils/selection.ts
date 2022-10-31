import type { BaseBlockModel, Store } from '@blocksuite/store';
import { RichText } from '../rich-text/rich-text';
import { assertExists, caretRangeFromPoint, matchFlavours } from './std';
import { SelectedBlock, SelectionInfo, SelectionPosition } from './types';
import {
  getBlockElementByModel,
  getDefaultPageBlock,
  getContainerByModel,
  getPreviousBlock,
  getNextBlock,
  getModelsByRange,
  getCurrentRange,
  getQuillIndexByNativeSelection,
} from './query';
import { Point, Rect } from './rect';
import type { SelectionEvent } from './gesture';

// /[\p{Alphabetic}\p{Mark}\p{Decimal_Number}\p{Connector_Punctuation}\p{Join_Control}]/u
const notStrictCharacterReg = /[^\p{Alpha}\p{M}\p{Nd}\p{Pc}\p{Join_C}]/u;
const notStrictCharacterAndSpaceReg =
  /[^\p{Alpha}\p{M}\p{Nd}\p{Pc}\p{Join_C}\s]/u;

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
      let text: Element | undefined = undefined;
      if (isForward) {
        text = texts.reverse().find(t => {
          const rect = t.getBoundingClientRect();
          return y >= rect.bottom;
        });
        if (text) {
          const rect = text.getBoundingClientRect();
          const y = rect.bottom - 6;
          newRange = caretRangeFromPoint(x, y);
          if (newRange) {
            range.setEnd(newRange.endContainer, newRange.endOffset);
          }
        }
      } else {
        text = texts.find(t => {
          const rect = t.getBoundingClientRect();
          return y <= rect.top;
        });
        if (text) {
          const rect = text.getBoundingClientRect();
          const y = rect.top + 6;
          newRange = caretRangeFromPoint(x, y);
          if (newRange) {
            range.setStart(newRange.endContainer, newRange.endOffset);
          }
        }
      }
    }
  }
  return range;
}

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
    resetNativeSelection(range);
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
  resetNativeSelection(range);
}

function focusRichTextByModel(
  position: SelectionPosition,
  model: BaseBlockModel
) {
  if (model.flavour === 'group') {
    (
      document.querySelector(
        '.affine-default-page-block-title'
      ) as HTMLInputElement
    ).focus();
  } else {
    const element = getBlockElementByModel(model);
    const editableContainer = element?.querySelector('[contenteditable]');
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

export function handleNativeRangeClick(store: Store, e: SelectionEvent) {
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
    const { root } = store;
    const lastChild = root?.lastChild();
    assertExists(lastChild);
    if (matchFlavours(lastChild, ['paragraph', 'list'])) {
      const block = getBlockElementByModel(lastChild);
      if (!block) return;
      focusRichTextByOffset(block, e.raw.clientX);
    }
  }
}

export function handleNativeRangeDblClick(store: Store, e: SelectionEvent) {
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
    startNode = currentTextNode;
    endNode = currentTextNode;
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
            startNode = node;
            startOffset = reverseText.length - index;
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
            endNode = node;
            endOffset =
              j === currentNodeIndex ? selection.anchorOffset + index : index;
            break;
          }
        }
      }
    }
  }
  const newRange = document.createRange();
  newRange.setStart(startNode, startOffset);
  newRange.setEnd(endNode, endOffset);
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
  return leafNodes;
}

export function getSplicedTitle(title: HTMLInputElement) {
  const text = [...title.value];
  assertExists(title.selectionStart);
  assertExists(title.selectionEnd);
  text.splice(title.selectionStart, title.selectionEnd - title.selectionStart);
  return text.join('');
}
