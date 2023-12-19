import type { BlockElement, RangeSyncFilter } from '@blocksuite/lit';

import { BLOCK_ID_ATTR } from '../../_common/consts.js';

export const pageRangeSyncFilter: RangeSyncFilter = {
  rangeToTextSelection: range => {
    if (range) {
      const startElement =
        range.startContainer instanceof Element
          ? range.startContainer
          : range.startContainer.parentElement;
      const endElement =
        range.endContainer instanceof Element
          ? range.endContainer
          : range.endContainer.parentElement;
      const startBlock = startElement?.closest<BlockElement>(
        `[${BLOCK_ID_ATTR}]`
      );
      const endBlock = endElement?.closest<BlockElement>(`[${BLOCK_ID_ATTR}]`);

      if (startBlock && endBlock) {
        //FIXME: use `rich-text` in page title
        // doc mode title
        if (
          startBlock.model.flavour === 'affine:page' &&
          endBlock.model.flavour === 'affine:page' &&
          startElement?.closest('.doc-title-container') &&
          endElement?.closest('.doc-title-container')
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
