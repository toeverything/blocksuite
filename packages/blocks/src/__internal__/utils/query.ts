import type { BaseBlockModel } from '@blocksuite/store';
import type { DefaultPageBlockComponent } from '../..';
import type { RichText } from '../rich-text/rich-text';
import { BLOCK_ID_ATTR as ATTR } from './consts';
import { assertExists, matchFlavours } from './std';

type ElementTagName = keyof HTMLElementTagNameMap;

interface ContainerBlock {
  model?: BaseBlockModel;
}

export function getBlockById<T extends ElementTagName>(
  id: string,
  ele: Element = document.body
) {
  return ele.querySelector<T>(`[${ATTR}="${id}"]` as T);
}

export function getParentBlockById<T extends ElementTagName>(
  id: string,
  ele: Element = document.body
) {
  const currentBlock = getBlockById<T>(id, ele);
  return currentBlock?.parentElement?.closest<T>(`[${ATTR}]` as T) || null;
}

export function getSiblingsById(id: string, ele: Element = document.body) {
  // TODO : resolve BaseBlockModel type relay
  const parentBlock = getParentBlockById(id, ele) as ContainerBlock;
  const children = parentBlock?.model?.children;
  if (children?.length) {
    const queryStr = children.map(child => `[${ATTR}='${child.id}']`).join(',');
    return Array.from(ele.querySelectorAll(queryStr));
  }
  return [];
}

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
  let currentBlock = getBlockById<'paragraph-block'>(blockId);
  if (currentBlock?.model.children.length) {
    return currentBlock.model.children[0];
  }
  while (currentBlock) {
    const parentBlock = getParentBlockById<'paragraph-block'>(
      currentBlock.model.id
    );
    if (parentBlock) {
      const nextSiblings = getNextSiblingById<'paragraph-block'>(
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
  const parentBlock = getParentBlockById<'paragraph-block'>(blockId, container);
  if (parentBlock) {
    const previousBlock = getPreviousSiblingById<'paragraph-block'>(
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
    commonAncestor = commonAncestor.closest(`[${ATTR}]`)
      ?.parentElement as HTMLElement;
  }
  const intersectedModels: BaseBlockModel[] = [];
  const blockElementArray = commonAncestor.querySelectorAll(`[${ATTR}]`);
  if (blockElementArray.length > 1) {
    blockElementArray.forEach(ele => {
      const block = ele as ContainerBlock;
      assertExists(block.model);
      // @ts-ignore
      const blockElement = getBlockElementByModel(block.model);
      const mainElement = matchFlavours(block.model, ['affine:page'])
        ? blockElement?.querySelector(
            '.affine-default-page-block-title-container'
          )
        : blockElement?.querySelector('rich-text');
      if (
        mainElement &&
        range.intersectsNode(mainElement) &&
        blockElement?.tagName !== 'GROUP-BLOCK'
      ) {
        // @ts-ignore
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

export function getCurrentRange() {
  const selection = window.getSelection() as Selection;
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
    if (ele instanceof Element && ele.hasAttribute('data-block-id')) {
      offset = 0;
      break;
    }
    if (!selfAdded) {
      selfAdded = true;
      offset += nodeOffset;
    } else {
      offset += textWithoutNode(ele as Node, lastNode as Node).length;
    }
    lastNode = ele;
    ele = ele?.parentNode;
  }
  return offset;
}
