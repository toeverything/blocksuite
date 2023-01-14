import type { BaseBlockModel } from '@blocksuite/store';
import type { LeafBlot } from 'parchment';
import type { DefaultPageBlockComponent, SelectedBlock } from '../../index.js';
import { ShapeBlockTag } from '../../index.js';
import type { RichText } from '../rich-text/rich-text.js';
import { BLOCK_ID_ATTR as ATTR } from './consts.js';
import type { IPoint } from './gesture.js';
import { assertExists, matchFlavours } from '@blocksuite/global/utils';

type ElementTagName = keyof HTMLElementTagNameMap;

interface ContainerBlock {
  model?: BaseBlockModel;
}

export function getShapeBlockHitBox(id: string): SVGPathElement | null {
  const shapeBlock = getBlockById<'affine-shape'>(id);
  if (shapeBlock?.tagName !== ShapeBlockTag.toUpperCase()) {
    throw new Error(`${ATTR}: ${id} is not shape block`);
  }
  return (
    shapeBlock.shadowRoot?.querySelector('.affine-shape-block-hit-box') ?? null
  );
}

export function getBlockById<T extends ElementTagName>(
  id: string,
  container: Element = document.body
) {
  return container.querySelector<T>(`[${ATTR}="${id}"]` as T);
}

export function getBlockByPoint(point: IPoint): Element | null | undefined {
  return document.elementFromPoint(point.x, point.y)?.closest(`[${ATTR}]`);
}

export function getParentBlockById<T extends ElementTagName>(
  id: string,
  ele: Element = document.body
) {
  const currentBlock = getBlockById<T>(id, ele);
  return currentBlock?.parentElement?.closest<T>(`[${ATTR}]` as T) || null;
}

/**
 * @deprecated use methods in page instead
 */
function getSiblingsById(id: string, ele: Element = document.body) {
  // TODO : resolve BaseBlockModel type relay
  const parentBlock = getParentBlockById(id, ele) as ContainerBlock;
  const children = parentBlock?.model?.children;
  if (children?.length) {
    const queryStr = children.map(child => `[${ATTR}='${child.id}']`).join(',');
    return Array.from(ele.querySelectorAll(queryStr));
  }
  return [];
}

/**
 * @deprecated use {@link page.getPreviousSibling} instead
 */
export function getPreviousSiblingById<T extends ElementTagName>(
  id: string,
  ele: Element = document.body
) {
  const siblings = getSiblingsById(id, ele);
  const currentBlock = getBlockById<T>(id, ele);
  if (siblings && siblings.length > 0 && currentBlock) {
    const index = [...siblings].indexOf(currentBlock);
    return (siblings[index - 1] as HTMLElementTagNameMap[T]) || null;
  }
  return null;
}

/**
 * @deprecated use {@link page.getNextSibling} instead
 */
export function getNextSiblingById<T extends ElementTagName>(
  id: string,
  ele: HTMLElement = document.body
) {
  const siblings = getSiblingsById(id, ele);
  const currentBlock = getBlockById(id, ele);
  if (siblings && siblings.length > 0 && currentBlock) {
    const index = [...siblings].indexOf(currentBlock);
    return (siblings[index + 1] as HTMLElementTagNameMap[T]) || null;
  }
  return null;
}

export function getNextBlock(blockId: string) {
  let currentBlock = getBlockById<'affine-paragraph'>(blockId);
  if (currentBlock?.model.children.length) {
    return currentBlock.model.children[0];
  }
  while (currentBlock) {
    const parentBlock = getParentBlockById<'affine-paragraph'>(
      currentBlock.model.id
    );
    if (parentBlock) {
      const nextSiblings = getNextSiblingById<'affine-paragraph'>(
        currentBlock.model.id
      );
      if (nextSiblings) {
        return nextSiblings.model;
      }
    }
    currentBlock = parentBlock;
  }
  return null;
}

