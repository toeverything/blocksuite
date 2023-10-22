import type { BlockElement, RangeSyncFilter } from '@blocksuite/lit';

import { BLOCK_ID_ATTR } from '../../_legacy/consts.js';

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
        // doc mode title
        if (
          startBlock.model.flavour === 'affine:page' &&
          endBlock.model.flavour === 'affine:page' &&
          startContainer.parentElement?.closest(
            '[data-block-is-title="true"]'
          ) &&
          endContainer.parentElement?.closest('[data-block-is-title="true"]')
        ) {
          return true;
        }
        return (
          startBlock.model.role === 'content' &&
          endBlock.model.role === 'content'
        );
      }
    }

    return true;
  },
};
