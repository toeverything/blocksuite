import { BaseBlockModel } from '@blocksuite/store';
import { BLOCK_ID_ATTR } from './consts';

type ElementTagName = keyof HTMLElementTagNameMap;

export function getBlockById<T extends ElementTagName>(
  id: string,
  ele: HTMLElement = document.body
) {
  return ele.querySelector<T>(`[${BLOCK_ID_ATTR}="${id}"]` as T);
}

export function getParentBlockById<T extends ElementTagName>(
  id: string,
  ele: HTMLElement = document.body
) {
  const currentBlock = getBlockById<T>(id, ele);
  return (
    currentBlock?.parentElement?.closest<T>(`[${BLOCK_ID_ATTR}]` as T) || null
  );
}

export function getSiblingsById(id: string, ele: HTMLElement = document.body) {
  // TODO : resolve BaseBlockModel type relay
  const parentBlock = getParentBlockById(id, ele) as {
    model?: BaseBlockModel;
  };
  const children = parentBlock?.model?.children;
  if (children?.length) {
    const queryStr = children
      .map(child => `[${BLOCK_ID_ATTR}='${child.id}']`)
      .join(',');
    return Array.from(ele.querySelectorAll(queryStr));
  }
  return [];
}

export function getPreviousSiblingById<T extends ElementTagName>(
  id: string,
  ele: HTMLElement = document.body
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
