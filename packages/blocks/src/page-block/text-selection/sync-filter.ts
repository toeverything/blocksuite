import type { BlockElement, RangeSyncFilter } from '@blocksuite/lit';

import { BLOCK_ID_ATTR } from '../../__internal__/consts.js';

export const pageRangeSyncFilter: RangeSyncFilter = {
  rangeToTextSelection: range => {
    if (range) {
      const { startContainer, endContainer } = range;

      const startBlock = startContainer.parentElement?.closest<BlockElement>(
        `[${BLOCK_ID_ATTR}]`
      );
      const endBlock = endContainer.parentElement?.closest<BlockElement>(
        `[${BLOCK_ID_ATTR}]`
      );

      if (startBlock && endBlock) {
        return (
          startBlock.model.role === 'content' &&
          endBlock.model.role === 'content'
        );
      }
    }

    return true;
  },
};
