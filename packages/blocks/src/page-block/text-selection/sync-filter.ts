import type { RangeSyncFilter } from '@blocksuite/lit';

import { BLOCK_ID_ATTR } from '../../__internal__/consts.js';

export const pageRangeSyncFilter: RangeSyncFilter = {
  rangeToTextSelection: range => {
    if (range) {
      const { startContainer, endContainer } = range;

      const startBlock = startContainer.parentElement?.closest(
        `[${BLOCK_ID_ATTR}]`
      );
      const endBlock = endContainer.parentElement?.closest(
        `[${BLOCK_ID_ATTR}]`
      );

      if (startBlock && endBlock) {
        return startBlock.role === 'content' && endBlock.role === 'content';
      }
    }

    return true;
  },
};