export function getPreviousBlock(container: Element, blockId: string) {
  const parentBlock = getParentBlockById<'affine-paragraph'>(
    blockId,
    container
  );
  if (parentBlock) {
    const previousBlock = getPreviousSiblingById<'affine-paragraph'>(
      blockId,
      container
    );

    if (previousBlock?.model) {
      if (previousBlock.model.children.length) {
        let firstChild =
          previousBlock.model.children[previousBlock.model.children.length - 1];
        while (firstChild.children.length) {
          firstChild = firstChild.children[firstChild.children.length - 1];
        }
        return firstChild;
      }
      return previousBlock.model;
    }
    return parentBlock.model;
  }
  return null;
}

export function getDefaultPageBlock(model: BaseBlockModel) {
  assertExists(model.page.root);
  const page = document.querySelector(
    `[${ATTR}="${model.page.root.id}"]`
  ) as DefaultPageBlockComponent;
  return page;
}

export function getContainerByModel(model: BaseBlockModel) {
  assertExists(model.page.root);
  const page = document.querySelector(
    `[${ATTR}="${model.page.root.id}"]`
  ) as DefaultPageBlockComponent;
  const container = page.closest('editor-container');
  assertExists(container);
  return container;
}

export function getBlockElementByModel(model: BaseBlockModel) {
  assertExists(model.page.root);
  const page = document.querySelector(
    `[${ATTR}="${model.page.root.id}"]`
  ) as DefaultPageBlockComponent;
  if (!page) return null;

  if (model.id === model.page.root.id) {
    return page as HTMLElement;
  }

  const element = page.querySelector(`[${ATTR}="${model.id}"]`);
  return element as HTMLElement | null;
}

export function getStartModelBySelection() {
  const selection = window.getSelection() as Selection;
  if (selection.rangeCount === 0) {
    throw new Error("Can't get start model by selection, rangeCount is 0");
  }

  const range = selection.getRangeAt(0);
  const startContainer =
    range.startContainer instanceof Text
      ? (range.startContainer.parentElement as HTMLElement)
      : (range.startContainer as HTMLElement);

  const startComponent = startContainer.closest(`[${ATTR}]`) as ContainerBlock;
  const startModel = startComponent.model as BaseBlockModel;
  return startModel;
}

export function getRichTextByModel(model: BaseBlockModel) {
  const blockElement = getBlockElementByModel(model);
  const richText = blockElement?.querySelector('rich-text') as RichText;
  if (!richText) return null;
  return richText;
}

export function getModelsByRange(range: Range): BaseBlockModel[] {
  let commonAncestor = range.commonAncestorContainer as HTMLElement;
  if (commonAncestor.nodeType === Node.TEXT_NODE) {
    return [getStartModelBySelection()];
  }
  if (
    commonAncestor.attributes &&
    !commonAncestor.attributes.getNamedItem(ATTR)
  ) {
    const parentElement = commonAncestor.closest(`[${ATTR}]`)
      ?.parentElement as HTMLElement;
    if (parentElement != null) {
      commonAncestor = parentElement;
    }
  }
  const intersectedModels: BaseBlockModel[] = [];
  const blockElementArray = commonAncestor.querySelectorAll(`[${ATTR}]`);
  if (blockElementArray.length > 1) {
    blockElementArray.forEach(ele => {
      const block = ele as ContainerBlock;
      assertExists(block.model);
      const blockElement = getBlockElementByModel(block.model);
      const mainElement = matchFlavours(block.model, ['affine:page'])
        ? blockElement?.querySelector(
            '.affine-default-page-block-title-container'
          )
        : blockElement?.querySelector('rich-text');
      if (
        mainElement &&
        range.intersectsNode(mainElement) &&
        blockElement?.tagName !== 'AFFINE-FRAME'
      ) {
        intersectedModels.push(block.model);
      }
    });
    return intersectedModels;
  }
  return [getStartModelBySelection()];
}

export function getModelByElement(element: Element): BaseBlockModel {
  const containerBlock = element.closest(`[${ATTR}]`) as ContainerBlock;
  assertExists(containerBlock.model);
  return containerBlock.model;
}

