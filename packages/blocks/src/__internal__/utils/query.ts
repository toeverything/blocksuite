import { BaseBlockModel } from '@blocksuite/store';
import { DefaultPageBlockComponent } from '../..';
import { RichText } from '../rich-text/rich-text';
import { BLOCK_ID_ATTR as ATTR } from './consts';
import { assertExists } from './std';

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
        let firstChildren =
          previousBlock.model.children[previousBlock.children.length - 1];
        while (firstChildren.children.length) {
          firstChildren =
            firstChildren.children[firstChildren.children.length - 1];
        }
        return firstChildren;
      }
      return previousBlock.model;
    }
    return parentBlock.model;
  }
  return null;
}

export function getDefaultPageBlock(model: BaseBlockModel) {
  assertExists(model.store.root);
  const page = document.querySelector(
    `[${ATTR}="${model.store.root.id}"]`
  ) as DefaultPageBlockComponent;
  return page;
}

export function getContainerByModel(model: BaseBlockModel) {
  assertExists(model.store.root);
  const page = document.querySelector(
    `[${ATTR}="${model.store.root.id}"]`
  ) as DefaultPageBlockComponent;
  const container = page.closest('editor-container');
  assertExists(container);
  return container;
}

export function getBlockElementByModel(model: BaseBlockModel) {
  assertExists(model.store.root);
  const page = document.querySelector(
    `[${ATTR}="${model.store.root.id}"]`
  ) as DefaultPageBlockComponent;

  const element = page.querySelector(`[${ATTR}="${model.id}"]`);
  assertExists(element);
  return element as HTMLElement;
}

export function getStartModelBySelection() {
  const selection = window.getSelection() as Selection;

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
  const richText = blockElement.querySelector('rich-text') as RichText;
  if (!richText) return null;
  return richText;
}

export function getModelsByRange(range: Range): BaseBlockModel[] {
  let commonAncestor = range.commonAncestorContainer as HTMLElement;
  if(!commonAncestor.attributes.getNamedItem(ATTR)) {
    commonAncestor = commonAncestor.closest(`[${ATTR}]`)?.parentElement as HTMLElement;
  }
  const intersectedModels:BaseBlockModel[] = []
  let blockElementArray = commonAncestor.querySelectorAll(`[${ATTR}]`)
  console.log('blockElementArray: ', blockElementArray);
  if (blockElementArray.length > 1) {
    blockElementArray.forEach(ele => {
      const block = ele as ContainerBlock;
      assertExists(block.model);
      // @ts-ignore
       const blockElement = getBlockElementByModel(block.model);
         if(range.intersectsNode(blockElement)){
          // @ts-ignore
        intersectedModels.push(block.model);
      }
    })
    return intersectedModels;
  }
  return [getStartModelBySelection()];
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
