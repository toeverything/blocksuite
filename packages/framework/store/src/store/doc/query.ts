import isMatch from 'lodash.ismatch';

import type { BlockModel } from '../../schema/index.js';
import type { Block } from './block/index.js';

import { BlockViewType } from './consts.js';

export type QueryMatch = {
  id?: string;
  flavour?: string;
  props?: Record<string, unknown>;
  viewType: BlockViewType;
};

/**
 * - `strict` means that only blocks that match the query will be included.
 * - `loose` means that all blocks will be included first, and then the blocks will be run through the query.
 * - `include` means that only blocks and their ancestors that match the query will be included.
 */
type QueryMode = 'strict' | 'loose' | 'include';

export type Query = {
  match: QueryMatch[];
  mode: QueryMode;
};

export function runQuery(query: Query, block: Block) {
  const blockViewType = getBlockViewType(query, block);
  block.blockViewType = blockViewType;

  if (blockViewType !== BlockViewType.Hidden) {
    const queryMode = query.mode;
    setAncestorsToDisplayIfHidden(queryMode, block);
  }
}

function getBlockViewType(query: Query, block: Block): BlockViewType {
  const flavour = block.model.flavour;
  const id = block.model.id;
  const queryMode = query.mode;
  const props = block.model.keys.reduce(
    (acc, key) => {
      return {
        ...acc,
        [key]: block.model[key as keyof BlockModel],
      };
    },
    {} as Record<string, unknown>
  );
  let blockViewType =
    queryMode === 'loose' ? BlockViewType.Display : BlockViewType.Hidden;

  query.match.some(queryObject => {
    const {
      id: queryId,
      flavour: queryFlavour,
      props: queryProps,
      viewType,
    } = queryObject;
    const matchQueryId = queryId == null ? true : queryId === id;
    const matchQueryFlavour =
      queryFlavour == null ? true : queryFlavour === flavour;
    const matchQueryProps =
      queryProps == null ? true : isMatch(props, queryProps);
    if (matchQueryId && matchQueryFlavour && matchQueryProps) {
      blockViewType = viewType;
      return true;
    }
    return false;
  });

  return blockViewType;
}

function setAncestorsToDisplayIfHidden(mode: QueryMode, block: Block) {
  const doc = block.model.doc;
  let parent = doc.getParent(block.model);
  while (parent) {
    const parentBlock = doc.getBlock(parent.id);
    if (parentBlock && parentBlock.blockViewType === BlockViewType.Hidden) {
      parentBlock.blockViewType =
        mode === 'include' ? BlockViewType.Display : BlockViewType.Bypass;
    }
    parent = doc.getParent(parent);
  }
}
