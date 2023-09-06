import { type BaseSelection, PathFinder } from '@blocksuite/block-std';
import type { BlockElement } from '@blocksuite/lit';
import type { BaseBlockModel } from '@blocksuite/store';

import type { ParagraphBlockModel } from '../../paragraph-block/index.js';
import { DEFAULT_DRAG_HANDLE_CONTAINER_HEIGHT } from './config.js';

const heightMap: { [key: string]: number } = {
  text: 23,
  h1: 40,
  h2: 36,
  h3: 32,
  h4: 32,
  h5: 28,
  h6: 26,
  quote: 46,
  list: 32,
  database: 28,
  image: 28,
  divider: 36,
};

export const getDragHandleContainerHeight = (model: BaseBlockModel) => {
  const flavour = model.flavour;
  const index = flavour.indexOf(':');
  let key = flavour.slice(index + 1);
  if (key === 'paragraph' && (model as ParagraphBlockModel).type) {
    key = (model as ParagraphBlockModel).type;
  }

  const height = heightMap[key] ?? DEFAULT_DRAG_HANDLE_CONTAINER_HEIGHT;

  return height;
};

// To check if the block is a child block of the selected blocks
export const containChildBlock = (
  selections: BaseSelection[],
  childPath: string[]
) => {
  return selections.some(selection => {
    const { path } = selection;
    return PathFinder.includes(childPath, path);
  });
};

export const containBlock = (blockIDs: string[], targetID: string) => {
  return blockIDs.some(blockID => blockID === targetID);
};

// TODO: this is a hack, need to find a better way
export const insideDatabaseTable = (element: Element) => {
  return !!element.closest('.affine-database-block-table');
};

export const captureEventTarget = (target: EventTarget | null) => {
  const isElementOrNode = target instanceof Element || target instanceof Node;
  return isElementOrNode
    ? target instanceof Element
      ? target
      : target.parentElement
    : null;
};

export const getNoteId = (blockElement: BlockElement) => {
  let element = blockElement;
  while (element && element.flavour !== 'affine:note') {
    element = element.parentBlockElement;
  }

  return element.model.id;
};

export const includeTextSelection = (selections: BaseSelection[]) => {
  return selections.some(selection => selection.type === 'text');
};

/**
 * Check if the path of two blocks are equal
 */
export const isBlockPathEqual = (
  path1: string[] | null | undefined,
  path2: string[] | null | undefined
) => {
  if (!path1 || !path2) {
    return false;
  }
  return PathFinder.equals(path1, path2);
};