function mergeRect(a: DOMRect, b: DOMRect) {
  return new DOMRect(
    Math.min(a.left, b.left),
    Math.min(a.top, b.top),
    Math.max(a.right, b.right) - Math.min(a.left, b.left),
    Math.max(a.bottom, b.bottom) - Math.min(a.top, b.top)
  );
}

export function getDOMRectByLine(
  rectList: DOMRectList,
  lineType: 'first' | 'last'
) {
  const list = Array.from(rectList);

  if (lineType === 'first') {
    let flag = 0;
    for (let i = 0; i < list.length; i++) {
      if (list[i].left < 0 && list[i].right < 0 && list[i].height === 1) break;
      flag = i;
    }
    const subList = list.slice(0, flag + 1);
    return subList.reduce(mergeRect);
  } else {
    let flag = list.length - 1;
    for (let i = list.length - 1; i >= 0; i--) {
      if (list[i].height === 0) break;
      flag = i;
    }
    const subList = list.slice(flag);
    return subList.reduce(mergeRect);
  }
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

function textWithoutNode(parentNode: Node, currentNode: Node) {
  let text = '';
  for (let i = 0; i < parentNode.childNodes.length; i++) {
    const node = parentNode.childNodes[i];

    if (node !== currentNode || !currentNode.contains(node)) {
      // @ts-ignore
      text += node.textContent || node.innerText || '';
    } else {
      return text;
    }
  }
  return text;
}

export function getQuillIndexByNativeSelection(
  ele: Node | null | undefined,
  nodeOffset: number,
  isStart: boolean
) {
  if (
    ele instanceof Element &&
    ele.classList.contains('affine-default-page-block-title-container')
  ) {
    return (
      (isStart
        ? ele.querySelector('input')?.selectionStart
        : ele.querySelector('input')?.selectionEnd) || 0
    );
  }

  let offset = 0;
  let lastNode = ele;
  let selfAdded = false;
  while (
    ele &&
    // @ts-ignore
    (!lastNode?.getAttributeNode ||
      // @ts-ignore
      !lastNode.getAttributeNode('contenteditable'))
  ) {
    if (ele instanceof Element && ele.hasAttribute(ATTR)) {
      offset = 0;
      break;
    }
    if (!selfAdded) {
      selfAdded = true;
      offset += nodeOffset;
    } else {
      offset += textWithoutNode(ele, lastNode as Node).length;
    }
    lastNode = ele;
    ele = ele?.parentNode;
  }
  return offset;
}

/**
 * Get the specific text node and offset by the selected block.
 * The reverse implementation of {@link getQuillIndexByNativeSelection}
 * See also {@link getQuillIndexByNativeSelection}
 *
 * ```ts
 * const [startNode, startOffset] = getTextNodeBySelectedBlock(startBlock);
 * const [endNode, endOffset] = getTextNodeBySelectedBlock(endBlock);
 *
 * const range = new Range();
 * range.setStart(startNode, startOffset);
 * range.setEnd(endNode, endOffset);
 *
 * const selection = window.getSelection();
 * selection.removeAllRanges();
 * selection.addRange(range);
 * ```
 */
export function getTextNodeBySelectedBlock(selectedBlock: SelectedBlock) {
  const blockElement = getBlockById(selectedBlock.id);
  const offset = selectedBlock.startPos ?? selectedBlock.endPos ?? 0;
  if (!blockElement) {
    throw new Error(
      'Failed to get block element, block id: ' + selectedBlock.id
    );
  }
  const richText = blockElement.querySelector('rich-text');
  if (!richText) {
    throw new Error('Failed to get rich text element');
  }
  const quill = richText.quill;

  const [leaf, leafOffset]: [LeafBlot, number] = quill.getLeaf(offset);
  return [leaf.domNode, leafOffset] as const;
}

export function getAllBlocks() {
  const blocks = Array.from(document.querySelectorAll(`[${ATTR}]`));
  return blocks.filter(item => {
    return (
      item.tagName !== 'AFFINE-DEFAULT-PAGE' && item.tagName !== 'AFFINE-FRAME'
    );
  });
}
